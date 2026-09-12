# 🤖 L.I.N.A

> **Learning Intelligent Natural Assistant**

L.I.N.A adalah AI Assistant Desktop yang sedang dikembangkan menggunakan **TypeScript**, **Express**, **Python (FastAPI)**, **Groq LLM**, **OpenCV**, **EasyOCR**, dan **VoiceVox**.

Project ini bertujuan membangun AI Assistant yang mampu:

- 💬 Berkomunikasi secara natural
- 🧠 Mengingat informasi penting
- 🎤 Berinteraksi menggunakan suara
- 👀 Memahami lingkungan melalui Vision
- 🛠 Membantu aktivitas dan pengembangan software

LINA dikembangkan dengan arsitektur modular sehingga setiap kemampuan AI dapat berkembang secara mandiri tanpa mengganggu sistem lainnya.

---

# 📖 Tentang Project

LINA bukan sekadar chatbot.

Project ini dirancang sebagai AI Assistant Desktop yang memiliki beberapa komponen utama:

- Conversation AI
- Long-Term Memory
- Semantic Memory Search
- Voice Interaction
- Vision Service
- Developer Agent (Roadmap)

Setiap komponen dikembangkan secara bertahap agar mudah dipelihara dan dikembangkan di masa depan.

---

# ✨ Fitur Saat Ini

## 💬 AI Conversation

- Chat menggunakan Groq LLM
- Prompt Builder Modular
- Personality System
- JSON Response
- Automatic Response Parsing

---

## 🧠 Long-Term Memory

LINA mampu menyimpan informasi penting mengenai pengguna.

Contohnya:

- Nama
- Hobi
- Pekerjaan
- Tempat Tinggal
- Proyek
- Preferensi
- Informasi penting lainnya

Disimpan pada:

```
backend/src/data/memory.json
```

---

## 💭 Conversation Memory

Histori percakapan tetap tersimpan walaupun backend dimatikan.

Lokasi:

```
backend/src/data/conversation.json
```

---

## 🔎 Semantic Memory Search (RAG)

Menggunakan embedding model:

```
Xenova/all-MiniLM-L6-v2
```

untuk mencari memori yang paling relevan berdasarkan konteks percakapan.

---

## 🎤 Voice

Menggunakan VoiceVox.

Fitur:

- Japanese TTS
- Auto Translation Indonesia → Jepang
- Audio Streaming
- WebSocket Communication

---

## 👀 Vision Service

Vision dibangun sebagai **Python Microservice** menggunakan FastAPI.

Fitur yang sudah tersedia:

- ✅ Webcam Vision
- ✅ OCR (EasyOCR)
- ✅ Screenshot Analysis
- ✅ Desktop Observation
- ✅ MJPEG Live Stream
- ✅ Frame Capture

Vision Service dipisahkan dari backend utama agar lebih mudah dikembangkan menggunakan library AI Python.

---

## 🌐 WebSocket

Digunakan untuk komunikasi realtime antara backend dan frontend.

Saat ini digunakan untuk:

- Audio Streaming
- AI Status
- Interrupt Response

---

## 🧩 Modular Architecture

Project dipisahkan menjadi beberapa module agar mudah dikembangkan.

```
LINA
│
├── backend
│   ├── src
│   └── vision-service
│
└── frontend
```

---

# 📁 Struktur Folder

```
backend
│
├── src
│   ├── config
│   ├── controllers
│   ├── data
│   ├── prompts
│   ├── routes
│   ├── services
│   ├── vision
│   ├── websocket
│   └── utils
│
└── vision-service
    │
    ├── app
    │   ├── api
    │   ├── core
    │   ├── models
    │   └── services
    │
    ├── tests
    ├── requirements.txt
    └── run.py
```

---

# ⚙️ Tech Stack

## Backend

- TypeScript
- Express
- Python
- FastAPI
- WebSocket

---

## AI

- Groq LLM
- Llama 3.3 70B
- OpenCV
- EasyOCR
- NumPy
- MSS
- Xenova Transformers

---

## Voice

- VoiceVox
- Google Translate

---

# 🚀 Roadmap

## 🧠 Memory

- [x] Long-Term Memory
- [x] Conversation Memory
- [ ] Conversation Summary
- [ ] Semantic Conversation Search
- [ ] Memory Importance Score
- [ ] Memory Editor

---

## 🤖 AI

- [ ] Tool Calling
- [ ] Streaming Response
- [ ] Multi Model Support
- [ ] Local LLM
- [ ] Web Search

---

## 🎤 Voice

- [x] VoiceVox
- [ ] Emotion Voice
- [ ] Voice Interrupt
- [ ] Multi Speaker

---

## 👀 Vision

- [x] Webcam Vision
- [x] OCR
- [x] Screenshot Analysis
- [x] Desktop Observation
- [ ] Object Detection
- [ ] Face Detection
- [ ] Face Recognition
- [ ] Image Understanding

---

## 📅 Productivity

- [ ] Calendar
- [ ] Reminder
- [ ] Alarm
- [ ] Notes
- [ ] To-do List

---

## 💻 Desktop Automation

- [ ] Open Application
- [ ] Close Application
- [ ] Execute Terminal Command
- [ ] File Manager
- [ ] Clipboard Access

---

## 🎨 Frontend

- [ ] Chat History
- [ ] Memory Viewer
- [ ] Settings
- [ ] Theme
- [ ] Voice Settings

---

# 🔒 Security

File berikut **tidak ikut GitHub** karena berisi data sensitif.

```
backend/.env
backend/src/data/memory.json
backend/src/data/conversation.json
```

---

# 📌 Catatan

Project ini masih berada dalam tahap pengembangan aktif.

Pengembangan dilakukan menggunakan pendekatan milestone kecil agar setiap fitur dapat diuji dan distabilkan sebelum melanjutkan ke fitur berikutnya.

---

# 👨‍💻 Developer

Developed with ❤️ by Adib.

---

# ⭐ Version

Current Version

```
v38
```

Last Update

```
13 Agustus 2026
```