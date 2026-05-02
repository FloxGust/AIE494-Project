import os
import time
import numpy as np
import torch
import onnxruntime as ort
from transformers import AutoFeatureExtractor, ResNetForImageClassification
from PIL import Image

RUNS = 50
DUMMY_IMAGE = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
extractor = AutoFeatureExtractor.from_pretrained("microsoft/resnet-50")
inputs_pt = extractor(images=DUMMY_IMAGE, return_tensors="pt")
inputs_np = extractor(images=DUMMY_IMAGE, return_tensors="np")


def bench_pytorch():
    model = ResNetForImageClassification.from_pretrained("artifacts/resnet50_pytorch")
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


print(f"{'Model':<25} {'Size (MB)':>10} {'Latency (ms)':>14}")
print("-" * 52)

pt_lat = bench_pytorch()
print(f"{'PyTorch (original)':<25} {file_mb('artifacts/resnet50_pytorch/model.safetensors'):>10.1f} {pt_lat:>14.2f}")

onnx_lat = bench_onnx("artifacts/resnet50.onnx")
print(f"{'ONNX':<25} {file_mb('artifacts/resnet50.onnx'):>10.1f} {onnx_lat:>14.2f}")

quant_lat = bench_onnx("artifacts/resnet50.quant.onnx")
print(f"{'ONNX Quantized':<25} {file_mb('artifacts/resnet50.quant.onnx'):>10.1f} {quant_lat:>14.2f}")
