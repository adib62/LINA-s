camera_running = False

def is_camera_running():
    return camera_running

def set_camera_running(value: bool):
    global camera_running
    camera_running = value