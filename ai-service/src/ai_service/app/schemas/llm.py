from pydantic import BaseModel


class LLMRequest(BaseModel):
    message: str
