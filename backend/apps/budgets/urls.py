"""
Budgets URLs
"""
from django.urls import path
from .views import BudgetListCreateView, BudgetDetailView, BudgetOverviewView

urlpatterns = [
    path('', BudgetListCreateView.as_view(), name='budget_list_create'),
    path('overview/', BudgetOverviewView.as_view(), name='budget_overview'),
    path('<uuid:pk>/', BudgetDetailView.as_view(), name='budget_detail'),
]
