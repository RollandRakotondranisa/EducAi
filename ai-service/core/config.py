import os

from dotenv import load_dotenv


load_dotenv()


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

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


