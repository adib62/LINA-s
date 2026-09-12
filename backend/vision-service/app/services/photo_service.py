import cv2

from app.services.ocr_service import read_text
from app.services.ocr_formatter import format_ocr_result
from app.services.vision_ai import describe_image


def analyze_photo(file_path: str):
    """
    Analisis foto yang di-upload (bukan frame webcam/screen live).
    Independen dari core/frame.py — jadi gak ganggu webcam vision.
    """

    image = cv2.imread(file_path)

    if image is None:
        raise Exception("Failed to load image")

    ocr = read_text(image)
    description = describe_image(image)

    return {
        "ocr": format_ocr_result(ocr),
        "description": description
    }
