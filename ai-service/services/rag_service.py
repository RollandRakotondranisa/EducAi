from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ..core.config import GOOGLE_API_KEY


class RAGService:

    def __init__(self):

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GOOGLE_API_KEY,
        )

        self.vector_store = None

    def split_text(
        self,
        text: str,
        document_id: int,
        course_id: int,
    ):

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
        )

        document = Document(
            page_content=text,
            metadata={
                "document_id": document_id,
                "course_id": course_id,
            },
        )

        return splitter.split_documents(
            [document]
        )

    def create_index(
        self,
        text: str,
        document_id: int,
        course_id: int,
    ):

        documents = self.split_text(
            text=text,
            document_id=document_id,
            course_id=course_id,
        )

        if not documents:
            raise ValueError(
                "Aucun contenu à indexer."
            )

        self.vector_store = FAISS.from_documents(
            documents,
            self.embeddings,
        )

        return {
            "document_id": document_id,
            "course_id": course_id,
            "chunks": len(documents),
        }

    def search(
        self,
        query: str,
        course_id: int,
        k: int = 5,
    ):

        if self.vector_store is None:
            raise ValueError(
                "Aucun document n'a été indexé."
            )

        results = self.vector_store.similarity_search(
            query,
            k=k,
        )

        filtered_results = [
            document
            for document in results
            if document.metadata.get("course_id")
            == course_id
        ]

        return filtered_results

    def get_context(
        self,
        query: str,
        course_id: int,
        k: int = 5,
    ):

        results = self.search(
            query=query,
            course_id=course_id,
            k=k,
        )

        return "\n\n".join(
            document.page_content
            for document in results
        )


rag_service = RAGService()