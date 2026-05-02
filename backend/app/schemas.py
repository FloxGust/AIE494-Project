from pydantic import BaseModel


class PredictionResponse(BaseModel):
    label: str
    confidence: float
    inference_time_ms: float
    model_used: str
    model_size_mb: float
    file_name: str
