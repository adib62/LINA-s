import cv2
import tempfile
import time
from ollama import Client

client = Client(host="http://127.0.0.1:11434")


DETAIL_PROMPT = (
    "Jelaskan gambar ini secara detail dalam Bahasa Indonesia. Sebutkan: "
    "objek/alat yang terlihat, aktivitas atau langkah yang sedang dilakukan, "
    "dan teks/angka yang terlihat di gambar (misal label, hasil pengukuran, tulisan). "
    "Tulis dalam beberapa kalimat, bukan cuma satu kalimat singkat."
)


def describe_image(frame, prompt: str = DETAIL_PROMPT):

    # ==========================
    # Resize gambar agar inferensi lebih cepat
    # ==========================
    height, width = frame.shape[:2]
    
    print(f"[Vision] Resolusi asli : {width}x{height}")

    max_width = 320

    if width > max_width:
        scale = max_width / width

        frame = cv2.resize(
            frame,
            (
                int(width * scale),
                int(height * scale)
            )
        )
        
    print(f"[Vision] Resolusi kirim : {frame.shape[1]}x{frame.shape[0]}")

    # ==========================
    # Simpan frame ke file sementara
    # ==========================
    start = time.time()

    with tempfile.NamedTemporaryFile(
        suffix=".jpg",
        delete=False
    ) as temp:

        cv2.imwrite(temp.name, frame)
        image_path = temp.name

    print(f"[Vision] Simpan gambar : {time.time() - start:.2f} detik")

    # ==========================
    # Kirim ke Qwen2.5-VL
    # ==========================
    start = time.time()

    response = client.chat(
        model="riven/smolvlm:latest",
        messages=[
            {
                "role": "user",
                "content": prompt,
                "images": [image_path],
            }
        ],
    )

    print(f"[Vision] Inferensi Qwen : {time.time() - start:.2f} detik")

    return response["message"]["content"]