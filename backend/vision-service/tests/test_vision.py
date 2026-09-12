from ollama import Client

client = Client(host="http://127.0.0.1:11434")

response = client.chat(
    model="qwen2.5vl:7b",
    messages=[
        {
            "role": "user",
            "content": "Jelaskan gambar ini.",
            "images": [
                "/home/dibee/Desktop/LINA/backend/vision-service/webcam_debug.jpg"
            ],
        }
    ],
)

print(response["message"]["content"])