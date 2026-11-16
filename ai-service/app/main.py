import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .routes.health import router as health_router
from .routes.llm import router as llm_router
from .routes.exam_grading import router as exam_grading_router
from .routes import documents

app = FastAPI(
    title="EduAI AI Service",
    description="Service IA de la plateforme EduAI",
    version="1.0.0",
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# ROUTES
# =====================================================

app.include_router(
    health_router,
    prefix="/api",
)

app.include_router(
    llm_router,
    prefix="/api/ai",
)

app.include_router(
    exam_grading_router,
    prefix="/api/ai/exams",
    tags=["Exam grading"],
)


# =====================================================
# ROOT
# =====================================================

@app.get("/")
async def root():

    return {
        "success": True,
        "service": "EduAI AI Service",
        "message": "AI Service fonctionne correctement",
    }

app.include_router(
    documents.router,
    prefix="/api/ai",
    tags=["Documents"],
)
logger = logging.getLogger(__name__)


@app.middleware("http")
async def request_metrics(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "AI request endpoint=%s method=%s status=%s latency_ms=%.2f request_id=%s",
        request.url.path,
        request.method,
        response.status_code,
        elapsed_ms,
        request_id,
    )
    return response