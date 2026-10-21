#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
printf '\n\033[1;35m✦ FRAMEERA SOCIAL OS\033[0m\n\n'
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 bulunamadı. https://www.python.org/downloads/ adresinden Python 3.10+ kurun."; read -r -p 'Enter...' _; exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js/npm bulunamadı. https://nodejs.org/ adresinden Node.js 20+ kurun."; read -r -p 'Enter...' _; exit 1
fi
if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "Python ortamı hazırlanıyor..."
  python3 -m venv "$ROOT/backend/.venv"
fi
"$ROOT/backend/.venv/bin/python" -m pip install --disable-pip-version-check -q -r "$ROOT/backend/requirements.txt"
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Frontend bağımlılıkları kuruluyor..."
  (cd "$ROOT/frontend" && npm install --no-audit --no-fund)
fi
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 || lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
 echo '8000 veya 5173 portu meşgul. Açık Social OS pencerelerini kapatıp tekrar deneyin.'; read -r -p 'Enter...' _; exit 1
fi
stop_all(){ echo; echo 'Social OS kapatılıyor...'; kill "$API_PID" "$UI_PID" 2>/dev/null || true; wait 2>/dev/null || true; }
trap stop_all EXIT INT TERM
(cd "$ROOT/backend" && "$ROOT/backend/.venv/bin/python" -m uvicorn main:app --host 127.0.0.1 --port 8000) & API_PID=$!
(cd "$ROOT/frontend" && npm run dev) & UI_PID=$!
for i in $(seq 1 150); do
  if curl -fsS http://127.0.0.1:5173 >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    echo; echo '✦ Hazır: http://127.0.0.1:5173';
    if command -v open >/dev/null 2>&1; then open 'http://127.0.0.1:5173'; fi
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null || ! kill -0 "$UI_PID" 2>/dev/null; then
    echo 'Sunuculardan biri başlatılamadı. Yukarıdaki hata mesajını kontrol edin.'; exit 1
  fi
  sleep 1
done
echo 'Kapatmak için Control + C. Bu Terminal penceresini açık tutun.'
wait
