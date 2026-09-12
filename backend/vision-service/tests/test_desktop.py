import cv2

from app.services.desktop_service import capture_desktop

image = capture_desktop()

print(image.shape)

cv2.imwrite("desktop_test.jpg", image)

print("Desktop screenshot saved.")