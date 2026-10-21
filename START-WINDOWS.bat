@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>&1 || (echo Python 3.10+ gerekli. & pause & exit /b 1)
where npm >nul 2>&1 || (echo Node.js 20+ gerekli. & pause & exit /b 1)
if not exist backend\.venv python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt || (pause & exit /b 1)
if not exist frontend\node_modules (cd frontend && call npm install --no-audit --no-fund) || (pause & exit /b 1)
start "Social OS API" /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"
start "Social OS Web" /D "%~dp0frontend" cmd /k "npm run dev"
echo Dashboard: http://127.0.0.1:5173
timeout /t 4 >nul
start "" "http://127.0.0.1:5173"
