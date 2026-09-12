# LINA Prompts — buat vault Obsidian

Isi folder ini identik sama `backend/src/prompts/*.txt` yang dipakai LINA
sekarang, cuma diganti ekstensi jadi `.md`. Selama isinya belum diubah,
LINA jalan persis kayak sebelumnya.

## Cara pasang

1. Copy seluruh folder ini (`obsidian-prompts/`) ke dalam vault Obsidian
   lu — boleh taruh di mana aja, misal `<vault>/LINA/`.

2. Tambahin baris ini ke `backend/.env`:

   ```
   PROMPTS_DIR=/path/lengkap/ke/vault/LINA
   ```

   Ganti dengan path absolut ke folder tadi. Contoh di Linux kalau vault-nya
   di `~/Documents/ObsidianVault/LINA`:

   ```
   PROMPTS_DIR=/home/user/Documents/ObsidianVault/LINA
   ```

3. Restart backend. Cek log startup — harus muncul baris:

   ```
   📓 Prompts dibaca dari: vault Obsidian (/path/lu/tadi)
   ```

   Kalau yang muncul malah *"bundel bawaan"*, berarti `PROMPTS_DIR` salah
   ketik atau foldernya belum ada di path itu.

## Edit sambil LINA jalan

File dibaca ulang dari disk **setiap ada pesan masuk** (gak di-cache), jadi
edit `personality.md` di Obsidian terus save — pesan LINA berikutnya langsung
kepake tanpa perlu restart backend.

## Lima file yang wajib ada

| File | Isinya apa |
|---|---|
| `system.md` | Identitas dasar LINA + modul Vision |
| `rules.md` | Format JSON wajib + daftar semua tool |
| `personality.md` | Gaya bicara, kepribadian |
| `memory.md` | Aturan apa yang layak disimpan sebagai memori jangka panjang |
| `japanes.md` | Aturan terjemahan ke Bahasa Jepang buat suara |

Kalau salah satu file **belum ada** di vault (misal lu baru mau coba edit
`personality.md` doang dulu), LINA otomatis jatuh balik ke versi bawaan
`.txt` buat file yang lain — gak akan crash cuma gara-gara satu file belum
ada.

## Frontmatter Obsidian aman dipakai

Kalau lu nambahin metadata di atas file (buat kerapian di Obsidian):

```
---
tags: [lina, prompt]
updated: 2026-09-10
---

Kepribadian LINA:
...
```

Bagian `---...---` di paling atas otomatis dibuang sebelum dikirim ke LLM,
jadi gak ikut nyampur ke prompt. Tapi hati-hati kalau nulis blok `---` lain
di tengah isi (bukan di baris pertama) — cuma blok paling atas yang dibuang.

## Kalau mau balik ke bundel bawaan

Hapus atau comment baris `PROMPTS_DIR` di `.env`, restart backend. File asli
di `backend/src/prompts/*.txt` gak pernah kesentuh sama sekali oleh fitur
ini — tetap ada sebagai fallback selamanya.
