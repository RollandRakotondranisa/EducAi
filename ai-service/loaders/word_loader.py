from io import BytesIO

from docx import Document


def extract_text_from_word(file_content: bytes) -> str:
    """
    Extrait le texte d'un fichier Word (.docx).

    Args:
        file_content: contenu binaire du fichier Word

    Returns:
        Texte extrait du document
    """

    word_file = BytesIO(file_content)

    document = Document(word_file)

    paragraphs = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n\n".join(paragraphs)