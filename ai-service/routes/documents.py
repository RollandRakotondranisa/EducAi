from fastapi import APIRouter, File, HTTPException, UploadFile

from ...services.document_service import analyze_document
from ...schemas.document import DocumentAnalysisResponse


router = APIRouter()


@router.post(
    "/documents/analyze",
    response_model=DocumentAnalysisResponse,
)
async def analyze_uploaded_document(
    file: UploadFile = File(...)
):
    """
    Reçoit un document PDF, DOCX ou PPTX
    et extrait son contenu textuel.
    """

    allowed_extensions = {
        ".pdf",
        ".docx",
        ".pptx",
    }

    filename = file.filename or ""

    extension = ""

    if "." in filename:
        extension = "." + filename.split(".")[-1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Format non supporté. "
                "Utilisez un fichier PDF, DOCX ou PPTX."
            ),
        )

    try:

        file_content = await file.read()

        if not file_content:
            raise HTTPException(
                status_code=400,
                detail="Le fichier est vide.",
            )

        result = analyze_document(
            file_content=file_content,
            filename=filename,
        )

        return result

    except HTTPException:
        raise

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Erreur lors de l'analyse du document : "
                f"{str(error)}"
            ),
        )