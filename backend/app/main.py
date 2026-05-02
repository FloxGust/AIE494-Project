import io
import json
import pathlib
from concurrent.futures import ProcessPoolExecutor
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from app.predictor import predict
from app.schemas import PredictionResponse

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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(
    file: UploadFile = File(...),
    model: ModelType = "quantized",
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
    result = await loop.run_in_executor(executor, predict, image, model, file.filename or "")

    return PredictionResponse(**result)


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
