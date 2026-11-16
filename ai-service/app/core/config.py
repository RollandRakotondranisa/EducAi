import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.3"))
GEMINI_QUESTION_TEMPERATURE = float(os.getenv("GEMINI_QUESTION_TEMPERATURE", "0.3"))
GEMINI_CORRECTION_TEMPERATURE = float(os.getenv("GEMINI_CORRECTION_TEMPERATURE", "0.1"))
GEMINI_TIMEOUT = float(os.getenv("GEMINI_TIMEOUT", "60"))
GEMINI_MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "1"))

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
MAX_DOCUMENT_CHARACTERS = int(os.getenv("MAX_DOCUMENT_CHARACTERS", "500000"))
MAX_CONTEXT_CHARACTERS = int(os.getenv("MAX_CONTEXT_CHARACTERS", "20000"))
MAX_CHUNKS = int(os.getenv("MAX_CHUNKS", "1000"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
RAG_ALLOW_DANGEROUS_DESERIALIZATION = os.getenv(
    "RAG_ALLOW_DANGEROUS_DESERIALIZATION", "false"
).lower() == "true"

AI_SERVICE_HOST = os.getenv(
    "AI_SERVICE_HOST",
    "0.0.0.0"
)

AI_SERVICE_PORT = int(
    os.getenv(
        "AI_SERVICE_PORT",
        "8001"
    )
)

BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:5000"
)

AI_REQUEST_TIMEOUT = float(os.getenv("AI_REQUEST_TIMEOUT", str(GEMINI_TIMEOUT + 10)))

