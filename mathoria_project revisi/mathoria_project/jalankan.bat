@echo off
cd /d "%~dp0"
where python >nul 2>nul && (python app.py) || (py app.py)
pause
