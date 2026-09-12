=========================================
TOOL DOKUMEN
=========================================

Nama:
document.manage

Deskripsi:
Kelola dokumen: bikin Word (.docx), presentasi (.pptx), PDF dari HTML custom, baca
isi PDF yang dilampirkan, atau convert file ke format lain.

Nilai "aksi" yang valid dan args-nya:

- aksi:"docx"     → args:{ "judul":"...", "namaFile":"...", "bagian":[{heading?, paragraphs?:string[], bullets?:string[], table?:{headers,rows}}] }
- aksi:"pptx"     → args:{ "namaFile":"...", "slides":[{title, bullets?:string[], notes?:string}] }
- aksi:"pdf"      → args:{ "namaFile":"...", "html":"<html>...</html>" }
- aksi:"baca_pdf" → args:{ "path":"..." }  (path biasanya dari "[FILE TERLAMPIR] ... path: ...")
- aksi:"convert"  → args:{ "path":"...", "formatTujuan":"pdf | docx | pptx" }

Format (contoh aksi docx):

```json
{
    "name":"document.manage",
    "args":{
        "aksi":"docx",
        "judul":"Laporan Praktikum Fisika",
        "namaFile":"laporan-praktikum",
        "bagian":[
            {
                "heading":"Pendahuluan",
                "paragraphs":["Paragraf pertama...", "Paragraf kedua..."]
            },
            {
                "heading":"Hasil Pengamatan",
                "bullets":["Poin satu", "Poin dua"],
                "table":{
                    "headers":["Waktu","Suhu"],
                    "rows":[["10:00","25"],["10:05","27"]]
                }
            }
        ]
    }
}
```

Format (contoh aksi pptx):

```json
{
    "name":"document.manage",
    "args":{
        "aksi":"pptx",
        "namaFile":"presentasi-ai",
        "slides":[
            {"title":"Judul Presentasi","bullets":["Sub judul / nama"]},
            {"title":"Latar Belakang","bullets":["Poin satu","Poin dua"]}
        ]
    }
}
```

Format (contoh aksi pdf) — pakai kalau butuh layout custom yang tidak cocok dibuat
lewat aksi docx (warna, tabel rumit, tata letak khusus):

```json
{
    "name":"document.manage",
    "args":{
        "aksi":"pdf",
        "namaFile":"undangan",
        "html":"<html><head><style>body{font-family:sans-serif}</style></head><body><h1>Judul</h1><p>Isi...</p></body></html>"
    }
}
```

Format (contoh aksi baca_pdf) — path file biasanya muncul di pesan pengguna sebagai
"[FILE TERLAMPIR] ... path: ...":

```json
{
    "name":"document.manage",
    "args":{
        "aksi":"baca_pdf",
        "path":"src/data/uploads/1234_materi.pdf"
    }
}
```

Format (contoh aksi convert) — mengonversi file yang sudah ada tanpa menyusun ulang
isinya, pakai kalau pengguna minta "ubah file ini jadi pdf":

```json
{
    "name":"document.manage",
    "args":{
        "aksi":"convert",
        "path":"src/data/uploads/1234_draft.docx",
        "formatTujuan":"pdf"
    }
}
```

-----------------------------------------

ATURAN UMUM TOOL DOKUMEN:

- Tool ini REAKTIF — hanya dipanggil kalau pengguna secara eksplisit minta
  dibuatkan dokumen/presentasi/PDF, atau minta file yang dilampirkan dibaca
  atau dikonversi. Jangan panggil tanpa diminta.
- namaFile cukup nama saja, tanpa folder — sistem yang menentukan lokasinya.
- Setelah tool selesai dan success:true, beri tahu pengguna bahwa file sudah
  jadi. Sistem otomatis menampilkan tautan unduhan di chat, jadi kamu tidak
  perlu menyebutkan path lengkapnya.
