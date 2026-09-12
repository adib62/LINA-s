# 🤖 L.I.N.A

> **Learning Intelligent Natural Assistant**

L.I.N.A adalah AI Assistant Desktop yang sedang dikembangkan menggunakan **TypeScript**, **Express**, **Python (FastAPI)**, **Groq LLM**, **OpenCV**, **EasyOCR**, dan **VoiceVox**.

Project ini bertujuan membangun AI Assistant yang mampu:

- 💬 Berkomunikasi secara natural
- 🧠 Mengingat informasi penting
- 🎤 Berinteraksi menggunakan suara
- 👀 Memahami lingkungan melalui Vision
- 🛠 Membantu aktivitas dan pengembangan software
- 📅 Mengelola kalender, reminder, dan dokumen lewat Tool Calling
- ⏰ Ngingetin duluan tanpa diminta (Sistem Inisiatif)
- 🕹 Ngerjain tugas kompleks lewat Agent Mode (multi sub-agent)

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
- Tool Calling (Calendar, Reminder, Office, Browser/App, Web Search)
- Sistem Inisiatif (notifikasi proaktif)
- Agent Mode (orchestrator multi sub-agent)
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
- ✅ Analisis Foto Upload (OCR + deskripsi VLM, dipakai lampiran Agent Mode)

Vision Service dipisahkan dari backend utama agar lebih mudah dikembangkan menggunakan library AI Python.

---

## 🛠 Tool Calling

LINA bisa manggil tool nyata buat ngerjain permintaan, bukan cuma jawab teks. Setiap kategori
dikonsolidasi jadi satu tool dengan parameter `aksi`, biar daftar tool yang dikirim ke LLM tetep ringkas:

| Tool | Aksi | Fungsi |
|---|---|---|
| `browser.manage` | `buka_app`, `tutup_app`, `buka_url`, `cari`, `youtube` | Buka/tutup aplikasi desktop, buka URL, cari di browser, putar YouTube |
| `calendar.manage` | `buat`, `list`, `hapus` | Kelola jadwal/kalender |
| `reminder.manage` | `buat`, `list`, `hapus` | Kelola reminder |
| `document.manage` | `docx`, `pptx`, `pdf`, `baca_pdf`, `convert` | Bikin/baca/convert dokumen |
| `web.search` | — | Cari informasi di internet |
| `ui.mode` | — | Ganti mode UI (chat/voice/agent) lewat kalimat bebas |
| `system.initiative` | — | Matikan/nyalain notifikasi proaktif LINA |

**Parser waktu Bahasa Indonesia** (`utils/datetime.ts`) nerima kalimat sehari-hari ("besok jam 9
malam", "seminggu lagi", "jumat sore") dan parsing tanggalnya di TypeScript — bukan dihitung LLM,
supaya gak meleset.

---

## 📄 Office Tools

Kelola dokumen langsung dari chat:

- Bikin Word (`.docx`) dari heading/paragraf/bullet/tabel
- Bikin presentasi (`.pptx`) dari daftar slide
- Bikin PDF dari HTML custom (via Playwright)
- Baca isi PDF yang dilampirkan
- Convert file antar format (`.docx`/`.pptx`/`.pdf`, via LibreOffice headless)

Nama file dari LLM selalu di-sanitize (`path.basename()`) sebelum dipakai, jadi gak bisa dipakai
buat nulis ke luar folder output.

---

## ⏰ Sistem Inisiatif

Scheduler jalan tiap 60 detik, ngecek reminder & kalender, terus LINA nyeletuk duluan (teks +
suara) tanpa nunggu ditanya.

- Anti-duplikat (`notified`) dan anti-spam (maksimal 1x/10 menit untuk notifikasi non-urgent)
- Reminder/event yang udah jatuh tempo (≤5 menit) nembus rate limit
- Bisa dimatikan lewat toggle di Settings atau bilang langsung ("jangan ganggu dulu")
- Sistem ini **tidak** bisa manggil tool reaktif lain — cuma boleh ngomong

---

## 🕹 Agent Mode

Mode terpisah dari chat biasa untuk tugas yang lebih kompleks:

- Orchestrator mecah satu tugas jadi beberapa sub-agent
- Sub-agent jalan paralel, masing-masing punya "terminal" sendiri
- Progress dikirim live lewat WebSocket
- Hasil akhir digabung otomatis
- Bisa dikasih lampiran foto — dideskripsikan dulu lewat vision-service (OCR + VLM)
  sebelum jadi konteks buat sub-agent
- Hasil gabungan berhenti dulu di status **preview** — bisa diedit manual sebelum final
- Setelah difinalisasi, hasil otomatis dikirim ke Telegram (kalau sudah dikonfigurasi)

---

## 📓 Prompt dari Vault Obsidian

Prompt (`system`, `rules`, `personality`, `memory`, `japanes`) bisa dibaca langsung dari vault
Obsidian, bukan cuma dari `.txt` bawaan — jadi bisa diedit tanpa restart backend. Kalau
`PROMPTS_DIR` belum di-set atau filenya belum ada di vault, otomatis fallback ke bundel bawaan.
Lihat `obsidian-prompts/README.md` untuk cara pasang.

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
│   ├── tools           # browser, calender, remainder, office, web, ui, system, ...
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

Beberapa folder tool (`file`, `notes`, `clipboard`) sudah ada scaffold-nya tapi belum
diregistrasi ke `registry` — masih placeholder untuk pengembangan berikutnya.

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
- Ollama (Local LLM, opsional)
- OpenCV
- EasyOCR
- NumPy
- MSS
- Xenova Transformers

---

## Voice

- VoiceVox
- ElevenLabs
- Microsoft Edge TTS
- Google Translate

---

## Dokumen & Otomasi

- `docx` (generate Word)
- `pptxgenjs` (generate PowerPoint)
- `pdf-parse` (baca PDF)
- Playwright (generate PDF dari HTML, browser automation)
- LibreOffice headless (convert antar format dokumen)

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

- [x] Tool Calling
- [ ] Streaming Response
- [x] Multi Model Support
- [ ] Local LLM Fallback (Ollama terpasang, belum jadi fallback otomatis)
- [x] Web Search

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

- [x] Calendar
- [x] Reminder
- [ ] Alarm
- [ ] Notes
- [ ] To-do List

---

## 💻 Desktop Automation

- [x] Open Application
- [x] Close Application
- [ ] Execute Terminal Command
- [ ] File Manager
- [ ] Clipboard Access

---

## 📄 Office & Dokumen

- [x] Generate Word (.docx)
- [x] Generate PowerPoint (.pptx)
- [x] Generate PDF dari HTML
- [x] Baca isi PDF
- [x] Convert antar format dokumen

---

## ⏰ Sistem Inisiatif

- [x] Scheduler (cek reminder & kalender tiap 60 detik)
- [x] Decision logic anti-spam & anti-duplikat
- [x] Notifikasi via WebSocket + suara
- [x] Toggle on/off (Settings & voice command)

---

## 🕹 Agent Mode

- [x] Orchestrator (pecah tugas jadi sub-agent)
- [x] Sub-agent paralel + live progress
- [x] Penggabungan hasil akhir
- [x] Lampiran foto (OCR + deskripsi VLM)
- [x] Preview hasil sebelum final (bisa diedit)
- [x] Kirim hasil final ke Telegram
- [ ] Sub-agent boleh memanggil tool
- [ ] Riwayat sesi agent tersimpan ke disk

---

## 🎨 Frontend

- [x] Chat History
- [ ] Memory Viewer
- [x] Settings
- [ ] Theme
- [x] Voice Selection

---

# 🔗 API Endpoints

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/models` | Daftar model |
| GET/POST | `/api/settings` | Baca/simpan setting |
| GET/POST/PATCH/DELETE | `/api/threads[/:id]` | Chat threads |
| POST | `/api/chat` | Chat teks — balikin `{indo, jepang, toolCall, toolResult}` |
| POST | `/api/tanya` | Chat suara (voice mode) |
| POST | `/api/upload` | Upload file (base64) |
| POST | `/api/screenshot` | Tangkap + OCR layar |
| GET/POST/DELETE | `/api/reminders[/:id]` | Reminder |
| POST | `/api/reminders/:id/done` | Tandai reminder selesai |
| GET/POST/DELETE | `/api/calendar[/:id]` | Kalender |
| GET | `/api/files` | Daftar file hasil office tools |
| GET | `/api/files/:name` | Download file |
| POST | `/api/agent/run` \| `/stop` | Agent mode |
| GET | `/api/agent/sessions[/:id]` | Riwayat sesi agent |
| POST | `/api/agent/sessions/:id/finalize` | Finalisasi preview Agent Mode → kirim ke Telegram |
| POST | `/api/scheduler/run-once` | Trigger manual scheduler (debug) |

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
12 September 2026
```