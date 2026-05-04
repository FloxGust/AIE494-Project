import io
import json
import pathlib
from concurrent.futures import ProcessPoolExecutor
from typing import Annotated

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, desc

from app.database import get_db
from app.models import Classification
from app.predictor import predict, MODEL_SIZE_MB
from app.schemas import PredictionResponse

_MODEL_DISPLAY = {
    "original": "Original (PyTorch)",
    "onnx": "ONNX",
    "quantized": "Quantized ONNX",
}

app = FastAPI(title="Image Classification API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
executor = ProcessPoolExecutor(max_workers=4)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
RESULTS_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "Results"

ModelType = Annotated[str, Query(pattern="^(original|onnx|quantized)$")]


@app.get("/")
async def root():
    return {"status": "ok", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(
    file: UploadFile = File(...),
    model: ModelType = "quantized",
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Corrupted or invalid image file")

    loop = __import__("asyncio").get_event_loop()
    result = await loop.run_in_executor(executor, predict, image, model, file.filename or "", len(data))

    record = Classification(
        filename=result["file_name"],
        stored_path="",
        file_size=result["file_size_bytes"],
        label=result["label"],
        confidence=round(result["confidence"] * 100, 2),
        model=result["model_used"],
        infer_ms=result["inference_time_ms"],
        top5=result["top5"],
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return PredictionResponse(**result, id=str(record.id))


@app.get("/classifications")
async def get_classifications(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(Classification).order_by(desc(Classification.created_at)).offset(skip).limit(limit)
        )
    ).scalars().all()

    return [
        {
            "id": str(r.id),
            "file": r.filename,
            "size": f"{r.file_size / 1024:.1f} KB" if r.file_size else "-",
            "label": r.label,
            "conf": r.confidence,
            "infer": r.infer_ms,
            "model": _MODEL_DISPLAY.get(r.model, r.model),
            "modelSize": f"{MODEL_SIZE_MB.get(r.model, 0):.1f} MB",
            "top5": r.top5 or [],
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@app.get("/results")
async def get_results():
    output = {}
    for name in ("original", "onnx", "quantized"):
        path = RESULTS_DIR / f"{name}.json"
        if path.exists():
            with open(path) as f:
                output[name] = json.load(f)
        else:
            output[name] = None
    return output
