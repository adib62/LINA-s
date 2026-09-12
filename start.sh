#!/usr/bin/env bash
# Jalanin backend (Node/TS) + vision-service (Python) bareng dalam satu perintah.
# Jalan di Windows (Git Bash) maupun Linux tanpa perubahan.
#
# Pemakaian:
#   ./start.sh              -> backend + vision-service
#   ./start.sh --no-vision  -> backend doang (skip vision-service)
#
# Ctrl+C sekali bakal matiin dua-duanya.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VISION_DIR="$BACKEND_DIR/vision-service"

SKIP_VISION=0
[ "$1" = "--no-vision" ] && SKIP_VISION=1

PYTHON_BIN="python3"
command -v python3 >/dev/null 2>&1 || PYTHON_BIN="python"

pids=()

cleanup() {
    echo ""
    echo "Menghentikan semua servis..."
    for pid in "${pids[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    exit 0
}
trap cleanup INT TERM

echo "== LINA =="

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "[!] backend/node_modules belum ada. Jalanin dulu: cd backend && npm install"
    exit 1
fi

if [ "$SKIP_VISION" -eq 0 ]; then
    if [ -d "$VISION_DIR" ]; then
        if ! curl -s -o /dev/null "http://127.0.0.1:11434" 2>/dev/null; then
            echo "[!] Ollama kelihatannya belum jalan di :11434 - deskripsi foto (VLM) di Agent Mode bakal gagal."
            echo "    Jalanin 'ollama serve' dan 'ollama pull riven/smolvlm' kalau butuh fitur itu."
        fi

        echo "[vision-service] starting on :8000 ..."
        (cd "$VISION_DIR" && "$PYTHON_BIN" run.py) &
        pids+=($!)
        sleep 1
    else
        echo "[!] Folder vision-service gak ketemu, dilewati."
    fi
else
    echo "[vision-service] dilewati (--no-vision)"
fi

echo "[backend] starting on :5000 ..."
(cd "$BACKEND_DIR" && npx ts-node src/main.ts) &
pids+=($!)

echo ""
echo "Semua servis jalan. Buka http://localhost:5000 - Ctrl+C buat matiin semua."
echo ""

wait
