import time
import numpy as np
import onnxruntime as ort
from PIL import Image
from transformers import AutoFeatureExtractor, ResNetForImageClassification

EXTRACTOR = AutoFeatureExtractor.from_pretrained("microsoft/resnet-50")
_model_config = ResNetForImageClassification.from_pretrained("artifacts/resnet50_pytorch").config
ID2LABEL = _model_config.id2label

SESSION = ort.InferenceSession("artifacts/resnet50.quant.onnx")
INPUT_NAME = SESSION.get_inputs()[0].name


def _softmax(x: np.ndarray) -> np.ndarray:
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


def predict(image: Image.Image) -> dict:
    inputs = EXTRACTOR(images=image, return_tensors="np")
    pixel_values = inputs["pixel_values"].astype(np.float32)

    start = time.perf_counter()
    outputs = SESSION.run(None, {INPUT_NAME: pixel_values})
    elapsed_ms = (time.perf_counter() - start) * 1000

    logits = outputs[0][0]
    predicted_id = int(np.argmax(logits))
    confidence = float(_softmax(logits)[predicted_id])

    return {
        "label": ID2LABEL.get(predicted_id, str(predicted_id)),
        "confidence": confidence,
        "inference_time_ms": elapsed_ms,
    }
