import numpy as np
import mss


def capture_desktop():

    with mss.mss() as sct:

        monitor = sct.monitors[1]

        screenshot = sct.grab(monitor)

        image = np.array(screenshot)

        return image[:, :, :3]