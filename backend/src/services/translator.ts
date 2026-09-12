import { GROQ_MODEL, DEFAULT_JAPANESE } from "../config/constants";
import { groq } from "./groq";

export async function translateToJapanese(
    text: string
): Promise<string> {

    const terjemahan = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0,
        messages: [
            {
                role: "system",
                content: `
                kamu adalah mesin penerjemah.

                Terjemahkan kalimat pengguna ke dalam bahasa Jepang.

                WAJIB menggunakan:
                - Kanji
                - Hiragana
                - Katakana

                DILARANG:
                - Romaji
                - Penjelasan

                Jika gagal, cukup tulis:
                こんにちは

                Output hanya hasil terjemahan.`
            },
            {
                role: "user",
                content: text
            }
        ]
    });

    return (
        terjemahan.choices[0]?.message?.content?.trim() ?? DEFAULT_JAPANESE
    );
}