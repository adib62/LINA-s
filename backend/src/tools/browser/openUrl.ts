import { exec } from "child_process";
import { Tool } from "../tool";

/** Perintah buka URL beda-beda per OS: Windows pakai `start`, macOS `open`, Linux `xdg-open`. */
function openCommand(url: string): string {
    if (process.platform === "win32") {
        // Argumen pertama "start" dianggap judul window, jadi dikasih string kosong.
        return `start "" "${url}"`;
    }
    if (process.platform === "darwin") {
        return `open "${url}"`;
    }
    return `xdg-open "${url}"`;
}

export const OpenUrl: Tool = {
    name: "browser.open",

    description: "Open URL using default browser.",

    parameters: {
        url: "string"
    },

    async execute(args) {

        const url = String(args.url ?? "");

        return new Promise((resolve) => {

            exec(openCommand(url), (error) => {

                if (error) {
                    resolve({
                        success: false,
                        message: error.message
                    });
                    return;
                }

                resolve({
                    success: true,
                    message: `URL ${url} berhasil dibuka.`
                });

            });

        });

    }
};