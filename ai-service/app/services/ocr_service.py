import logging


logger = logging.getLogger(__name__)


def extract_text_with_ocr(file_content: bytes) -> str:
    """
    Extrait le texte d'une image PDF/document avec OCR.
    
    ⚠️ IMPORTANT: OCR N'EST PAS ENCORE IMPLÉMENTÉ.
    
    Pour l'activer, installer:
    - pytesseract
    - Tesseract-OCR
    
    Et utiliser pytesseract pour extraire le texte.
    """
    
    logger.warning("OCR requested but NOT IMPLEMENTED")
    
    raise NotImplementedError(
        "OCR n'est pas encore implémenté. "
        "Pour les documents scannés ou images, "
        "veuillez utiliser une solution OCR tierce."
    )
