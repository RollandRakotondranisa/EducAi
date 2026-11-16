import logging
from threading import RLock
from pathlib import Path
from typing import Optional, List

from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ..core.config import (
    GOOGLE_API_KEY,
    GEMINI_EMBEDDING_MODEL,
    MAX_CHUNKS,
    MAX_CONTEXT_CHARACTERS,
    RAG_ALLOW_DANGEROUS_DESERIALIZATION,
    RAG_TOP_K,
)


logger = logging.getLogger(__name__)


class RAGService:
    """
    Service RAG avec FAISS pour l'indexation et la recherche.
    
    IMPORTANT: FAISS fonctionne en mémoire. À la production, 
    considérer une solution persistante comme Qdrant.
    """

    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=GEMINI_EMBEDDING_MODEL,
            google_api_key=GOOGLE_API_KEY,
        )
        
        # Stockage par course_id pour isoler les données
        self.vector_stores = {}
        self._lock = RLock()
        self.index_dir = Path(__file__).resolve().parents[2] / "data" / "rag"
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self._load_indexes()
        
        logger.info("RAG Service initialized with Gemini embeddings")

    def split_text(
        self,
        text: str,
        document_id: int,
        course_id: int,
        teacher_id: int,
    ) -> List[Document]:
        """
        Découpe le texte en chunks avec métadonnées.
        """
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
        )

        document = Document(
            page_content=text,
            metadata={
                "document_id": document_id,
                "course_id": course_id,
                "teacher_id": teacher_id,
            },
        )

        return splitter.split_documents([document])

    def create_index(
        self,
        text: str,
        document_id: int,
        course_id: int,
        teacher_id: int,
    ) -> dict:
        """
        Crée ou met à jour l'index FAISS pour un cours.
        """
        
        if not text or not text.strip():
            raise ValueError("Le texte du document est vide")

        documents = self.split_text(
            text=text,
            document_id=document_id,
            course_id=course_id,
            teacher_id=teacher_id,
        )

        if not documents:
            raise ValueError("Aucun contenu à indexer après découpage")
        if len(documents) > MAX_CHUNKS:
            raise ValueError("Le document contient trop de segments à indexer")

        with self._lock:
            if course_id not in self.vector_stores:
                self.vector_stores[course_id] = FAISS.from_documents(
                    documents,
                    self.embeddings,
                )
                logger.info("Created FAISS index for course %s", course_id)
            else:
                self.vector_stores[course_id].add_documents(documents)
                logger.info("Added documents to FAISS index for course %s", course_id)

            self.vector_stores[course_id].save_local(str(self.index_dir / str(course_id)))

        return {
            "document_id": document_id,
            "course_id": course_id,
            "chunks": len(documents),
            "status": "indexed"
        }

    def search(
        self,
        query: str,
        course_id: int,
        document_id: Optional[int],
        teacher_id: int,
        k: int = 5,
    ) -> List[Document]:
        """
        Recherche des documents similaires pour un cours spécifique.
        Utilise le course_id pour isoler les résultats.
        """
        
        if course_id not in self.vector_stores:
            raise ValueError(
                f"Aucun index RAG pour le cours {course_id}"
            )

        with self._lock:
            vector_store = self.vector_stores[course_id]
            results = vector_store.similarity_search(query, k=max(k, RAG_TOP_K))

        results = [
            document for document in results
            if (document_id is None or document.metadata.get("document_id") == document_id)
            and document.metadata.get("course_id") == course_id
            and document.metadata.get("teacher_id") == teacher_id
        ][:k]

        logger.info(
            "RAG search document_id=%s course_id=%s teacher_id=%s results=%s",
            document_id,
            course_id,
            teacher_id,
            len(results),
        )

        return results

    def get_context(
        self,
        query: str,
        course_id: int,
        document_id: Optional[int],
        teacher_id: int,
        k: int = 5,
    ) -> str:
        """
        Récupère le contexte pertinent pour une requête.
        Retourne le contenu textuel des documents trouvés.
        """
        
        results = self.search(query, course_id, document_id, teacher_id, k)

        if not results:
            return ""

        # Combiner le contenu de tous les résultats
        context = "\n\n".join(doc.page_content for doc in results)
        return context[:MAX_CONTEXT_CHARACTERS]

    def get_full_context(
        self,
        course_id: int,
        teacher_id: int,
        document_id: Optional[int] = None,
    ) -> str:
        """Build a document-wide context for global analysis requests."""
        if course_id not in self.vector_stores:
            raise ValueError(f"Aucun index RAG pour le cours {course_id}")

        with self._lock:
            vector_store = self.vector_stores[course_id]
            chunks = []
            for index in sorted(vector_store.index_to_docstore_id):
                chunk = vector_store.docstore.search(
                    vector_store.index_to_docstore_id[index]
                )
                if not isinstance(chunk, Document):
                    continue
                metadata = chunk.metadata
                if (
                    metadata.get("course_id") == course_id
                    and metadata.get("teacher_id") == teacher_id
                    and (
                        document_id is None
                        or metadata.get("document_id") == document_id
                    )
                ):
                    chunks.append(chunk.page_content)

        if not chunks:
            return ""

        max_chunks = max(1, MAX_CONTEXT_CHARACTERS // 1000)
        if len(chunks) > max_chunks:
            indexes = [
                round(position * (len(chunks) - 1) / (max_chunks - 1))
                for position in range(max_chunks)
            ] if max_chunks > 1 else [0]
            chunks = [chunks[index] for index in indexes]

        return "\n\n".join(chunks)[:MAX_CONTEXT_CHARACTERS]

    def _load_indexes(self):
        for index_path in self.index_dir.iterdir():
            if not index_path.is_dir() or not (index_path / "index.faiss").exists():
                continue
            try:
                self.vector_stores[int(index_path.name)] = FAISS.load_local(
                    str(index_path),
                    self.embeddings,
                    allow_dangerous_deserialization=RAG_ALLOW_DANGEROUS_DESERIALIZATION,
                )
            except Exception:
                logger.warning(
                    "Index RAG non charge pour %s; reindexation requise ou opt-in explicite nécessaire",
                    index_path,
                )


# Instance globale singleton
rag_service = RAGService()
