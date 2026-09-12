import time

from app.core.frame import get_latest_frame
from app.models.vision import AnalyzeResponse, OCRResult
from app.services.pipeline import process_frame
from app.services.ocr_service import read_text
from app.services.ocr_formatter import format_ocr_result


def analyze_frame() -> AnalyzeResponse:

    frame = get_latest_frame()

    if frame is None:
        return AnalyzeResponse(
            success=False,
            message="No frame available",
            width=0,
            height=0,
            channels=0,
            timestamp=time.time(),
            ocr=[]
        )

    frame = process_frame(frame)

    # EasyOCR
    ocr_result = read_text(frame)

    # Format hasil OCR
    formatted_result = format_ocr_result(ocr_result)

    # Ubah dict -> OCRResult
    ocr_results = [
        OCRResult(**item)
        for item in formatted_result
    ]

    print("Pipeline executed")

    return AnalyzeResponse(
        success=True,
        message="Frame analyzed successfully",
        width=frame.shape[1],
        height=frame.shape[0],
        channels=frame.shape[2],
        timestamp=time.time(),
        ocr=ocr_results
    )