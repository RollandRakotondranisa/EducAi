import asyncio
import logging
import re
import time

from fastapi import APIRouter, HTTPException

from ..schemas.llm import LLMRequest
from ..core.config import AI_REQUEST_TIMEOUT
from ..services.llm_service import ask_llm_async


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat")
async def chat(request: LLMRequest):
    try:
        started_at = time.perf_counter()
        response = await asyncio.wait_for(
            ask_llm_async(request.message, request.context),
            timeout=AI_REQUEST_TIMEOUT,
        )
        logger.info(
            "General AI timings llm_latency_ms=%.2f total_latency_ms=%.2f",
            (time.perf_counter() - started_at) * 1000,
            (time.perf_counter() - started_at) * 1000,
        )

        return {
            "success": True,
            "message": "Réponse générée avec succès",
            "data": {
                "response": response
            }
        }

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Le service Gemini met trop de temps à répondre. Réessayez dans quelques instants.",
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )
    except Exception as error:
        error_text = str(error)
        logger.exception("Gemini request failed: %s", error_text)
        if "NOT_FOUND" in error_text or "GoogleModelNotFoundError" in error_text:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Le modèle Gemini configuré est indisponible pour ce projet. "
                    "Vérifiez GEMINI_MODEL dans le fichier .env."
                ),
            )
        if "DEADLINE_EXCEEDED" in error_text or "504" in error_text:
            raise HTTPException(
                status_code=504,
                detail="Gemini n'a pas répondu dans le délai imparti. Réessayez dans quelques instants.",
            )
        if "RESOURCE_EXHAUSTED" in error_text or "429" in error_text:
            retry_match = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)s", error_text, re.IGNORECASE)
            retry_seconds = int(float(retry_match.group(1))) + 1 if retry_match else 60
            raise HTTPException(
                status_code=429,
                detail=(
                    "Le quota Gemini est temporairement épuisé. "
                    f"Réessayez dans environ {retry_seconds} secondes, "
                    "ou activez la facturation/augmentez les limites de votre projet Google AI."
                ),
                headers={"Retry-After": str(retry_seconds)},
            )
        raise HTTPException(
            status_code=502,
            detail="Le service IA est momentanément indisponible. Réessayez plus tard.",
        )
