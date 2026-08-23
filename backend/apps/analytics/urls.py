"""
Analytics URLs
"""
from django.urls import path
from .views import (
    DashboardMetricsView,
    FinancialHealthScoreView,
    CashflowForecastView,
    AnomalyListView,
    AnomalyStatusUpdateView
)

urlpatterns = [
    path('dashboard/', DashboardMetricsView.as_view(), name='analytics_dashboard'),
    path('health-score/', FinancialHealthScoreView.as_view(), name='analytics_health_score'),
    path('cashflow-forecast/', CashflowForecastView.as_view(), name='analytics_forecast'),
    path('anomalies/', AnomalyListView.as_view(), name='analytics_anomalies'),
    path('anomalies/<uuid:pk>/status/', AnomalyStatusUpdateView.as_view(), name='analytics_anomaly_status'),
]
