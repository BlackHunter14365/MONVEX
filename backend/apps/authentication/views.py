"""
Authentication & Verification Views
Handles user registration, login, logout, provider-backed OTP check, resend, and JWT lifecycle.
"""
import base64
import io
import uuid
import logging
from PIL import Image
from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.core.files.base import ContentFile

logger = logging.getLogger('monvex.auth')


from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    GoogleAuthSerializer,
    GoogleLinkAccountSerializer
)
from .models import Profile

def get_client_context(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    return {'ip': ip, 'user_agent': user_agent}

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    "success": True,
                    "message": "Account created successfully.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)

        except IntegrityError as ie:
            logger.warning(f"Registration integrity conflict for {request.data.get('username')}: {ie}")
            return Response({
                "success": False,
                "code": "USER_ALREADY_EXISTS",
                "message": "An account with this username or email already exists. Please sign in or use different credentials."
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.error(f"Unexpected registration exception: {str(exc)}", exc_info=True)
            return Response({
                "success": False,
                "code": "REGISTRATION_FAILED",
                "message": "Unable to complete registration right now. Please try again or contact support."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomLoginView(APIView):
    """
    Standard Login View:
    Validates credentials, checks password hash, verifies account active status,
    and issues SimpleJWT access and refresh tokens directly.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = (request.data.get('identifier') or request.data.get('username') or request.data.get('email') or '').strip()
        password = request.data.get('password', '')

        if not identifier or not password:
            return Response({
                "success": False,
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid username/email or password."
            }, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
        if not user or not user.check_password(password):
            return Response({
                "success": False,
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid username/email or password."
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                "success": False,
                "code": "ACCOUNT_DISABLED",
                "message": "This account is disabled. Please contact support."
            }, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            "success": True,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh') or request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response({
            "success": True,
            "message": "Successfully logged out."
        }, status=status.HTTP_200_OK)

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class GoogleLoginView(APIView):
    """
    POST /api/v1/auth/google/
    Verifies Google ID Token and resolves/creates canonical MONVEX User session.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        credential = serializer.validated_data['credential']
        ctx = get_client_context(request)

        try:
            from services.google_auth_service import GoogleAuthService, GoogleAuthError
            claims = GoogleAuthService.verify_google_token(credential)
            res = GoogleAuthService.resolve_or_create_user(claims, request_context=ctx)

            if not res.get('success', False) and res.get('code') == 'ACCOUNT_LINKING_REQUIRED':
                return Response(res, status=status.HTTP_200_OK)

            if res.get('success', False):
                return Response({
                    "success": True,
                    "action": res.get("action", "LOGIN"),
                    "is_new_user": res.get("is_new_user", False),
                    "access": res["access"],
                    "refresh": res["refresh"],
                    "user": UserSerializer(res["user"]).data
                }, status=status.HTTP_201_CREATED if res.get("is_new_user") else status.HTTP_200_OK)

            return Response(res, status=status.HTTP_400_BAD_REQUEST)

        except GoogleAuthError as ge:
            return Response({
                "success": False,
                "code": ge.code,
                "message": ge.message
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "code": "GOOGLE_AUTH_FAILED",
                "message": "Google authentication could not be completed."
            }, status=status.HTTP_400_BAD_REQUEST)

class GoogleLinkAccountView(APIView):
    """
    POST /api/v1/auth/google/link/
    Verifies ownership of an existing password account and binds GoogleIdentity.
    """
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleLinkAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        credential = serializer.validated_data['credential']
        password = serializer.validated_data['password']
        ctx = get_client_context(request)

        try:
            from services.google_auth_service import GoogleAuthService, GoogleAuthError
            claims = GoogleAuthService.verify_google_token(credential)
            res = GoogleAuthService.link_google_account(claims, password, request_context=ctx)

            if res.get('success', False):
                return Response({
                    "success": True,
                    "action": res.get("action", "LINKED_AND_LOGGED_IN"),
                    "access": res["access"],
                    "refresh": res["refresh"],
                    "user": UserSerializer(res["user"]).data
                }, status=status.HTTP_200_OK)

            return Response(res, status=status.HTTP_400_BAD_REQUEST)

        except GoogleAuthError as ge:
            return Response({
                "success": False,
                "code": ge.code,
                "message": ge.message
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "code": "LINK_FAILED",
                "message": "Account linking could not be completed."
            }, status=status.HTTP_400_BAD_REQUEST)

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        # 1. File Upload (multipart/form-data)
        file = request.FILES.get('avatar') or request.FILES.get('file')
        if file:
            if file.size > 5 * 1024 * 1024:
                return Response({
                    "success": False,
                    "message": "Avatar file size must not exceed 5MB."
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                img = Image.open(file)
                img.verify()
                file.seek(0)
                img = Image.open(file)
            except Exception:
                return Response({
                    "success": False,
                    "message": "Invalid image file format. Please upload a valid JPEG, PNG, WEBP, or GIF."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Convert format and thumbnail to 400x400
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img = img.convert('RGBA')
                save_format = 'PNG'
                mime = 'image/png'
            else:
                img = img.convert('RGB')
                save_format = 'JPEG'
                mime = 'image/jpeg'

            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            if save_format == 'JPEG':
                img.save(buffer, format='JPEG', quality=85, optimize=True)
            else:
                img.save(buffer, format='PNG', optimize=True)

            encoded_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            data_uri = f"data:{mime};base64,{encoded_data}"

            filename = f"avatar_{request.user.id}_{uuid.uuid4().hex[:8]}.{save_format.lower()}"
            profile.avatar.save(filename, ContentFile(buffer.getvalue()), save=False)
            profile.avatar_url = data_uri
            profile.avatar_preset = ''
            profile.save()

            return Response({
                "success": True,
                "avatar_url": profile.avatar_url,
                "avatar_preset": profile.avatar_preset,
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)

        # 2. JSON Payload with preset or custom url
        avatar_preset = request.data.get('avatar_preset')
        avatar_url = request.data.get('avatar_url') or request.data.get('data_url')
        remove = request.data.get('remove', False)

        if remove:
            if profile.avatar:
                profile.avatar.delete(save=False)
            profile.avatar = None
            profile.avatar_url = ''
            profile.avatar_preset = ''
            profile.save()
            return Response({
                "success": True,
                "message": "Avatar removed successfully.",
                "avatar_url": "",
                "avatar_preset": "",
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)

        if avatar_preset is not None:
            profile.avatar_preset = str(avatar_preset)
            if profile.avatar_preset and not avatar_url:
                profile.avatar_url = ''
        if avatar_url is not None:
            profile.avatar_url = str(avatar_url)
            if profile.avatar_url:
                profile.avatar_preset = ''

        profile.save()
        return Response({
            "success": True,
            "avatar_url": profile.avatar_url,
            "avatar_preset": profile.avatar_preset,
            "user": UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = None
        profile.avatar_url = ''
        profile.avatar_preset = ''
        profile.save()
        return Response({
            "success": True,
            "message": "Avatar reset to default.",
            "avatar_url": "",
            "avatar_preset": "",
            "user": UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)

