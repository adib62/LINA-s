/**
 * Parser waktu Bahasa Indonesia.
 *
 * LLM sering salah kalau disuruh menghitung tanggal sendiri, jadi tool
 * menerima teks apa adanya ("besok jam 9", "5 menit lagi") dan konversi
 * ke timestamp dilakukan di sini.
 *
 * Semua perhitungan memakai waktu lokal mesin. Jalankan backend dengan
 * TZ=Asia/Jakarta kalau lokasi server berbeda.
 */

export interface ParsedTime {
    /** Epoch milidetik. */
    at: number;
    /** Bentuk yang enak dibaca manusia, buat konfirmasi ke pengguna. */
    label: string;
}

const HARI = [
    "minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"
];

const SATUAN_MS: Record<string, number> = {
    detik: 1000,
    menit: 60 * 1000,
    jam: 60 * 60 * 1000,
    hari: 24 * 60 * 60 * 1000,
    minggu: 7 * 24 * 60 * 60 * 1000,
    bulan: 30 * 24 * 60 * 60 * 1000
};

export function formatWaktu(date: Date): string {
    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

/** Terapkan kata pagi/siang/sore/malam ke jam 12-an. */
function terapkanPeriode(jam: number, teks: string): number {
    if (/malam/.test(teks)) {
        if (jam === 12) return 0;
        return jam < 12 ? jam + 12 : jam;
    }
    if (/sore|petang/.test(teks)) {
        return jam < 12 ? jam + 12 : jam;
    }
    if (/siang/.test(teks)) {
        return jam >= 1 && jam <= 5 ? jam + 12 : jam;
    }
    if (/pagi|subuh/.test(teks)) {
        return jam === 12 ? 0 : jam;
    }
    return jam;
}

export function parseWaktu(input: string, now: Date = new Date()): ParsedTime | null {
    if (!input) return null;

    const teks = input.toLowerCase().trim();

    // ---------- 1. Format ISO / tanggal eksplisit ----------
    if (/^\d{4}-\d{2}-\d{2}/.test(teks)) {
        const d = new Date(input);
        if (!isNaN(d.getTime())) {
            return { at: d.getTime(), label: formatWaktu(d) };
        }
    }

    // ---------- 2. Relatif: "5 menit lagi", "2 jam kemudian", "seminggu lagi" ----------
    const relatif = teks.match(
        /(\d+|se)\s*(detik|menit|jam|hari|minggu|bulan)\s*(lagi|kemudian|dari sekarang|ke depan)?/
    );

    if (relatif && (relatif[3] || /\blagi\b/.test(teks))) {
        // Awalan "se-" berarti satu: seminggu, sejam, sehari
        const jumlah = relatif[1] === "se" ? 1 : parseInt(relatif[1], 10);
        const ms = SATUAN_MS[relatif[2]];

        if (ms && jumlah > 0) {
            const d = new Date(now.getTime() + jumlah * ms);
            return { at: d.getTime(), label: formatWaktu(d) };
        }
    }

    // ---------- 3. Tentukan hari ----------
    const target = new Date(now.getTime());

    // hariDitentukan: ada petunjuk hari sama sekali.
    // hariEksplisit: hari disebut jelas (besok/lusa/nama hari/tanggal),
    // sehingga hasil di masa lalu TIDAK boleh digeser ke besok.
    let hariDitentukan = false;
    let hariEksplisit = false;

    if (/\blusa\b/.test(teks)) {
        target.setDate(target.getDate() + 2);
        hariDitentukan = hariEksplisit = true;
    } else if (/\bbesok\b|\besok\b/.test(teks)) {
        target.setDate(target.getDate() + 1);
        hariDitentukan = hariEksplisit = true;
    } else if (/\bhari ini\b|\bnanti\b/.test(teks)) {
        // "nanti sore" berarti masa depan, jadi biarkan bisa digeser
        hariDitentukan = true;
    } else {
        // Nama hari: "senin", "jumat depan"
        for (let i = 0; i < HARI.length; i++) {
            const nama = HARI[i];
            const pola = nama === "minggu"
                ? /\bhari minggu\b|\bminggu depan\b/   // hindari bentrok dengan satuan "minggu"
                : new RegExp(`\\b${nama}\\b`);

            if (pola.test(teks)) {
                let selisih = (i - target.getDay() + 7) % 7;
                if (selisih === 0) selisih = 7;
                if (/depan/.test(teks) && selisih < 7) selisih += 0;
                target.setDate(target.getDate() + selisih);
                hariDitentukan = hariEksplisit = true;
                break;
            }
        }
    }

    // Tanggal eksplisit: "tanggal 15"
    const tanggal = teks.match(/tanggal\s+(\d{1,2})/);
    if (tanggal) {
        const hari = parseInt(tanggal[1], 10);
        if (hari >= 1 && hari <= 31) {
            target.setDate(hari);
            if (target.getTime() < now.getTime()) {
                target.setMonth(target.getMonth() + 1);
            }
            hariDitentukan = hariEksplisit = true;
        }
    }

    // ---------- 4. Tentukan jam ----------
    // "jam 9", "jam 09.30", "pukul 14:00", atau "07:15" telanjang
    const jamMatch =
        teks.match(/(?:jam|pukul)\s*(\d{1,2})(?:[.:](\d{1,2}))?/) ||
        teks.match(/\b(\d{1,2})[.:](\d{2})\b/);

    let jamDitentukan = false;

    if (jamMatch) {
        let jam = parseInt(jamMatch[1], 10);
        const menit = jamMatch[2] ? parseInt(jamMatch[2], 10) : 0;

        if (jam >= 0 && jam <= 23 && menit >= 0 && menit <= 59) {
            jam = terapkanPeriode(jam, teks);
            target.setHours(jam, menit, 0, 0);
            jamDitentukan = true;
        }
    } else if (hariDitentukan) {
        // Ada hari tapi jam tidak disebut angkanya.
        // Ambil dari kata periode kalau ada ("jumat sore"), kalau tidak default jam 8.
        let jamDefault = 8;

        if (/subuh/.test(teks)) jamDefault = 5;
        else if (/pagi/.test(teks)) jamDefault = 8;
        else if (/siang/.test(teks)) jamDefault = 12;
        else if (/sore|petang/.test(teks)) jamDefault = 16;
        else if (/malam/.test(teks)) jamDefault = 19;

        target.setHours(jamDefault, 0, 0, 0);
        jamDitentukan = true;
    }

    if (!jamDitentukan && !hariDitentukan) {
        return null;
    }

    // Hasil sudah lewat dan hari tidak disebut eksplisit → geser ke besok.
    // Ini yang bikin "jam 10" pukul 14:00 jadi besok, bukan tadi pagi.
    if (!hariEksplisit && target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }

    return { at: target.getTime(), label: formatWaktu(target) };
}

/** "dalam 5 menit", "3 jam lagi", "sudah lewat 2 hari" */
export function jarakWaktu(at: number, now: number = Date.now()): string {
    const diff = at - now;
    const lewat = diff < 0;
    const abs = Math.abs(diff);

    const menit = Math.round(abs / 60000);
    const jam = Math.round(abs / 3600000);
    const hari = Math.round(abs / 86400000);

    let inti: string;
    if (menit < 1) inti = "kurang dari semenit";
    else if (menit < 60) inti = `${menit} menit`;
    else if (jam < 24) inti = `${jam} jam`;
    else inti = `${hari} hari`;

    return lewat ? `${inti} yang lalu` : `${inti} lagi`;
}
