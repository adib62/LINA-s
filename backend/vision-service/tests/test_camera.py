import cv2

for i in range(8):
    print(f"=== Camera {i} ===")

    cap = cv2.VideoCapture(i)

    if not cap.isOpened():
        print("Tidak bisa dibuka")
        continue

    ret, frame = cap.read()
    print("Read:", ret)

    if ret:
        cv2.imshow(f"Camera {i}", frame)
        cv2.waitKey(2000)
        cv2.destroyAllWindows()

    cap.release()