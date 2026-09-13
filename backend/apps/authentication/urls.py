"""
Authentication URLs
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomLoginView,
    LogoutView,
    ProfileView,
    CurrentUserView,
    GoogleLoginView,
    GoogleLinkAccountView,
    AvatarUploadView,
)

urlpatterns = [
    # Core Authentication
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomLoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Google Authentication & Account Linking
    path('google/', GoogleLoginView.as_view(), name='auth_google'),
    path('google/link/', GoogleLinkAccountView.as_view(), name='auth_google_link'),

    # Profile & Identity
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='auth_avatar_upload'),
    path('avatar/', AvatarUploadView.as_view(), name='auth_avatar_alias'),
]

