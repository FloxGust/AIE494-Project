# Image Classification Service

High-Throughput Image Classification API using ResNet-50 (ONNX Quantized) + FastAPI + React

## Quick Start

```bash
# 1. Download & optimize model
cd backend
python models/download_model.py
python models/convert_onnx.py
python models/quantize.py

# 2. Run with Docker Compose
docker-compose up --build
```

API: http://localhost:6767  
Frontend: http://localhost:3000

## API Usage

```bash
curl -X POST http://localhost:6767/predict \
  -F "file=@your_image.jpg"
```

## Run Tests

```bash
cd backend
pytest tests/ -v
```
