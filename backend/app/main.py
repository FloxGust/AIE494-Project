import io
from concurrent.futures import ProcessPoolExecutor

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.predictor import predict
from app.schemas import PredictionResponse

app = FastAPI(title="Image Classification API")
executor = ProcessPoolExecutor(max_workers=4)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(file: UploadFile = File(...)):
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
    result = await loop.run_in_executor(executor, predict, image)

    return PredictionResponse(**result)
