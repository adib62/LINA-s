from dotenv import load_dotenv
import os

load_dotenv()

CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", 4))
FRAME_WIDTH = int(os.getenv("FRAME_WIDTH", 1280))
FRAME_HEIGHT = int(os.getenv("FRAME_HEIGHT", 720))
FPS = int(os.getenv("FPS", 30))