"""
Authentication & Verification Views
Handles user registration, login, logout, provider-backed OTP check, resend, and JWT lifecycle.
"""
from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
from django.db.models import Q

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    VerificationCheckSerializer,
    VerificationResendSerializer,
    VerificationSendSerializer,
    GoogleAuthSerializer,
    GoogleLinkAccountSerializer
)
from .models import Profile, VerificationSession
from services.verification_service import VerificationService
from services.providers.base import ProviderError

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
        user = serializer.save()

        require_otp = getattr(settings, 'AUTH_REQUIRE_EMAIL_VERIFICATION', False)

        if not require_otp:
            refresh = RefreshToken.for_user(user)
            return Response({
                "success": True,
                "message": "Account created successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        ctx = get_client_context(request)

        try:
            verification_resp = VerificationService.start_email_verification(
                user=user,
                email=user.email,
                purpose="EMAIL_SIGNUP",
                channel="EMAIL",
                request_context=ctx
            )
            return Response(verification_resp, status=status.HTTP_201_CREATED)
        except ProviderError as pe:
            return Response({
                "success": False,
                "code": pe.code,
                "message": pe.message
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE if pe.code == "PROVIDER_UNAVAILABLE" else status.HTTP_400_BAD_REQUEST)

class VerificationCheckView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Support both new verification_id schema and legacy payload
        data = request.data.copy()
        if 'email_or_username' in data and 'verification_id' not in data:
            identifier = data.get('email_or_username', '').strip()
            user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
            if user:
                session = VerificationSession.objects.filter(user=user, status='PENDING').order_by('-created_at').first()
                if session:
                    data['verification_id'] = str(session.id)
            if 'otp' in data and 'code' not in data:
                data['code'] = data['otp']

        serializer = VerificationCheckSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        vid = str(serializer.validated_data['verification_id'])
        code = str(serializer.validated_data['code'])
        ctx = get_client_context(request)

        try:
            result = VerificationService.check_email_verification(
                verification_id=vid,
                code=code,
                request_context=ctx
            )
        except ProviderError as pe:
            return Response({
                "success": False,
                "code": pe.code,
                "message": pe.message
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE if pe.code == "PROVIDER_UNAVAILABLE" else status.HTTP_400_BAD_REQUEST)

        if not result.get('success', False):
            code_type = result.get('code')
            if code_type in ['TOO_MANY_ATTEMPTS', 'RESEND_LIMIT']:
                return Response(result, status=status.HTTP_429_TOO_MANY_REQUESTS)
            elif code_type == 'VERIFICATION_NOT_FOUND':
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)

class VerificationResendView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data.copy()
        if 'email_or_username' in data and 'verification_id' not in data:
            identifier = data.get('email_or_username', '').strip()
            user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
            if user:
                session = VerificationSession.objects.filter(user=user, status='PENDING').order_by('-created_at').first()
                if session:
                    data['verification_id'] = str(session.id)

        serializer = VerificationResendSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        vid = str(serializer.validated_data['verification_id'])
        ctx = get_client_context(request)

        try:
            result = VerificationService.resend_email_verification(
                verification_id=vid,
                request_context=ctx
            )
        except ProviderError as pe:
            return Response({
                "success": False,
                "code": pe.code,
                "message": pe.message
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE if pe.code == "PROVIDER_UNAVAILABLE" else status.HTTP_400_BAD_REQUEST)

        if not result.get('success', False):
            if result.get('code') in ['RESEND_COOLDOWN', 'RESEND_LIMIT']:
                return Response(result, status=status.HTTP_429_TOO_MANY_REQUESTS)
            elif result.get('code') == 'VERIFICATION_NOT_FOUND':
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)

class VerificationSendView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerificationSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        ctx = get_client_context(request)

        try:
            result = VerificationService.start_email_verification(
                user=user,
                email=email,
                purpose="EMAIL_SIGNUP",
                channel="EMAIL",
                request_context=ctx
            )
            return Response(result, status=status.HTTP_200_OK)
        except ProviderError as pe:
            return Response({
                "success": False,
                "code": pe.code,
                "message": pe.message
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE if pe.code == "PROVIDER_UNAVAILABLE" else status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    identifier = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get('identifier') or attrs.get('username') or ''
        identifier = identifier.strip()
        password = attrs.get('password', '')

        if not identifier or not password:
            raise serializers.ValidationError({
                "success": False,
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid username/email or password."
            })

        user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError({
                "success": False,
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid username/email or password."
            })

        require_otp = getattr(settings, 'AUTH_REQUIRE_EMAIL_VERIFICATION', False)
        profile = getattr(user, 'profile', None)

        if require_otp:
            if not user.is_active or not profile or not profile.email_verified or profile.status == 'PENDING_VERIFICATION':
                raise serializers.ValidationError({
                    "success": False,
                    "code": "ACCOUNT_NOT_VERIFIED",
                    "message": "Your account requires email verification before signing in.",
                    "email": user.email
                })
        else:
            if not user.is_active:
                raise serializers.ValidationError({
                    "success": False,
                    "code": "ACCOUNT_DISABLED",
                    "message": "This account is disabled. Please contact support."
                })

        refresh = RefreshToken.for_user(user)
        return {
            "success": True,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }

class CustomLoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

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

