from django.urls import path
from .views import (
    AIChatView,
    AIWhatIfSimulationView,
    SimulatorRunView,
    AIInsightListView,
    AIInteractionHistoryView,
    ConversationSessionListView,
    ConversationSessionDetailView,
    ConversationSessionClearView
)

urlpatterns = [
    path('chat/', AIChatView.as_view(), name='ai_chat'),
    path('conversations/', ConversationSessionListView.as_view(), name='ai_conversations'),
    path('conversations/<uuid:pk>/', ConversationSessionDetailView.as_view(), name='ai_conversation_detail'),
    path('conversations/<uuid:pk>/clear/', ConversationSessionClearView.as_view(), name='ai_conversation_clear'),
    path('what-if/', AIWhatIfSimulationView.as_view(), name='ai_what_if'),
    path('simulator/', SimulatorRunView.as_view(), name='ai_simulator_run'),
    path('insights/', AIInsightListView.as_view(), name='ai_insights'),
    path('history/', AIInteractionHistoryView.as_view(), name='ai_history'),
]

