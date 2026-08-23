from django.urls import path
from .views import (
    SecurityOverviewView,
    SecurityAuditLogListView,
    SecurityVulnerabilityScanView,
    RevokeAllSessionsView,
    ContactSubmissionView
)

app_name = 'security'

urlpatterns = [
    path('overview/', SecurityOverviewView.as_view(), name='overview'),
    path('logs/', SecurityAuditLogListView.as_view(), name='logs'),
    path('scan/', SecurityVulnerabilityScanView.as_view(), name='scan'),
    path('revoke-sessions/', RevokeAllSessionsView.as_view(), name='revoke_sessions'),
    path('contact/', ContactSubmissionView.as_view(), name='contact'),
]

