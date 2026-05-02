import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def make_image_bytes(fmt="JPEG") -> bytes:
    img = Image.new("RGB", (224, 224), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_returns_json():
    response = client.post(
        "/predict",
        files={"file": ("test.jpg", make_image_bytes(), "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "label" in data
    assert "confidence" in data
    assert "inference_time_ms" in data


def test_predict_rejects_non_image():
    response = client.post(
        "/predict",
        files={"file": ("test.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 400


def test_predict_rejects_corrupted_image():
    response = client.post(
        "/predict",
        files={"file": ("bad.jpg", b"\xff\xd8corrupted", "image/jpeg")},
    )
    assert response.status_code == 400


def test_predict_rejects_oversized_file():
    big_data = b"0" * (6 * 1024 * 1024)
    response = client.post(
        "/predict",
        files={"file": ("big.jpg", big_data, "image/jpeg")},
    )
    assert response.status_code == 400
