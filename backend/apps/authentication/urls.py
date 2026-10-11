"""
Authentication URLs
"""
from django.urls import path
from .views import (
    RegisterView,
    CustomLoginView,
    LogoutView,
    CookieTokenRefreshView,
    ProfileView,
    CurrentUserView,
    GoogleLoginView,
    GoogleLinkAccountView,
    AvatarUploadView,
    MFASetupView,
    MFAVerifyView,
    MFADisableView,
    MFAStatusView,
    MFALoginCompleteView,
)

urlpatterns = [
    # Core Authentication
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomLoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),

    # Multi-Factor Authentication (TOTP / 2FA)
    path('mfa/setup/', MFASetupView.as_view(), name='auth_mfa_setup'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='auth_mfa_verify'),
    path('mfa/disable/', MFADisableView.as_view(), name='auth_mfa_disable'),
    path('mfa/status/', MFAStatusView.as_view(), name='auth_mfa_status'),
    path('mfa/login/', MFALoginCompleteView.as_view(), name='auth_mfa_login'),

    # Google Authentication & Account Linking
    path('google/', GoogleLoginView.as_view(), name='auth_google'),
    path('google/link/', GoogleLinkAccountView.as_view(), name='auth_google_link'),

    # Profile & Identity
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='auth_avatar_upload'),
    path('avatar/', AvatarUploadView.as_view(), name='auth_avatar_alias'),
]

