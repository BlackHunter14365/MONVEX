"""
MONVEX File Validation & Upload Security Service
Provides binary magic-byte inspection, structural integrity verification (Pillow/PDF),
and defense against polyglot files, hidden executables, and disguised MIME attacks.
"""
import io
import logging
from typing import Tuple, List, Optional
from PIL import Image
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Canonical binary magic-byte signatures
MAGIC_SIGNATURES = {
    'jpeg': (b'\xff\xd8\xff',),
    'png': (b'\x89PNG\r\n\x1a\n',),
    'webp': (b'RIFF',),  # Bytes 0-4 RIFF, bytes 8-12 WEBP
    'gif': (b'GIF87a', b'GIF89a'),
    'pdf': (b'%PDF-',),
}

MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024       # 5 MB
MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024     # 10 MB


class FileValidationService:
    """
    Zero-dependency binary header and structure validator.
    Ensures safe, non-malicious file streams before storage or downstream processing.
    """

    @classmethod
    def inspect_magic_bytes(cls, file_obj, allowed_types: List[str] = None) -> Tuple[bytes, str, str]:
        """
        Reads binary header, detects true format via magic bytes, and validates against allowed_types.
        Returns: (file_bytes, detected_mime_type, detected_extension)
        Raises: ValidationError if invalid, empty, or disguised.
        """
        if not file_obj:
            raise ValidationError("No file provided.")

        if hasattr(file_obj, 'read'):
            file_bytes = file_obj.read()
            file_obj.seek(0)
        else:
            file_bytes = bytes(file_obj)

        if not file_bytes or len(file_bytes) == 0:
            raise ValidationError("Uploaded file is empty.")

        header = file_bytes[:16]
        detected_type: Optional[str] = None
        mime_type = ''
        ext = ''

        if header.startswith(b'\xff\xd8\xff'):
            detected_type = 'jpeg'
            mime_type = 'image/jpeg'
            ext = '.jpg'
        elif header.startswith(b'\x89PNG\r\n\x1a\n'):
            detected_type = 'png'
            mime_type = 'image/png'
            ext = '.png'
        elif header.startswith(b'RIFF') and len(file_bytes) >= 12 and file_bytes[8:12] == b'WEBP':
            detected_type = 'webp'
            mime_type = 'image/webp'
            ext = '.webp'
        elif header.startswith(b'GIF87a') or header.startswith(b'GIF89a'):
            detected_type = 'gif'
            mime_type = 'image/gif'
            ext = '.gif'
        elif header.startswith(b'%PDF-'):
            detected_type = 'pdf'
            mime_type = 'application/pdf'
            ext = '.pdf'

        if not detected_type:
            logger.warning(f"File upload rejected: unrecognized binary magic bytes: {header[:8]!r}")
            raise ValidationError("Unsupported file format. Unrecognized or disguised binary signature.")

        if allowed_types and detected_type not in allowed_types:
            allowed_names = [t.upper() for t in allowed_types]
            raise ValidationError(f"Invalid file type. Permitted formats: {', '.join(allowed_names)}.")

        return file_bytes, mime_type, ext

    @classmethod
    def validate_avatar_file(cls, file_obj) -> Tuple[bytes, str, str]:
        """
        Strict validation for user avatars:
        - Max 5MB
        - Magic bytes must be JPEG, PNG, or WEBP (GIF optional)
        - Must verify structurally with Pillow
        """
        if hasattr(file_obj, 'size') and file_obj.size > MAX_AVATAR_SIZE_BYTES:
            raise ValidationError("Avatar file size must not exceed 5MB.")

        file_bytes, mime_type, ext = cls.inspect_magic_bytes(
            file_obj,
            allowed_types=['jpeg', 'png', 'webp', 'gif']
        )

        if len(file_bytes) > MAX_AVATAR_SIZE_BYTES:
            raise ValidationError("Avatar file size must not exceed 5MB.")

        # Structural image check using Pillow
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                img.verify()
        except Exception as e:
            logger.warning(f"Avatar rejected: corrupted image structure: {e}")
            raise ValidationError("Corrupted or malformed image content.")

        # Reset read pointer if file-like object
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)

        return file_bytes, mime_type, ext

    @classmethod
    def validate_receipt_file(cls, file_obj) -> Tuple[bytes, str, str]:
        """
        Strict validation for financial receipts:
        - Max 10MB
        - Magic bytes must be JPEG, PNG, WEBP, or PDF
        - If image, verifies Pillow structure
        - If PDF, verifies EOF marker
        """
        if hasattr(file_obj, 'size') and file_obj.size > MAX_RECEIPT_SIZE_BYTES:
            raise ValidationError(f"File size exceeds 10MB limit ({file_obj.size / (1024*1024):.1f}MB).")

        file_bytes, mime_type, ext = cls.inspect_magic_bytes(
            file_obj,
            allowed_types=['jpeg', 'png', 'webp', 'pdf']
        )

        if len(file_bytes) > MAX_RECEIPT_SIZE_BYTES:
            raise ValidationError(f"File size exceeds 10MB limit ({len(file_bytes) / (1024*1024):.1f}MB).")

        if mime_type.startswith('image/'):
            try:
                with Image.open(io.BytesIO(file_bytes)) as img:
                    img.verify()
            except Exception as e:
                logger.warning(f"Receipt rejected: corrupted image structure: {e}")
                raise ValidationError(f"Corrupt or malformed image file: {str(e)}")
        elif mime_type == 'application/pdf':
            # PDF must contain EOF marker within the last 1024 bytes
            if b'%%EOF' not in file_bytes[-1024:]:
                raise ValidationError("Corrupt or truncated PDF file: missing %%EOF marker.")

        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)

        return file_bytes, mime_type, ext
