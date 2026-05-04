# Image Classification Service

High-Throughput Image Classification API using ResNet-50 (ONNX Quantized) + FastAPI + React

**Cloud API:** https://fias1h-aie494-api.hf.space  
**API Docs:** https://fias1h-aie494-api.hf.space/docs

---

## Quick Start (Local)

```bash
# Run with Docker Compose
docker-compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| API      | http://localhost:6767       |
| API Docs | http://localhost:6767/docs  |

---

## API Endpoints

| Method | Path                     | Description                      |
|--------|--------------------------|----------------------------------|
| GET    | `/health`                | Health check                     |
| POST   | `/predict`               | Classify an image                |
| GET    | `/classifications`       | Get classification history       |
| GET    | `/images/{id}`           | Get saved image by ID            |
| GET    | `/results`               | Get model benchmark results      |

### Query Parameters — `/predict`

| Parameter | Values                          | Default     |
|-----------|---------------------------------|-------------|
| `model`   | `quantized` · `onnx` · `original` | `quantized` |

---

## cURL Commands

### ☁️ Cloud (Hugging Face Spaces)

```bash
# Health check
curl https://fias1h-aie494-api.hf.space/health
```

```bash
# Classify image — Quantized ONNX (default, fastest)
curl -X POST https://fias1h-aie494-api.hf.space/predict \
  -F "file=@image.jpg"
```

```bash
# Classify image — ONNX
curl -X POST "https://fias1h-aie494-api.hf.space/predict?model=onnx" \
  -F "file=@image.jpg"
```

```bash
# Classify image — Original PyTorch
curl -X POST "https://fias1h-aie494-api.hf.space/predict?model=original" \
  -F "file=@image.jpg"
```

```bash
# Get classification history (latest 50)
curl https://fias1h-aie494-api.hf.space/classifications
```

```bash
# Get classification history — paginated
curl "https://fias1h-aie494-api.hf.space/classifications?skip=0&limit=10"
```

```bash
# Get saved image by ID
curl https://fias1h-aie494-api.hf.space/images/<record_id> --output result.jpg
```

```bash
# Get benchmark results (Original vs ONNX vs Quantized)
curl https://fias1h-aie494-api.hf.space/results
```

---

### 🖥️ Local

```bash
curl http://localhost:6767/health

curl -X POST http://localhost:6767/predict \
  -F "file=@image.jpg"

curl "http://localhost:6767/predict?model=onnx" \
  --request POST \
  -F "file=@image.jpg"

curl http://localhost:6767/classifications
```

---

## Example Response — `/predict`

```json
{
  "id": "3f2a1c4e-...",
  "label": "golden retriever",
  "confidence": 0.9341,
  "inference_time_ms": 38.2,
  "model_used": "quantized",
  "model_size_mb": 24.9,
  "file_name": "dog.jpg",
  "file_size_bytes": 204800,
  "top5": [
    ["golden retriever", 93.41],
    ["Labrador retriever", 4.12],
    ["cocker spaniel", 1.03],
    ["kuvasz", 0.54],
    ["clumber", 0.31]
  ]
}
```

---

## Run Tests

```bash
cd backend
pytest tests/ -v
```

---

## Database (Local only)

```bash
# Connect to PostgreSQL
docker compose exec db psql -U user -d classifier

# Query classification history
docker compose exec db psql -U user -d classifier \
  -c "SELECT id, filename, label, confidence, model, created_at FROM classifications ORDER BY created_at DESC LIMIT 10;"
```

Credentials: `POSTGRES_DB=classifier` · `POSTGRES_USER=user` · `POSTGRES_PASSWORD=pass` · `host=localhost:5432`
