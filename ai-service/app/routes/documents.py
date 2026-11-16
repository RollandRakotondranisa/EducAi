import logging
import asyncio
import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..services.document_service import analyze_document
from ..services.llm_service import ask_document_llm_async, is_document_overview_request
from ..services.rag_service import rag_service
from ..schemas.document import (
    DocumentAnalysisResponse,
    DocumentChatRequest,
    CourseChatRequest,
    DocumentIndexRequest,
    DocumentIndexResponse,
)
from ..core.config import (
    AI_REQUEST_TIMEOUT,
    MAX_DOCUMENT_CHARACTERS,
    MAX_UPLOAD_SIZE_MB,
    RAG_TOP_K,
)


logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/documents/index", response_model=DocumentIndexResponse)
async def index_document(request: DocumentIndexRequest):
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(
                rag_service.create_index,
                request.text,
                request.document_id,
                request.course_id,
                request.teacher_id,
            ),
            timeout=AI_REQUEST_TIMEOUT,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="L'indexation du document dépasse le délai autorisé.",
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        logger.exception("Document indexing failed")
        raise HTTPException(status_code=503, detail="Impossible d'indexer le document") from error


@router.post("/documents/chat")
async def document_chat(request: DocumentChatRequest):
    try:
        started_at = time.perf_counter()
        rag_started_at = started_at
        overview_request = is_document_overview_request(request.message)
        get_context = rag_service.get_full_context if overview_request else rag_service.get_context
        context_args = (
            (request.course_id, request.teacher_id, request.document_id)
            if overview_request
            else (
                request.message,
                request.course_id,
                request.document_id,
                request.teacher_id,
                RAG_TOP_K,
            )
        )
        context = await asyncio.wait_for(
            asyncio.to_thread(
                get_context,
                *context_args,
            ),
            timeout=AI_REQUEST_TIMEOUT,
        )
        rag_latency_ms = (time.perf_counter() - rag_started_at) * 1000
        if not context:
            raise HTTPException(status_code=409, detail="Ce document n'est pas encore indexé ou ne contient pas cette information.")
        llm_started_at = time.perf_counter()
        response = await asyncio.wait_for(
            ask_document_llm_async(request.message, context),
            timeout=AI_REQUEST_TIMEOUT,
        )
        llm_latency_ms = (time.perf_counter() - llm_started_at) * 1000
        logger.info(
            "Document AI timings rag_latency_ms=%.2f llm_latency_ms=%.2f total_latency_ms=%.2f "
            "document_id=%s course_id=%s teacher_id=%s",
            rag_latency_ms,
            llm_latency_ms,
            (time.perf_counter() - started_at) * 1000,
            request.document_id,
            request.course_id,
            request.teacher_id,
        )
        return {"success": True, "data": {"response": response}}
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Le traitement du document dépasse le délai autorisé.",
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except Exception as error:
        logger.exception("Document chat failed")
        raise HTTPException(status_code=502, detail="Le service IA est momentanément indisponible") from error


@router.post("/courses/chat")
async def course_chat(request: CourseChatRequest):
    try:
        overview_request = is_document_overview_request(request.message)
        get_context = rag_service.get_full_context if overview_request else rag_service.get_context
        context_args = (
            (request.course_id, request.teacher_id)
            if overview_request
            else (
                request.message,
                request.course_id,
                None,
                request.teacher_id,
                RAG_TOP_K,
            )
        )
        context = await asyncio.wait_for(
            asyncio.to_thread(
                get_context,
                *context_args,
            ),
            timeout=AI_REQUEST_TIMEOUT,
        )
        if not context:
            raise HTTPException(
                status_code=409,
                detail="Les documents de ce cours ne sont pas encore disponibles pour l'assistance IA.",
            )
        response = await asyncio.wait_for(
            ask_document_llm_async(request.message, context),
            timeout=AI_REQUEST_TIMEOUT,
        )
        sources = []
        with_sources = await asyncio.to_thread(
            rag_service.search,
            request.message,
            request.course_id,
            None,
            request.teacher_id,
            RAG_TOP_K,
        )
        seen = set()
        for document in with_sources:
            document_id = document.metadata.get("document_id")
            if document_id not in seen:
                sources.append({"document_id": document_id})
                seen.add(document_id)
        return {"success": True, "data": {"response": response, "sources": sources}}
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Le traitement du cours dépasse le délai autorisé.")
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except Exception as error:
        logger.exception("Course AI failed")
        raise HTTPException(status_code=502, detail="Le service IA est momentanément indisponible") from error


@router.post(
    "/documents/analyze",
    response_model=DocumentAnalysisResponse,
)
async def analyze_uploaded_document(
    file: UploadFile = File(...)
):
    """
    Reçoit un document PDF, DOCX ou PPTX
    et extrait son contenu textuel.
    """

    allowed_extensions = {
        ".pdf",
        ".docx",
        ".pptx",
    }

    filename = file.filename or ""

    extension = ""

    if "." in filename:
        extension = "." + filename.split(".")[-1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Format non supporté. "
                "Utilisez un fichier PDF, DOCX ou PPTX."
            ),
        )

    try:

        max_upload_size = MAX_UPLOAD_SIZE_MB * 1024 * 1024
        file_content = await file.read(max_upload_size + 1)

        if len(file_content) > max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"Le fichier dépasse la taille maximale de {MAX_UPLOAD_SIZE_MB} Mo.",
            )

        if not file_content:
            raise HTTPException(
                status_code=400,
                detail="Le fichier est vide.",
            )

        is_valid_signature = (
            extension == ".pdf" and file_content.startswith(b"%PDF-")
        ) or (
            extension in {".docx", ".pptx"}
            and file_content.startswith(b"PK\x03\x04")
        )
        if not is_valid_signature:
            raise HTTPException(
                status_code=400,
                detail="Le contenu du fichier ne correspond pas à son extension.",
            )

        result = await asyncio.wait_for(
            asyncio.to_thread(
                analyze_document,
                file_content=file_content,
                filename=filename,
            ),
            timeout=AI_REQUEST_TIMEOUT,
        )

        if len(result["text"]) > MAX_DOCUMENT_CHARACTERS:
            raise HTTPException(
                status_code=413,
                detail="Le texte extrait dépasse la taille maximale autorisée.",
            )

        logger.info(f"Document analyzed: {filename} ({result['file_type']})")

        return result

    except HTTPException:
        raise

    except ValueError as error:

        logger.warning(f"Document analysis error: {str(error)}")

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        logger.error(f"Unexpected error analyzing document: {str(error)}")

        raise HTTPException(
            status_code=500,
            detail=(
                "Erreur lors de l'analyse du document. "
                "Veuillez réessayer."
            ),
        )
