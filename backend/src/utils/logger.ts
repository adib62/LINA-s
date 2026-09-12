export function logRawResponse(
    waktu: string,
    raw: string
) {
    console.log("\n=============================================");
    console.log(`WAKTU SISTEM : ${waktu}`);
    console.log("RAW JAWABAN GROQ(JSON) :", raw);
    console.log("=============================================\n");
}

export function logError(
    title: string,
    error: unknown
) {
    console.error(`${title}`);
    console.error(error);
}

export function logInfo(
    message: string
) {
    console.log(message);
}