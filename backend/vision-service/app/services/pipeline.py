import cv2
import numpy as np


def process_frame(frame: np.ndarray) -> np.ndarray:
    """
    Tempat preprocessing frame.
    """

    processed = frame.copy()
    
    cv2.putText(
        processed,
        "LINA Vision",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )
    
    return processed