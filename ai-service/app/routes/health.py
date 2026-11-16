from fastapi import APIRouter

from ..core.config import GOOGLE_API_KEY
from ..services.rag_service import rag_service

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "success": True,
        "service": "EduAI AI Service",
        "status": "running",
        "gemini_configured": bool(GOOGLE_API_KEY),
        "rag_available": bool(rag_service.vector_stores),
    }
