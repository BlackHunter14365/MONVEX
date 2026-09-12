"""
Authentication & Verification URLs
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    RegisterVerifyOTPView,
    RegisterResendOTPView,
    VerificationCheckView,
    VerificationResendView,
    VerificationSendView,
    VerificationStatusView,
    CustomLoginView,
    LoginVerifyOTPView,
    LoginResendOTPView,
    LogoutView,
    ProfileView,
    CurrentUserView,
    GoogleLoginView,
    GoogleLinkAccountView,
    AvatarUploadView,
)

urlpatterns = [
    # Core Registration & OTP Verification
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register/verify-otp/', RegisterVerifyOTPView.as_view(), name='auth_register_verify_otp'),
    path('register/resend-otp/', RegisterResendOTPView.as_view(), name='auth_register_resend_otp'),

    # Two-Stage Login (Credentials + Email OTP)
    path('login/', CustomLoginView.as_view(), name='auth_login'),
    path('login/verify-otp/', LoginVerifyOTPView.as_view(), name='auth_login_verify_otp'),
    path('login/resend-otp/', LoginResendOTPView.as_view(), name='auth_login_resend_otp'),

    # Generic & Backward-Compatible Verification Endpoints
    path('verification/status/', VerificationStatusView.as_view(), name='auth_verification_status'),
    path('verification/send/', VerificationSendView.as_view(), name='auth_verification_send'),
    path('verification/check/', VerificationCheckView.as_view(), name='auth_verification_check'),
    path('verification/resend/', VerificationResendView.as_view(), name='auth_verification_resend'),
    path('verify-otp/', VerificationCheckView.as_view(), name='auth_verify_otp_alias'),
    path('resend-otp/', VerificationResendView.as_view(), name='auth_resend_otp_alias'),

    # Google Authentication & Account Linking
    path('google/', GoogleLoginView.as_view(), name='auth_google'),
    path('google/link/', GoogleLinkAccountView.as_view(), name='auth_google_link'),

    # JWT Authentication & Profiles
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='auth_avatar_upload'),
    path('avatar/', AvatarUploadView.as_view(), name='auth_avatar_alias'),
]

