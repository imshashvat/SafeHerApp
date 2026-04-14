@echo off
title SafeHer — Starting Services
color 0A

echo.
echo  ███████╗ █████╗ ███████╗███████╗██╗  ██╗███████╗██████╗ 
echo  ██╔════╝██╔══██╗██╔════╝██╔════╝██║  ██║██╔════╝██╔══██╗
echo  ███████╗███████║█████╗  █████╗  ███████║█████╗  ██████╔╝
echo  ╚════██║██╔══██║██╔══╝  ██╔══╝  ██╔══██║██╔══╝  ██╔══██╗
echo  ███████║██║  ██║██║     ███████╗██║  ██║███████╗██║  ██║
echo  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
echo.
echo  Women Safety Crime Prediction System
echo  NIET Greater Noida — ML + React + Flask
echo  ─────────────────────────────────────────────────────────
echo.

REM ── Check Python ────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found. Install from python.org
        pause
        exit /b 1
    )
    set PYTHON=py
) else (
    set PYTHON=python
)

REM ── Check Node ──────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)

echo [1/3] Installing backend dependencies...
pip install -r backend\requirements.txt -q --disable-pip-version-check
echo       Done.

echo [2/3] Installing frontend dependencies...
cd frontend
npm install --silent 2>nul
cd ..
echo       Done.

echo.
echo [3/3] Starting SafeHer services...
echo.
echo  Backend  →  http://localhost:5000/api/health
echo  Frontend →  http://localhost:5173
echo.
echo  Press CTRL+C in each window to stop.
echo ─────────────────────────────────────────────────────────
echo.

REM ── Launch Backend in a new window ──────────────────────────
start "SafeHer Backend (Flask :5000)" cmd /k "color 0B && echo SafeHer Flask Backend && echo ─────────────────────────────── && py backend\app.py"

REM ── Small delay so backend starts first ─────────────────────
timeout /t 3 /nobreak >nul

REM ── Launch Frontend in a new window ─────────────────────────
start "SafeHer Frontend (Vite :5173)" cmd /k "color 0D && echo SafeHer React Frontend && echo ─────────────────────────────── && cd frontend && npm run dev"

REM ── Wait then open browser ──────────────────────────────────
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo  [OK] Both services are starting in separate windows.
echo  [OK] Browser opening http://localhost:5173
echo.
echo  If the map is empty, wait 5 seconds — the backend needs
echo  to load 1,032 districts from the NCRB dataset first.
echo.
pause
