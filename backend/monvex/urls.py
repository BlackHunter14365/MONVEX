"""
MONVEX Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from .views import health_check, readiness_check
from apps.security.views import ContactSubmissionView
from apps.transactions.views_extra import UniversalSearchView

urlpatterns = [
    # Probes
    path('health/', health_check, name='health-check'),
    path('ready/', readiness_check, name='readiness-check'),

    # Admin & V1 APIs
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/search/', UniversalSearchView.as_view(), name='api-search'),
    path('api/v1/transactions/', include('apps.transactions.urls')),
    path('api/v1/budgets/', include('apps.budgets.urls')),
    path('api/v1/goals/', include('apps.goals.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/ai/', include('apps.ai_copilot.urls')),
    path('api/v1/security/', include('apps.security.urls')),
    path('api/v1/contact/', ContactSubmissionView.as_view(), name='api-contact'),
]

