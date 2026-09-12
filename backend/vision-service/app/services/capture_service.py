import cv2
from pathlib import Path

from app.core.frame import get_latest_frame


def save_frame() -> str:

    frame = get_latest_frame()

    if frame is None:
        raise Exception("No frame available")

    output_dir = Path("captures")
    output_dir.mkdir(exist_ok=True)

    file_path = output_dir / "latest.jpg"

    cv2.imwrite(str(file_path), frame)

    return str(file_path)