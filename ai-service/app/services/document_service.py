from pathlib import Path

from loaders.pdf_loader import extract_text_from_pdf
from loaders.word_loader import extract_text_from_word
from loaders.powerpoint_loader import extract_text_from_powerpoint


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx",
}


def extract_document_text(
    file_content: bytes,
    filename: str,
) -> str:
    """
    Détermine le type du document et extrait son texte.
    """

    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_content)

    if extension == ".docx":
        return extract_text_from_word(file_content)

    if extension == ".pptx":
        return extract_text_from_powerpoint(file_content)

    raise ValueError(
        f"Format de fichier non supporté : {extension}"
    )


def analyze_document(
    file_content: bytes,
    filename: str,
):
    """
    Analyse de base d'un document.

    Étapes :

    1. Vérification du format
    2. Extraction du texte
    3. Nettoyage basique
    4. Calcul des statistiques
    """

    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            "Format non supporté. "
            "Formats acceptés : PDF, DOCX et PPTX."
        )

    text = extract_document_text(
        file_content,
        filename,
    )

    text = text.strip()

    if not text:
        raise ValueError(
            "Impossible d'extraire du texte depuis ce document."
        )

    words = text.split()

    return {
        "filename": filename,
        "file_type": extension.replace(".", "").upper(),
        "characters": len(text),
        "words": len(words),
        "text": text,
    }
