@echo off
echo 🚀 Starting Cheptiret Coop API...
echo.

REM Activate virtual environment
call venv\Scripts\activate

REM Initialize database
echo 📦 Initializing database...
python scripts\init_db.py

REM Start FastAPI server
echo 🌐 Starting server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000