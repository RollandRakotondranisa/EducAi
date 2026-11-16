from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import GOOGLE_API_KEY


model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    api_key=GOOGLE_API_KEY,
    temperature=0.7,
)


def ask_llm(message: str) -> str:
    response = model.invoke(message)

    return response.text