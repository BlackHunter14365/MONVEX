"""
Authentication & Verification URLs
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    VerificationCheckView,
    VerificationResendView,
    VerificationSendView,
    CustomLoginView,
    LogoutView,
    ProfileView,
    CurrentUserView,
    GoogleLoginView,
    GoogleLinkAccountView,
)

urlpatterns = [
    # Core Registration & Verification
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('verification/send/', VerificationSendView.as_view(), name='auth_verification_send'),
    path('verification/check/', VerificationCheckView.as_view(), name='auth_verification_check'),
    path('verification/resend/', VerificationResendView.as_view(), name='auth_verification_resend'),

    # Backward-compatible aliases
    path('verify-otp/', VerificationCheckView.as_view(), name='auth_verify_otp_alias'),
    path('resend-otp/', VerificationResendView.as_view(), name='auth_resend_otp_alias'),

    # Google Authentication & Account Linking
    path('google/', GoogleLoginView.as_view(), name='auth_google'),
    path('google/link/', GoogleLinkAccountView.as_view(), name='auth_google_link'),

    # JWT Authentication & Profiles
    path('login/', CustomLoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
]

