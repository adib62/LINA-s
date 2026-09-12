# 🤖 L.I.N.A Roadmap

---

# ✅ Backend Refactor

- [x] Pisahkan Config
- [x] Pisahkan Utils
- [x] Pisahkan Services
- [x] Prompt Builder
- [x] VoiceVox Service
- [x] Memory Service
- [x] Conversation Service
- [x] Logger
- [x] Constants

---

# 🧠 Memory

- [x] Long-Term Memory
- [x] Conversation History
- [ ] Conversation Summary
- [ ] Semantic Conversation Search
- [ ] Memory Importance Score
- [ ] Memory Manager
- [ ] Memory Categorization
- [ ] Memory Compression

---

# 🤖 AI

- [x] Tool Calling
- [ ] Streaming Response
- [x] Multi Model Support
- [ ] Local LLM Fallback
- [ ] Web Search
- [ ] Reasoning Mode
- [ ] Planning System

---

# 🎤 Voice

- [x] VoiceVox
- [ ] Emotion Voice
- [ ] Interrupt Response
- [ ] Multi Speaker
- [ ] Voice Settings
- [ ] Wake Word

---

# 👀 Vision

## Vision Service

- [x] Webcam Vision
- [x] OCR
- [x] Screenshot Analysis
- [x] Desktop Observation
- [x] Analisis Foto Upload (OCR + deskripsi VLM, dipakai Agent Mode)

## Computer Vision

- [ ] Object Detection
- [ ] Face Detection
- [ ] Face Recognition
- [ ] Emotion Recognition
- [ ] Pose Detection
- [ ] Hand Tracking
- [ ] Image Captioning
- [ ] Scene Understanding

---

# 🔗 Integration

- [ ] Vision → Developer Agent
- [ ] Memory → Developer Agent
- [ ] TODO-aware Planning
- [ ] Project-aware Planning
- [ ] Voice → Developer Agent
- [ ] AI → Vision
- [ ] AI → Memory

---

# 🛠 Workspace Agent

- [ ] Read File
- [ ] Write File
- [ ] Create File
- [ ] Delete File
- [ ] Rename File
- [ ] Search Project
- [ ] Run Terminal Command
- [ ] Install Package
- [ ] Run Build
- [ ] Run Tests
- [ ] Analyze Error
- [ ] Generate Patch
- [ ] Git Commit
- [ ] Git Branch
- [ ] Update README
- [ ] Update TODO

---

# 💻 Desktop Automation

- [ ] Open Application
- [ ] Close Application
- [ ] Execute Command
- [ ] File Manager
- [ ] Clipboard Access
- [ ] Mouse Control
- [ ] Keyboard Control
- [ ] Window Management

---

# 📅 Productivity

- [x] Calendar
- [x] Reminder
- [ ] Alarm
- [ ] Notes
- [ ] To-do List

---

# 🌐 Internet

- [ ] Browser Control
- [ ] YouTube Search
- [ ] Google Search
- [ ] Weather
- [ ] News
- [ ] Email

---

# 🎨 Frontend

- [x] Chat History UI
- [ ] Memory Viewer
- [ ] Vision Viewer
- [x] Settings
- [ ] Theme
- [x] Voice Selection
- [ ] Desktop Dashboard

---

# 🔒 Security

- [x] .env
- [x] API Key Validation
- [ ] Secret Manager
- [ ] Encryption
- [ ] Workspace Permission
- [ ] Read-only Mode
- [ ] User Approval Before Editing
- [ ] Preview Diff
- [ ] Rollback
- [ ] Automatic Backup

---

# 🧹 Refactor

- [ ] Chat Controller
- [x] Chat Routes
- [ ] Chat Service
- [ ] Better Error Handler
- [ ] Unit Testing
- [ ] Integration Testing
- [ ] API Documentation

---

# 🕹 Agent Mode

- [x] Orchestrator (pecah tugas jadi sub-agent)
- [x] Sub-agent paralel
- [x] Live progress via WebSocket
- [x] Terminal per sub-agent
- [x] Penggabungan hasil akhir
- [x] Preview hasil sebelum final (bisa diedit)
- [x] Kirim hasil final ke Telegram
- [ ] Sub-agent boleh memanggil tool
- [ ] Riwayat sesi agent tersimpan ke disk

---

# 📦 Tools Office (lina-tools-spec.md §1)

- [x] generateDocx
- [x] generatePptx
- [x] generatePdf
- [x] readPdf
- [x] convertFile

---

# ⏰ Sistem Inisiatif (lina-tools-spec.md §2)

- [x] Calendar tools (prasyarat)
- [x] Reminder tools (prasyarat)
- [x] Scheduler
- [x] checkReminder
- [x] checkCalendar
- [x] Decision logic anti-spam
- [x] Push via WebSocket / TTS
