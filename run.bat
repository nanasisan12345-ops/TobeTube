@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  start "" /b py -3 scripts\open-browser.py
  py -3 -m http.server 8080 --bind 127.0.0.1
  exit /b
)

where python >nul 2>nul
if not errorlevel 1 (
  start "" /b python scripts\open-browser.py
  python -m http.server 8080 --bind 127.0.0.1
  exit /b
)

echo Python 3 was not found.
echo See the local setup section in README.md.
pause
exit /b 1
