from pydantic import BaseModel
from typing import Optional


class OCRItem(BaseModel):
    text: str
    confidence: float


class VisionResponse(BaseModel):
    success: bool
    type: str
    ocr: list[OCRItem]
    description: Optional[str] = None