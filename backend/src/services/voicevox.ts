import { VOICEVOX_API_URL } from "../config/env";

export async function generateVoice(
    text: string,
    speakerId: number,
    signal: AbortSignal
): Promise<string> {

    console.log("=============== TEKS KE VOICEVOX ===============");
    console.log("TEKS JEPANG :", text);
    console.log("==============================")

    const params = new URLSearchParams({
        text,
        speaker: speakerId.toString()
    });

    const queryResponse = await fetch(
        `${VOICEVOX_API_URL}/audio_query?${params.toString()}`,
        {
            method: "POST",
            signal
        }
    );

    if(!queryResponse.ok) {
            throw new Error("Audio Query gagal")
        }

    console.log("audio query selesai");

    const queryJson = await queryResponse.json();

    console.log("query json OK!");
    console.log("request synthesis");

    const synthResponse = await fetch(
        `${VOICEVOX_API_URL}/synthesis?speaker=${speakerId}`, {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify(queryJson),
            signal
        }
    );

    if (!synthResponse.ok) {
            throw new Error("synthesis gagal")
        }

    console.log("synthesis selesai");

    const audioBase64 = Buffer.from(
        await synthResponse.arrayBuffer()
    ).toString("base64");

    return audioBase64;
}