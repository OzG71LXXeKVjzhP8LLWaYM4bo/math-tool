"""OCR route for image-to-LaTeX conversion."""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ocr_service import OCRService

router = APIRouter()


class OCRRequest(BaseModel):
    """Request model for OCR endpoint."""
    image_base64: str


class OCRResponse(BaseModel):
    """Response model for OCR endpoint."""
    success: bool
    latex: Optional[str] = None
    confidence: float = 0.0
    error: Optional[str] = None


@router.post("", response_model=OCRResponse)
async def convert_image_to_latex(request: OCRRequest) -> OCRResponse:
    """
    Convert an image to LaTeX using Pix2Tex OCR.

    Args:
        request: OCRRequest with base64 encoded image

    Returns:
        OCRResponse with LaTeX string or error
    """
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="No image provided")

    latex, confidence, error = OCRService.recognize(request.image_base64)

    if error:
        return OCRResponse(
            success=False,
            latex=None,
            confidence=0.0,
            error=error
        )

    return OCRResponse(
        success=True,
        latex=latex,
        confidence=confidence,
        error=None
    )
