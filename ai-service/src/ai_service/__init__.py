import uvicorn
from src.ai_service.app.main import app
from src.ai_service.app.core.config import AI_SERVICE_HOST, AI_SERVICE_PORT


def main() -> None:
    """Point d'entrée pour le service AI"""
    uvicorn.run(
        app,
        host=AI_SERVICE_HOST,
        port=AI_SERVICE_PORT,
    )


if __name__ == "__main__":
    main()
