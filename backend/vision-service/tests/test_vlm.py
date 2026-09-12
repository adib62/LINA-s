import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import cv2

from app.services.vision_ai import describe_image

frame = cv2.imread("webcam_debug.jpg")

if frame is None:
    raise Exception("webcam_debug.jpg tidak ditemukan")

result = describe_image(frame)

print("\n=== HASIL VISION AI ===")
print(result)