import threading
import time

from app.core.camera import get_camera
from app.core.frame import set_latest_frame
from app.core.state import (
    is_camera_running,
    set_camera_running
)

_stream_thread = None


def _stream_loop():
    camera = get_camera()

    while is_camera_running():

        success, frame = camera.read()

        if success:
            set_latest_frame(frame)

        time.sleep(0.01)


def start_stream():
    global _stream_thread

    if _stream_thread is not None:
        return

    _stream_thread = threading.Thread(
        target=_stream_loop,
        daemon=True
    )

    _stream_thread.start()

    print("🎥 Stream dimulai")
    
def stop_stream():
    set_camera_running(False)
    print("Stream dihentikan")