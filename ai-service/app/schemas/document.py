from typing import Optional

from pydantic import BaseModel, Field

from ..core.config import MAX_DOCUMENT_CHARACTERS


class DocumentAnalysisResponse(BaseModel):
    """
    Résultat de l'analyse d'un document.
    """
    filename: str = Field(..., description="Nom du fichier")
    file_type: str = Field(..., description="Type de fichier (PDF, DOCX, PPTX)")
    characters: int = Field(..., ge=0, description="Nombre de caractères")
    words: int = Field(..., ge=0, description="Nombre de mots")
    text: str = Field(..., description="Texte extrait du document")


class DocumentIndexRequest(BaseModel):
    """
    Requête pour indexer un document dans le RAG.
    """
    document_id: int = Field(..., ge=1, description="ID du document")
    course_id: int = Field(..., ge=1, description="ID du cours")
    teacher_id: int = Field(..., ge=1, description="ID du professeur propriétaire")
    text: str = Field(
        ...,
        min_length=1,
        max_length=MAX_DOCUMENT_CHARACTERS,
        description="Texte à indexer",
    )


class DocumentIndexResponse(BaseModel):
    """
    Réponse de l'indexation.
    """
    document_id: int
    course_id: int
    chunks: int
    status: str = "indexed"


class RAGSearchRequest(BaseModel):
    """
    Requête de recherche RAG.
    """
    query: str = Field(..., min_length=1, description="Requête de recherche")
    course_id: int = Field(..., ge=1, description="ID du cours")
    document_id: int = Field(..., ge=1, description="ID du document")
    teacher_id: int = Field(..., ge=1, description="ID du professeur propriétaire")
    k: int = Field(default=5, ge=1, le=20, description="Nombre de résultats")


class DocumentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    document_id: Optional[int] = Field(default=None, ge=1)
    course_id: int = Field(..., ge=1)
    teacher_id: int = Field(..., ge=1)


class CourseChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    course_id: int = Field(..., ge=1)
    teacher_id: int = Field(..., ge=1)


class RAGSearchResult(BaseModel):
    """
    Résultat d'une recherche RAG.
    """
    content: str = Field(..., description="Contenu du document trouvé")
    document_id: int = Field(..., description="ID du document source")
    course_id: int = Field(..., description="ID du cours")


class RAGSearchResponse(BaseModel):
    """
    Réponse de recherche RAG.
    """
    results: list[RAGSearchResult]
    query: str
    course_id: int
