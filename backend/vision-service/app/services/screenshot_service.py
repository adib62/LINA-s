import cv2

from app.services.ocr_service import read_text

def analyze_screenshot(file_path: str):
    
    print(f"file: {file_path}")
    
    image = cv2.imread(file_path)
    
    print(f"image loaded: {image is not None}")
    
    if image is None:
        raise Exception("Filed to load image")
    
    print(f"shape: {image.shape}")
    
    result = read_text(image)
    
    print(result)
    
    return result