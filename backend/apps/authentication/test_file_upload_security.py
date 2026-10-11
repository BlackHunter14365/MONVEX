"""
Tests for File Upload Security and Magic Byte Inspection.
Verifies that polyglot files, fake extensions, and non-image payloads are rejected.
"""
import io
from PIL import Image
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from services.file_validation_service import FileValidationService
from django.core.exceptions import ValidationError


class FileUploadSecurityTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='security_test_user',
            email='security_test@example.com',
            password='Password123!'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_file_validation_service_accepts_valid_png(self):
        buf = io.BytesIO()
        img = Image.new('RGB', (100, 100), color='blue')
        img.save(buf, format='PNG')
        buf.seek(0)
        file_obj = SimpleUploadedFile("avatar.png", buf.getvalue(), content_type="image/png")
        bytes_out, mime, ext = FileValidationService.validate_avatar_file(file_obj)
        self.assertEqual(mime, "image/png")
        self.assertEqual(ext, ".png")

    def test_file_validation_service_rejects_fake_png_with_text_content(self):
        fake_content = b"<?php echo 'malicious shell'; ?>\n"
        file_obj = SimpleUploadedFile("shell.png", fake_content, content_type="image/png")
        with self.assertRaises(ValidationError):
            FileValidationService.validate_avatar_file(file_obj)

    def test_avatar_upload_endpoint_rejects_fake_extension(self):
        fake_content = b"\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x10\x11\x12"
        fake_file = SimpleUploadedFile("evil.jpg", fake_content, content_type="image/jpeg")

        response = self.client.post(
            '/api/v1/auth/profile/avatar/',
            {'avatar': fake_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get('success', True))

    def test_avatar_upload_endpoint_accepts_authentic_image(self):
        buf = io.BytesIO()
        img = Image.new('RGB', (120, 120), color='green')
        img.save(buf, format='JPEG')
        buf.seek(0)
        valid_file = SimpleUploadedFile("photo.jpg", buf.getvalue(), content_type="image/jpeg")

        response = self.client.post(
            '/api/v1/auth/profile/avatar/',
            {'avatar': valid_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
