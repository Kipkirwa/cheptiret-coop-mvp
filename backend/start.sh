#!/bin/bash
echo "🚀 Starting Cheptiret Coop API..."
echo ""

# Activate virtual environment
source venv/bin/activate

# Initialize database
echo "📦 Initializing database..."
python scripts/init_db.py

# Start FastAPI server
echo "🌐 Starting server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000