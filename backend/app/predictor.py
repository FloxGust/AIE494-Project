import os
import pathlib
import time
import numpy as np
import torch
import onnxruntime as ort
from PIL import Image
from transformers import AutoConfig, AutoImageProcessor

_ARTIFACTS = pathlib.Path(__file__).resolve().parent.parent / "artifacts"

EXTRACTOR = AutoImageProcessor.from_pretrained("microsoft/resnet-50")
_config = AutoConfig.from_pretrained(str(_ARTIFACTS / "resnet50_pytorch"))
ID2LABEL = _config.id2label

_MODEL_FILES = {
    "original": _ARTIFACTS / "resnet50_pytorch" / "model.safetensors",
    "onnx": _ARTIFACTS / "resnet50.onnx",
    "quantized": _ARTIFACTS / "resnet50.quant.onnx",
}

MODEL_SIZE_MB = {k: os.path.getsize(str(v)) / 1024 / 1024 for k, v in _MODEL_FILES.items()}

_cache: dict = {}


def _softmax(x: np.ndarray) -> np.ndarray:
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


def predict(image: Image.Image, model_type: str = "quantized", file_name: str = "") -> dict:
    inputs = EXTRACTOR(images=image, return_tensors="np")
    pixel_values = inputs["pixel_values"].astype(np.float32)

    if model_type == "original":
        if "pytorch" not in _cache:
            from transformers import ResNetForImageClassification
            m = ResNetForImageClassification.from_pretrained(str(_ARTIFACTS / "resnet50_pytorch"))
            m.eval()
            _cache["pytorch"] = m
        model = _cache["pytorch"]
        pt_inputs = EXTRACTOR(images=image, return_tensors="pt")
        start = time.perf_counter()
        with torch.no_grad():
            outputs = model(**pt_inputs)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logits = outputs.logits[0].numpy()
    else:
        onnx_file = "resnet50.onnx" if model_type == "onnx" else "resnet50.quant.onnx"
        if onnx_file not in _cache:
            _cache[onnx_file] = ort.InferenceSession(str(_ARTIFACTS / onnx_file))
        sess = _cache[onnx_file]
        input_name = sess.get_inputs()[0].name
        start = time.perf_counter()
        outputs = sess.run(None, {input_name: pixel_values})
        elapsed_ms = (time.perf_counter() - start) * 1000
        logits = outputs[0][0]

    predicted_id = int(np.argmax(logits))
    confidence = float(_softmax(logits)[predicted_id])

    return {
        "label": ID2LABEL.get(predicted_id, str(predicted_id)),
        "confidence": confidence,
        "inference_time_ms": elapsed_ms,
        "model_used": model_type,
        "model_size_mb": MODEL_SIZE_MB[model_type],
        "file_name": file_name,
    }
