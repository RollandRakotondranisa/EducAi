from io import BytesIO

from pptx import Presentation


def extract_text_from_powerpoint(file_content: bytes) -> str:
    """
    Extrait le texte d'un fichier PowerPoint (.pptx).

    Args:
        file_content: contenu binaire du fichier PowerPoint

    Returns:
        Texte extrait de la présentation
    """

    powerpoint_file = BytesIO(file_content)

    presentation = Presentation(powerpoint_file)

    slides_text = []

    for slide_number, slide in enumerate(presentation.slides, start=1):

        slide_parts = []

        for shape in slide.shapes:

            if hasattr(shape, "text"):

                text = shape.text.strip()

                if text:
                    slide_parts.append(text)

        if slide_parts:
            slides_text.append(
                f"Slide {slide_number}\n"
                + "\n".join(slide_parts)
            )

    return "\n\n".join(slides_text)