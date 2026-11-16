import asyncio
import logging

from fastapi import APIRouter, HTTPException

from ..core.config import AI_REQUEST_TIMEOUT
from ..schemas.exam_grading import ExamGradingRequest, ExamGradingResponse
from ..services.exam_grading_service import suggest_exam_grades


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/correction-suggestions", response_model=ExamGradingResponse)
async def correction_suggestions(request: ExamGradingRequest):
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(suggest_exam_grades, request),
            timeout=AI_REQUEST_TIMEOUT,
        )
    except asyncio.TimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="La génération des suggestions de correction dépasse le délai autorisé.",
        ) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:
        logger.exception("Exam grading suggestion failed")
        raise HTTPException(
            status_code=502,
            detail="Le service IA est momentanément indisponible.",
        ) from error
