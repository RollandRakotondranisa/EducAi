from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.ai_service.app.routes.health import router as health_router
from src.ai_service.app.routes.llm import router as llm_router


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
