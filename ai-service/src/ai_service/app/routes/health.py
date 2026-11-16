from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
async def health():
    return {
        "success": True,
        "service": "EduAI AI Service",
        "status": "running",
    }
