import json
import os
import pathlib
import time
import datetime
import uuid
import numpy as np
import torch
import onnxruntime as ort
from transformers import AutoImageProcessor, ResNetForImageClassification
from PIL import Image

ARTIFACTS_DIR = pathlib.Path(__file__).resolve().parent.parent / "artifacts"
RESULTS_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "Results"
RESULTS_DIR.mkdir(exist_ok=True)

RUNS = 50
DUMMY_IMAGE = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
extractor = AutoImageProcessor.from_pretrained("microsoft/resnet-50")
inputs_pt = extractor(images=DUMMY_IMAGE, return_tensors="pt")
inputs_np = extractor(images=DUMMY_IMAGE, return_tensors="np")


def bench_pytorch():
    model = ResNetForImageClassification.from_pretrained(str(ARTIFACTS_DIR / "resnet50_pytorch"))
    model.eval()
    with torch.no_grad():
        for _ in range(5):
            model(**inputs_pt)
        start = time.perf_counter()
        for _ in range(RUNS):
            model(**inputs_pt)
    return (time.perf_counter() - start) / RUNS * 1000


def bench_onnx(path: str):
    sess = ort.InferenceSession(path)
    name = sess.get_inputs()[0].name
    pixel_values = inputs_np["pixel_values"].astype(np.float32)
    for _ in range(5):
        sess.run(None, {name: pixel_values})
    start = time.perf_counter()
    for _ in range(RUNS):
        sess.run(None, {name: pixel_values})
    return (time.perf_counter() - start) / RUNS * 1000


def file_mb(path: str) -> float:
    return os.path.getsize(path) / 1024 / 1024


def save_result(name: str, size_mb: float, latency_ms: float):
    data = {
        "id": str(uuid.uuid4()),
        "model": name,
        "size_mb": round(size_mb, 2),
        "latency_ms": round(latency_ms, 2),
        "runs": RUNS,
        "timestamp": datetime.datetime.now().isoformat(),
    }
    with open(RESULTS_DIR / f"{name}.json", "w") as f:
        json.dump(data, f, indent=2)


print(f"{'Model':<25} {'Size (MB)':>10} {'Latency (ms)':>14}")
print("-" * 52)

pt_size = file_mb(str(ARTIFACTS_DIR / "resnet50_pytorch" / "model.safetensors"))
pt_lat = bench_pytorch()
print(f"{'PyTorch (original)':<25} {pt_size:>10.1f} {pt_lat:>14.2f}")
save_result("original", pt_size, pt_lat)

onnx_path = str(ARTIFACTS_DIR / "resnet50.onnx")
onnx_size = file_mb(onnx_path)
onnx_lat = bench_onnx(onnx_path)
print(f"{'ONNX':<25} {onnx_size:>10.1f} {onnx_lat:>14.2f}")
save_result("onnx", onnx_size, onnx_lat)

quant_path = str(ARTIFACTS_DIR / "resnet50.quant.onnx")
quant_size = file_mb(quant_path)
quant_lat = bench_onnx(quant_path)
print(f"{'ONNX Quantized':<25} {quant_size:>10.1f} {quant_lat:>14.2f}")
save_result("quantized", quant_size, quant_lat)

print(f"\nResults saved to {RESULTS_DIR}")
