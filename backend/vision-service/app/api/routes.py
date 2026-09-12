import cv2
import time
import shutil

from pathlib import Path
from fastapi import APIRouter, Response
from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse

from app.core.frame import get_latest_frame
from app.models.vision import AnalyzeResponse
from app.services.vision_service import analyze_frame
from app.services.capture_service import save_frame
from app.services.screenshot_service import analyze_screenshot
from app.services.desktop_ocr_service import analyze_desktop
from app.services.ocr_formatter import format_ocr_result
from app.services.webcam_service import analyze_webcam
from app.core.frame import get_latest_frame
from app.services.vision_ai import describe_image
from app.services.photo_service import analyze_photo

router = APIRouter()

@router.get("/")
def root():
    return {
        "service": "LINA Vision",
        "status": "running"
    }


@router.get("/health")
def health():
    return {
        "status": "ok"
    }
    

@router.get("/frame")
def frame():

    latest = get_latest_frame()

    if latest is None:
        return {
            "frame": False
        }

    return {
        "frame": True,
        "width": int(latest.shape[1]),
        "height": int(latest.shape[0])
    }
    
    
@router.get("/frame.jpg")
def frame_jpg():

    latest = get_latest_frame()

    if latest is None:
        return Response(
            status_code=404,
            content="No frame"
        )

    success, buffer = cv2.imencode(".jpg", latest)

    if not success:
        return Response(
            status_code=500,
            content="Encode failed"
        )

    return Response(
        content=buffer.tobytes(),
        media_type="image/jpeg"
    )
    
    
def generate_stream():

    while True:

        frame = get_latest_frame()

        if frame is None:
            time.sleep(0.01)
            continue

        success, buffer = cv2.imencode(".jpg", frame)

        if not success:
            continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + buffer.tobytes()
            + b"\r\n"
        )

        time.sleep(0.03)


@router.get("/stream")
def stream():

    return StreamingResponse(
        generate_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
    
    
@router.post("/vision/analyze", response_model=AnalyzeResponse)
def analyze():
    return analyze_frame()

@router.post("/vision/capture")
def capture():
    
    path = save_frame()
    
    return {
        "success": True,
        "path": path
    }
    
@router.post("/vision/screenshot")
async def screenshot(file: UploadFile = File(...)):

    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    file_path = upload_dir / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyze_screenshot(str(file_path))

    return {
        "success": True,
        "type": "screenshot",
        "ocr": format_ocr_result(result),
        "description": None
    }
    
@router.post("/vision/desktop")
def desktop():
    
    result = analyze_desktop()
    
    return {
        "success": True,
        "type": "Desktop",
        "ocr": format_ocr_result(result),
        "description": None
    }
    
@router.post("/vision/webcam")
def webcam():

    result = analyze_webcam()

    return {
        "success": True,
        "type": "webcam",
        "ocr": format_ocr_result(result["ocr"]),
        "description": result["description"]
    }
    

@router.post("/vision/photo")
async def photo(file: UploadFile = File(...)):

    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    file_path = upload_dir / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyze_photo(str(file_path))

    return {
        "success": True,
        "type": "photo",
        "ocr": result["ocr"],
        "description": result["description"]
    }


@router.post("/vision/test-vlm")
def test_vlm():

    frame = get_latest_frame()

    if frame is None:
        return {
            "success": False,
            "message": "No frame available"
        }

    return {
        "success": True,
        "description": describe_image(frame)
    }