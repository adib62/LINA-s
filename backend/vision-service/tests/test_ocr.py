import cv2

from app.services.ocr_service import read_text

image = cv2.imread("captures/latest.jpg")

result = read_text(image)

print(result)