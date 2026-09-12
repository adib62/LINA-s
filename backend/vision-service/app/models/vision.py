from pydantic import BaseModel

class OCRResult(BaseModel):
    text: str
    confidence: float

class AnalyzeResponse(BaseModel):
    success: bool
    message: str
    width: int
    height: int
    channels: int
    timestamp: float
    ocr: list[OCRResult]