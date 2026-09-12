from app.services.desktop_service import capture_desktop
from app.services.ocr_service import read_text


def analyze_desktop():

    image = capture_desktop()

    return read_text(image)