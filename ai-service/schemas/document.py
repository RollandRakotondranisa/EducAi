from pydantic import BaseModel


class DocumentAnalysisResponse(BaseModel):
    filename: str
    file_type: str
    characters: int
    words: int
    text: str