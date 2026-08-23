"""
AI Copilot Views
"""
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import AIInteraction, AIInsight, ConversationSession, ConversationMessage
from .serializers import (
    AIInteractionSerializer,
    AIInsightSerializer,
    ChatInputSerializer,
    WhatIfSimulationInputSerializer,
    ConversationSessionSerializer,
    ConversationMessageSerializer
)
from services.ai_copilot_service import AICopilotService
from services.simulator_service import SimulatorService

class AIChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data['question']
        conversation_id = serializer.validated_data.get('conversation_id')

        response_data = AICopilotService.ask_copilot(
            user=request.user,
            question=question,
            conversation_id=str(conversation_id) if conversation_id else None
        )
        return Response(response_data, status=status.HTTP_200_OK)

class ConversationSessionListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationSessionSerializer

    def get_queryset(self):
        return ConversationSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ConversationSessionDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationSessionSerializer

    def get_queryset(self):
        return ConversationSession.objects.filter(user=self.request.user)

class ConversationSessionClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        session = generics.get_object_or_404(ConversationSession, pk=pk, user=request.user)
        session.messages.all().delete()
        return Response({"status": "cleared", "conversation_id": str(session.id)}, status=status.HTTP_200_OK)

class AIWhatIfSimulationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WhatIfSimulationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = AICopilotService.tool_calculate_what_if(
            user=request.user,
            category_name=data['category_name'],
            reduction_percent=data['reduction_percent'],
            months=data['months']
        )
        return Response(result, status=status.HTTP_200_OK)

class SimulatorRunView(APIView):
    """
    Full Deterministic What-If Financial Simulation Engine Endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        income_delta = float(request.data.get('income_delta', 0.0))
        category_cuts = request.data.get('category_cuts', {})
        extra_savings = float(request.data.get('extra_monthly_savings', 0.0))
        extra_debt = float(request.data.get('extra_debt_payment', 0.0))
        months = int(request.data.get('timeframe_months', 12))

        result = SimulatorService.run_simulation(
            user=request.user,
            income_delta=income_delta,
            category_cuts=category_cuts,
            extra_monthly_savings=extra_savings,
            extra_debt_payment=extra_debt,
            timeframe_months=months
        )

        return Response({"success": True, **result}, status=status.HTTP_200_OK)

class AIInsightListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIInsightSerializer

    def get_queryset(self):
        return AIInsight.objects.filter(user=self.request.user)

class AIInteractionHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIInteractionSerializer

    def get_queryset(self):
        return AIInteraction.objects.filter(user=self.request.user)[:20]


