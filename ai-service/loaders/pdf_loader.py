from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extrait le texte d'un fichier PDF.

    Args:
        file_content: contenu binaire du PDF

    Returns:
        Texte extrait du PDF
    """

    pdf_file = BytesIO(file_content)

    reader = PdfReader(pdf_file)

    pages_text = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages_text.append(text)

    return "\n\n".join(pages_text)