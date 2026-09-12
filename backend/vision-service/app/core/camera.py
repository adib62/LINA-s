import cv2
from app.core.state import set_camera_running
from app.config import settings

camera = None

def start_camera():
    global camera
    
    camera = cv2.VideoCapture(settings.CAMERA_INDEX)
    print("CAMERA_INDEX =", settings.CAMERA_INDEX)
    
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, settings.FRAME_WIDTH)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, settings.FRAME_HEIGHT)
    camera.set(cv2.CAP_PROP_FPS, settings.FPS)
    
    if not camera.isOpened():
        raise Exception(f"Gagal membuka webcame pada index {settings.CAMERA_INDEX}")
    
    set_camera_running(True)
    
    print(f"Webcam berhasil di buka (index{settings.CAMERA_INDEX})")
    
def stop_camera():
    global camera
    
    if camera is not None:
        camera.release()
        camera = None
        
        set_camera_running(False)
        
        print("Webcam ditutup")
        
def get_camera():
    return camera