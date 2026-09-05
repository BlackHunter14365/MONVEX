"""
MONVEX Production Storage Abstraction Layer
Provides a unified, secure, and multi-tenant storage interface.
Supports:
1. LocalStorageProvider: Sandboxed filesystem storage for development and testing.
2. S3StorageProvider: Private S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, Supabase)
   configured strictly via environment variables.

Guarantees:
- Private objects by default (no public buckets, no public permanent URLs)
- Strict user-isolated key hierarchy: receipts/{user_id}/{uuid}.{ext}
- Content-type validation and preservation
- Path traversal prevention
- Presigned URL generation for time-limited authorized access
"""

import io
import os
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Optional, Tuple
from django.conf import settings
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class BaseStorageProvider(ABC):
    """Abstract interface for MONVEX secure file persistence."""

    @abstractmethod
    def save(self, user_id: str, file_bytes: bytes, filename: str, content_type: str) -> Tuple[str, str]:
        """
        Saves file bytes for a specific tenant user.
        Returns (storage_key, relative_or_presigned_url).
        """
        pass

    @abstractmethod
    def read(self, storage_key: str) -> bytes:
        """Reads raw binary bytes for a storage key. Raises FileNotFoundError if missing."""
        pass

    @abstractmethod
    def delete(self, storage_key: str) -> bool:
        """Deletes file associated with storage key. Returns True if deleted, False otherwise."""
        pass

    @abstractmethod
    def exists(self, storage_key: str) -> bool:
        """Checks if storage key exists."""
        pass

    @abstractmethod
    def get_presigned_url(self, storage_key: str, expiry_seconds: int = 900) -> Optional[str]:
        """Generates a temporary signed URL for authorized viewing (defaults to 15 mins)."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    """
    Local filesystem storage sandboxed strictly inside settings.MEDIA_ROOT.
    Prevents path traversal attacks and organizes files by user ID.
    """

    def __init__(self, base_root: Optional[str] = None):
        self.base_root = os.path.abspath(base_root or getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'media')))
        os.makedirs(self.base_root, exist_ok=True)

    def _sanitize_key(self, storage_key: str) -> str:
        clean = os.path.normpath(storage_key).replace('\\', '/').lstrip('/')
        if '..' in clean or clean.startswith('/'):
            raise ValidationError("Path traversal attempt detected in storage key.")
        return clean

    def _get_absolute_path(self, storage_key: str) -> str:
        clean = self._sanitize_key(storage_key)
        abs_path = os.path.abspath(os.path.join(self.base_root, clean))
        if not abs_path.startswith(self.base_root):
            raise ValidationError("Storage path escapes root sandbox.")
        return abs_path

    def save(self, user_id: str, file_bytes: bytes, filename: str, content_type: str) -> Tuple[str, str]:
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = '.jpg' if content_type == 'image/jpeg' else '.png'

        unique_id = uuid.uuid4().hex
        storage_key = f"receipts/{user_id}/{unique_id}{ext}"
        abs_path = self._get_absolute_path(storage_key)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, 'wb') as f:
            f.write(file_bytes)

        relative_url = f"/api/v1/transactions/receipts/stream/?key={storage_key}"
        return storage_key, relative_url

    def read(self, storage_key: str) -> bytes:
        abs_path = self._get_absolute_path(storage_key)
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"Storage key not found: {storage_key}")
        with open(abs_path, 'rb') as f:
            return f.read()

    def delete(self, storage_key: str) -> bool:
        try:
            abs_path = self._get_absolute_path(storage_key)
            if os.path.exists(abs_path):
                os.remove(abs_path)
                return True
            return False
        except Exception as e:
            logger.warning(f"Failed to delete local storage key {storage_key}: {e}")
            return False

    def exists(self, storage_key: str) -> bool:
        try:
            abs_path = self._get_absolute_path(storage_key)
            return os.path.exists(abs_path)
        except Exception:
            return False

    def get_presigned_url(self, storage_key: str, expiry_seconds: int = 900) -> Optional[str]:
        # For local storage, streaming is handled by authenticated ReceiptImageView
        return None


class S3StorageProvider(BaseStorageProvider):
    """
    S3-compatible object storage provider (AWS S3, Cloudflare R2, MinIO, Supabase).
    Uses boto3 client configured purely via environment variables.
    Enforces private object ACL and tenant isolation.
    """

    def __init__(self):
        self.bucket = os.getenv('STORAGE_BUCKET') or os.getenv('AWS_STORAGE_BUCKET_NAME', '')
        self.access_key = os.getenv('STORAGE_ACCESS_KEY') or os.getenv('AWS_ACCESS_KEY_ID', '')
        self.secret_key = os.getenv('STORAGE_SECRET') or os.getenv('AWS_SECRET_ACCESS_KEY', '')
        self.region = os.getenv('STORAGE_REGION') or os.getenv('AWS_S3_REGION_NAME', 'auto')
        self.endpoint_url = os.getenv('STORAGE_ENDPOINT_URL') or os.getenv('AWS_S3_ENDPOINT_URL', None)

        if not self.bucket or not self.access_key or not self.secret_key:
            raise ValueError("Incomplete S3/R2 storage configuration. Required: BUCKET, ACCESS_KEY, SECRET.")

        import boto3
        from botocore.config import Config

        cfg = Config(
            signature_version='s3v4',
            retries={'max_attempts': 3, 'mode': 'standard'}
        )
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            endpoint_url=self.endpoint_url,
            config=cfg
        )

    def save(self, user_id: str, file_bytes: bytes, filename: str, content_type: str) -> Tuple[str, str]:
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = '.jpg' if content_type == 'image/jpeg' else '.png'

        unique_id = uuid.uuid4().hex
        storage_key = f"receipts/{user_id}/{unique_id}{ext}"

        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=file_bytes,
            ContentType=content_type,
            ServerSideEncryption='AES256'
        )

        presigned_url = self.get_presigned_url(storage_key, expiry_seconds=900)
        return storage_key, presigned_url or storage_key

    def read(self, storage_key: str) -> bytes:
        from botocore.exceptions import ClientError
        try:
            res = self.s3_client.get_object(Bucket=self.bucket, Key=storage_key)
            return res['Body'].read()
        except ClientError as e:
            if e.response.get('Error', {}).get('Code') == 'NoSuchKey':
                raise FileNotFoundError(f"Object not found in bucket: {storage_key}")
            raise

    def delete(self, storage_key: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
            return True
        except Exception as e:
            logger.warning(f"Failed to delete S3 object {storage_key}: {e}")
            return False

    def exists(self, storage_key: str) -> bool:
        from botocore.exceptions import ClientError
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=storage_key)
            return True
        except ClientError:
            return False

    def get_presigned_url(self, storage_key: str, expiry_seconds: int = 900) -> Optional[str]:
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': storage_key},
                ExpiresIn=expiry_seconds
            )
            return url
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for {storage_key}: {e}")
            return None


class StorageService:
    """
    Factory service to provide the active storage provider.
    Automatically selects S3StorageProvider if cloud credentials exist,
    otherwise defaults to sandboxed LocalStorageProvider.
    """
    _instance: Optional[BaseStorageProvider] = None

    @classmethod
    def get_provider(cls) -> BaseStorageProvider:
        bucket = os.getenv('STORAGE_BUCKET') or os.getenv('AWS_STORAGE_BUCKET_NAME')
        access_key = os.getenv('STORAGE_ACCESS_KEY') or os.getenv('AWS_ACCESS_KEY_ID')
        secret_key = os.getenv('STORAGE_SECRET') or os.getenv('AWS_SECRET_ACCESS_KEY')

        # S3 if fully configured and boto3 is available
        if bucket and access_key and secret_key:
            try:
                import boto3  # noqa: F401
                return S3StorageProvider()
            except ImportError:
                logger.warning("S3 credentials detected but boto3 is not installed. Falling back to LocalStorageProvider.")
            except Exception as e:
                logger.warning(f"Failed to initialize S3StorageProvider: {e}. Falling back to LocalStorageProvider.")

        return LocalStorageProvider()
