"""OCR Service using Pix2Tex for image-to-LaTeX conversion."""

import base64
import io
from typing import Optional

from PIL import Image


class OCRService:
    """Service for converting images to LaTeX using Pix2Tex."""

    _model = None

    @classmethod
    def get_model(cls):
        """Lazy load the Pix2Tex model."""
        if cls._model is None:
            from pix2tex.cli import LatexOCR
            cls._model = LatexOCR()
        return cls._model

    @classmethod
    def image_from_base64(cls, image_base64: str) -> Image.Image:
        """Convert base64 string to PIL Image."""
        # Handle data URL format (data:image/png;base64,...)
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if necessary (Pix2Tex expects RGB)
        if image.mode != "RGB":
            image = image.convert("RGB")

        return image

    @classmethod
    def recognize(cls, image_base64: str) -> tuple[Optional[str], float, Optional[str]]:
        """
        Recognize LaTeX from an image.

        Args:
            image_base64: Base64 encoded image string

        Returns:
            Tuple of (latex_string, confidence, error_message)
        """
        try:
            image = cls.image_from_base64(image_base64)
            model = cls.get_model()

            # Run OCR
            latex = model(image)

            # Pix2Tex doesn't provide confidence scores, so we estimate
            confidence = 0.9 if latex and len(latex) > 0 else 0.0

            return latex, confidence, None

        except Exception as e:
            return None, 0.0, str(e)
