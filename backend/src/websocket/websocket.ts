import { WebSocketServer, WebSocket } from "ws";

const clients = new Set<WebSocket>();

export function setupWebsocketServer(server: any, onInterrupt: () => void) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        clients.add(ws);

        ws.on("message", (msg) => {
            try {
                const data = JSON.parse(msg.toString());

                if (data.type === "INTERRUPT") {
                    console.log("🔴 Interrupt Diterima");
                    onInterrupt();
                }
            } catch (err) {
                console.error(err);
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
        });

        ws.on("error", () => {
            clients.delete(ws);
        });
    });
}

/** Kirim payload apa pun ke semua frontend yang lagi konek. */
export function broadcast(payload: Record<string, unknown>): void {
    const text = JSON.stringify(payload);

    for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(text);
        }
    }
}

export function kirimKeFrontend(
    status: string,
    userVoice: string,
    jarvisResponse: string,
    amp: number,
    audioBase64: string = ""
) {
    broadcast({
        status,
        userVoice,
        jarvisResponse,
        amp,
        audioBase64
    });
}
