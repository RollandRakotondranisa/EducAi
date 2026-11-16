from fastapi import APIRouter, HTTPException

from app.schemas.llm import LLMRequest
from app.services.llm_service import ask_llm


router = APIRouter()


@router.post("/chat")
async def chat(request: LLMRequest):

    try:

        response = ask_llm(
            request.message
        )

        return {
            "success": True,
            "message": "Réponse générée avec succès",
            "data": {
                "response": response
            }
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )