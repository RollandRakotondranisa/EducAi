#!/usr/bin/env python
"""
Script pour démarrer le service AI de EduAI
"""
import sys
import os
from pathlib import Path

# Ajouter le répertoire courant au sys.path
sys.path.insert(0, str(Path(__file__).parent))

import uvicorn
from app.core.config import AI_SERVICE_HOST, AI_SERVICE_PORT


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=AI_SERVICE_HOST,
        port=AI_SERVICE_PORT,
        reload=True,
    )
