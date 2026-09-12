import cv2
import time

from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse

from app.core.camera import start_camera
from app.core.stream import start_stream
from app.core.frame import get_latest_frame
from app.core.camera import stop_camera
from app.core.stream import stop_stream
from app.api.routes import router

app = FastAPI(
    title="LINA Vision Service",
    version="1.0.0"
)

app.include_router(router)


@app.on_event("startup")
def startup():
    start_camera()
    start_stream()

    
@app.on_event("shutdown")
def shutdown():
    
    stop_stream()
    stop_camera()
    
    print("Vision Service shutdown")