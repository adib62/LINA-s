from app.core.frame import get_latest_frame
from app.services.ocr_service import read_text
from app.services.vision_ai import describe_image


def analyze_webcam():

    frame = get_latest_frame()

    if frame is None:
        return {
            "ocr": [],
            "description": None
        }

    ocr = read_text(frame)
    description = describe_image(frame)

    return {
        "ocr": ocr,
        "description": description
    }