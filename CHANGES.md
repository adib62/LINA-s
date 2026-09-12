# CHANGES — LINA v38.0

Ringkasan semua perubahan dari 4 tahap pengerjaan. Backend dan frontend-nya
udah final di zip ini — tinggal `npm install` dan jalanin.

## Cara jalanin

```bash
cd backend
npm install
npx ts-node src/main.ts
```

Buka **http://localhost:5000** — backend sekalian nyajiin frontend, jadi gak perlu `vite dev` terpisah.

Servis tambahan (opsional, tergantung fitur yang mau dipakai):

```bash
# Vision (tombol screenshot di chat mode)
cd backend/vision-service && python run.py

# LibreOffice headless (office.convertFile)
which soffice || sudo apt install libreoffice

# Playwright Chromium (office.generatePdf)
npx playwright install chromium
```

---

# Tahap 1 — Backend API + UI Utama

`index.html` sekarang jadi satu halaman yang nyatuin voice mode, chat mode,
dan agent mode — tuker view pake JS, bukan reload halaman. Alasannya: kalau
pindah halaman, WebSocket putus dan mic mati, jadi transisi "LINA chat mode"
bakal ada jeda dan LINA berhenti dengerin. Satu halaman = transisi instan,
mic tetep jalan.

**File baru:** `config/models.ts` (daftar model + preset effort), `services/settings.ts`
(persist ke `settings.json`), `services/threads.ts` (persist chat ke `threads.json`),
`services/agent.ts` (orchestrator sub-agent), `routes/api.ts` (semua endpoint REST),
`tools/ui/mode.ts` (tool `ui.mode`).

**Bug yang dibenerin sambil jalan:**
- `registerTools()` kepanggil dua kali di `main.ts`
- `vision/screenshot.ts` isinya `export {}` doang
- WebSocket cuma nyimpen satu client (tab kedua bikin tab pertama mati)

**Transisi mode** dua jalur: regex di frontend buat respons instan ("chat mode" langsung
pindah tanpa nunggu LLM), plus tool `ui.mode` di backend buat kalimat bebas ("tolong
bukain chat dong").

**Yang tersimpan tapi belum ada efeknya** (dikasih catatan langsung di Settings):
`faceRecognition`, `alertMode` (nunggu face recognition), `telegramNotif` (bot belum dibangun).

---

# Tahap 2 — Calendar & Reminder Tools

Enam file yang tadinya 0 byte (`tools/remainder/*`, `tools/calender/*`) sekarang keisi.
Ini prasyarat buat sistem inisiatif di Tahap 4.

**Parser waktu Bahasa Indonesia** (`utils/datetime.ts`) — dibikin sendiri karena LLM sering
salah kalau disuruh ngitung tanggal ("jumat depan" suka meleset seminggu). Tool nerima waktu
apa adanya ("besok jam 9 malam", "seminggu lagi", "jumat sore"), parsing-nya di TypeScript.
`rules.txt` dikasih instruksi tegas: jangan dihitung sendiri jadi ISO.

Dites dengan 17 kasus kalimat + 2 bug ketemu dan dibenerin:
- `jumat sore` awalnya jadi jam 08.00 (kata "sore" cuma dibaca kalau ada angka jam)
- `seminggu lagi` gak kebaca (regex cuma nyari angka, sekarang awalan "se-" = 1)

Waktu selesai di `calendar.create` dihitung relatif ke waktu **mulai**, bukan ke sekarang —
supaya `"senin jam 8"` + `selesai:"jam 10"` jatuh di hari Senin yang sama.

**Siap buat Tahap 4:** field `notified` di reminder/event, fungsi `dueReminders(leadMs)`
dan `upcomingEvents(leadMs)` udah disiapin dari sini.

---

# Tahap 3 — Tools Office

Lima tool sesuai spec: `generateDocx`, `generatePptx`, `generatePdf`, `readPdf`, `convertFile`.

**PDF pakai Playwright, bukan Puppeteer** (nyimpang dari spec) — soalnya project ini udah
punya Playwright buat browser tool. Puppeteer bakal nambah ~300MB Chromium kedua buat kerjaan
yang identik.

**Keamanan path** — bagian paling penting. LLM gak pernah nentuin path sama sekali, cuma nama
file. `resolveOutputPath()` (`config/paths.ts`) selalu `path.basename()` dulu sebelum dipakai,
jadi `../../etc/passwd` atau `/etc/passwd` berakhir jadi `passwd.docx` di dalam folder output —
gak pernah bisa nulis ke luar. Dites 6 kasus adversarial, semua aman.

**Perlu disiapin di Linux:** `soffice` (LibreOffice) buat `convertFile`, Chromium Playwright
buat `generatePdf`.

**Belum sempat runtime-test:** sandbox gw gak ada network buat `npm install` beneran, jadi
gak bisa coba generate `.docx`/`.pptx`/`.pdf` dan buka filenya. Yang udah dites: typecheck
bersih, keamanan path traversal.

Chat mode sekarang nampilin tautan **⬇ nama-file.docx** otomatis kalau tool office berhasil.

---

# Tahap 4 — Sistem Inisiatif

Scheduler jalan tiap 60 detik, `checkReminder()` + `checkCalendar()` narik data dari Tahap 2,
lolos decision logic baru manggil AI core buat nyusun kalimat, push ke WebSocket + audio VoiceVox.

**Decision logic:**
- Anti-duplikat: field `notified`, sekali kekirim gak nongol lagi
- Urgent (reminder udah jatuh tempo / event ≤5 menit lagi) nembus rate limit
- Non-urgent maksimal 1x per 10 menit — yang ditahan **gak** ditandai notified, dicoba lagi
  tick berikutnya (bukan ilang)
- State `lastNotifyAt` disimpan ke disk, restart backend gak reset rate limit

**Kepatuhan ke spec yang paling ketat:** *"Sistem ini TIDAK memanggil tools reaktif — hanya
berhak memanggil AI core."* Prompt buat notifikasi sengaja gak dikasih daftar tool sama sekali,
biar LLM secara struktural gak mungkin manggil `office.generateDocx` dari situ.

**Mematikan — dua jalur sesuai spec:** toggle "NYELETUK SENDIRI" di Settings, atau bilang
langsung ke LINA "jangan ganggu dulu" (tool `system.initiative`).

**Dites lewat simulasi terpisah** (scheduler manggil Groq + VoiceVox, gak kegapai dari sandbox):
5 skenario decision logic, semua lolos setelah benerin 1 bug di simulasi sendiri (pakai epoch
asli, bukan mulai dari 0 — biar cold-start ke-baca bener).

**Belum dites:** apakah kalimat notifikasi dari Groq beneran natural, dan suara VoiceVox-nya.
Coba `POST /api/scheduler/run-once` setelah bikin reminder "1 menit lagi".

**Catatan cold start:** kalau `scheduler-state.json` belum pernah ada, notifikasi pertama
setelah backend nyala bakal langsung kekirim walau non-urgent (karena `lastNotifyAt=0`
dibanding epoch sekarang = "udah lama banget"). Cuma kejadian sekali di awal, sesudahnya
tersimpan ke disk.

---

# Ringkasan Endpoint

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
| POST | `/api/reminders/:id/done` | Tandai selesai |
| GET/POST/DELETE | `/api/calendar[/:id]` | Kalender |
| GET | `/api/files` | Daftar file hasil office tools |
| GET | `/api/files/:name` | Download file |
| POST | `/api/agent/run` \| `/stop` | Agent mode |
| GET | `/api/agent/sessions[/:id]` | Riwayat sesi agent |
| POST | `/api/scheduler/run-once` | Trigger manual scheduler (debug) |

---

---

# Tambahan — Prompt Bisa Dibaca dari Vault Obsidian

Di luar 4 tahap, ada satu fitur tambahan: `buildPrompt.ts` sekarang bisa baca
`system.md` / `rules.md` / `personality.md` / `memory.md` / `japanes.md`
langsung dari folder vault Obsidian, bukan cuma dari `.txt` bawaan di
`src/prompts/`.

**Cara pasang:** lihat `obsidian-prompts/README.md` di root project — isinya
lengkap, tinggal ikutin. Ringkasnya: copy folder `obsidian-prompts/` ke vault,
set `PROMPTS_DIR=/path/ke/folder/itu` di `backend/.env` (file `.env.example`
sekarang juga udah dibikin, sebelumnya gak ada template-nya sama sekali).

**Cara kerjanya:**
- File dibaca ulang dari disk **tiap ada pesan masuk**, gak di-cache — jadi edit
  `personality.md` di Obsidian, save, pesan LINA berikutnya langsung berubah
  tanpa restart backend.
- Kalau satu file belum ada di vault (misal baru mau coba `personality.md`
  doang dulu), file yang lain otomatis fallback ke bundel `.txt` — gak akan
  crash gara-gara vault-nya belum lengkap.
- Blok YAML frontmatter Obsidian (`---...---` di paling atas) otomatis dibuang
  sebelum masuk ke prompt, jadi metadata catatan gak ikut nyampur ke LLM.
- Log startup nampilin sumbernya: `📓 Prompts dibaca dari: vault Obsidian (...)`
  atau `bundel bawaan` — biar ketauan mode mana yang lagi aktif.
- `scheduler.ts` (Tahap 4) dirapiin biar baca lewat fungsi yang sama
  (`readPrompt()`), bukan `fs.readFileSync` sendiri — supaya personality
  notifikasi inisiatif ikut sumber yang sama juga, gak nyimpang.

**Dites end-to-end** (ini murni baca file, gak butuh network, jadi bisa dites
penuh): 7 skenario — default tanpa `PROMPTS_DIR`, override tapi file belum
ada di vault, override dengan file ada, fallback per-file kalau cuma
sebagian yang ada di vault, frontmatter YAML kebuang bersih, live-edit
kebaca tanpa restart, dan `PROMPTS_DIR` nunjuk ke folder yang gak ada sama
sekali (gak crash). Semua lolos.

**Bug ketemu setelah dipasang beneran:** `rules.md` punya contoh JSON kayak
`"rows":[["10:00","25"],["10:05","27"]]` yang mengandung `[[...]]`. Obsidian
baca `[[...]]` di mana pun (bukan cuma yang disengaja) sebagai wiki-link,
jadi Graph View nampilin node aneh berjudul potongan JSON itu. Gak ngerusak
apa yang dibaca LINA (dia baca teks mentah), tapi berantakan kalau dibuka di
Obsidian. Dibenerin dengan bungkus 22 blok contoh JSON di `rules.txt`
(dan `obsidian-prompts/rules.md`) pakai code fence (```` ```json ... ``` ````)
— Obsidian gak nge-parse link di dalam code fence. Diverifikasi gak ada lagi
`[[` yang nongol di luar fence manapun di file itu.

---

# Tahap 5 — Foto ke Laporan (Agent Mode) + Preview/Finalize ke Telegram

Tiga potongan yang disambung jadi satu alur: Agent Mode sekarang bisa "melihat" foto yang
dilampirkan, hasilnya wajib direview dulu sebelum final, dan hasil final bisa didorong ke Telegram.

**Foto sebagai lampiran Agent Mode.** `extractFileText()` (`utils/fileText.ts`) sebelumnya balikin
`null` buat file gambar — sub-agent gak pernah tau isi fotonya. Sekarang ekstensi gambar
(`.jpg/.jpeg/.png/.webp/.bmp`) dikirim ke endpoint baru `POST /vision/photo` di vision-service
(`app/services/photo_service.py`) yang jalanin OCR (EasyOCR) + deskripsi VLM (`describe_image`,
model `riven/smolvlm` via Ollama) atas file yang di-upload — **bukan** dari `core/frame.py` yang
dipakai webcam, jadi gak numpang/ganggu state webcam sama sekali. Prompt VLM-nya juga dirombak
dari "satu kalimat" jadi deskripsi detail (objek, aktivitas, teks/angka yang keliatan), berlaku ke
semua caller `describe_image` termasuk webcam/`test-vlm`.

**Preview sebelum final.** `AgentStatus` dapet state baru `"preview"` — begitu sub-agent kelar dan
ringkasan tersusun, sesi berhenti di status ini (bukan langsung `"done"`) dan nunggu pengguna
review/edit dulu di UI. Endpoint baru `POST /api/agent/sessions/:id/finalize` nerima teks yang
sudah diedit (dipakai apa adanya, gak diproses ulang LLM sesuai keputusan produk), set status jadi
`"done"`, baru kirim ke Telegram.

**Kirim ke Telegram.** `services/telegram.ts` — kirim lewat Bot API (`sendMessage`), pesan panjang
dipecah per ±3500 karakter biar gak kena limit Telegram. Kalau `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`
kosong di `.env`, fitur ini diam-diam di-skip (cuma log info) — backend tetap jalan normal buat yang
gak butuh Telegram.

**Frontend.** `agentResultBody` diganti dari `<div>` jadi `<textarea>` — `readonly` pas status
`done`/`failed`, bisa diedit pas status `preview`. Tombol baru "✓ KIRIM" cuma muncul pas preview,
manggil endpoint finalize di atas.

**Bug `.gitignore` ketemu sambil jalan:** pola `backend/.env.*` ternyata ikut nge-ignore
`backend/.env.example` juga — file template itu gak pernah kecommit ke GitHub sejak awal. Ditambah
baris negasi `!backend/.env.example` biar templatenya ikut kepush, `.env` asli tetap aman diignore.

---

# Bug Ketemu Pas Tes Langsung di Windows

`services/memory.ts` (kode asli, bukan yang gw tulis) langsung `fs.writeFileSync()`
ke `src/data/memory.json` tanpa ngecek folder `src/data/` ada apa enggak dulu.
Di Linux kemarin gak ketauan karena kebetulan folder itu udah kebentuk dari
proses tes gw sebelumnya — begitu dicoba di Windows yang beneran fresh install
(baru extract zip, belum pernah ada `src/data/` sama sekali), langsung
`ENOENT: no such file or directory`.

Sambil benerin, gw grep semua `fs.writeFileSync` lain di project buat mastiin
gak ada bug yang sama ngumpet di tempat lain — ketemu satu lagi di
`services/conversation.ts` (dipake `history.ts`, aktif kepanggil tiap ada chat
masuk). Ini belum sempat ke-trigger pas tes kemarin karena errornya keburu
kejadian duluan di `memory.ts` sebelum ada pesan yang masuk. Dua-duanya
dibenerin dengan nambahin `mkdirSync(dir, {recursive:true})` sebelum nulis,
persis pola yang udah dipakai di semua service yang gw tulis sendiri
(`settings.ts`, `threads.ts`, `reminder.ts`, dst).

Dites ulang dengan simulasi folder `src/data/` yang beneran gak ada sama sekali
— `saveConversation()` sekarang bikin foldernya sendiri, gak crash.

---

# Yang Masih Jujur Belum Jalan

- `faceRecognition`, `alertMode` — toggle tersimpan, vision-service belum ada modulnya
- `telegramNotif` — toggle tersimpan, bot Telegram belum dibangun
- Sub-agent di Agent Mode belum boleh manggil tool — jawab dari pengetahuan model doang, belum bisa search beneran
- Reminder/event berulang (tiap hari / tiap senin) belum ada
- Office tools & scheduler belum di-runtime-test di sandbox — perlu dicoba langsung di Linux
