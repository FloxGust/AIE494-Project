import numpy as np
import pytest
from PIL import Image

from app.predictor import predict


def test_predict_output_structure():
    dummy = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
    result = predict(dummy)
    assert "label" in result
    assert "confidence" in result
    assert "inference_time_ms" in result


def test_confidence_range():
    dummy = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
    result = predict(dummy)
    assert 0.0 <= result["confidence"] <= 1.0


def test_inference_time_positive():
    dummy = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
    result = predict(dummy)
    assert result["inference_time_ms"] > 0
