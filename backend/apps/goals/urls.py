"""
Goals URLs
"""
from django.urls import path
from .views import SavingsGoalListCreateView, SavingsGoalDetailView, ContributeGoalView

urlpatterns = [
    path('', SavingsGoalListCreateView.as_view(), name='goal_list_create'),
    path('<uuid:pk>/', SavingsGoalDetailView.as_view(), name='goal_detail'),
    path('<uuid:pk>/contribute/', ContributeGoalView.as_view(), name='goal_contribute'),
]
