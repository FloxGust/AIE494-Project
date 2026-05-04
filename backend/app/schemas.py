from pydantic import BaseModel


class PredictionResponse(BaseModel):
    id: str
    label: str
    confidence: float
    inference_time_ms: float
    model_used: str
    model_size_mb: float
    file_name: str
    file_size_bytes: int
    top5: list
