"""
AI Copilot Serializers
"""
from rest_framework import serializers
from .models import AIInteraction, AIInsight, AnomalyEvent, ConversationSession, ConversationMessage
from apps.transactions.serializers import TransactionSerializer


class AIInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInteraction
        fields = ['id', 'question', 'tools_used', 'response', 'rating', 'created_at']
        read_only_fields = ['id', 'created_at']

class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = ['id', 'insight_type', 'title', 'message', 'score_impact', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

class AnomalyEventSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)

    class Meta:
        model = AnomalyEvent
        fields = ['id', 'transaction', 'score', 'reason', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'score', 'reason']

class ChatInputSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)

class ConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationMessage
        fields = ['id', 'sender', 'content', 'intent', 'tools_used', 'tool_activity', 'citations', 'data', 'created_at']
        read_only_fields = ['id', 'created_at']

class ConversationSessionSerializer(serializers.ModelSerializer):
    messages = ConversationMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = ConversationSession
        fields = ['id', 'title', 'is_pinned', 'message_count', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class WhatIfSimulationInputSerializer(serializers.Serializer):
    category_name = serializers.CharField(max_length=100, default='Food & Dining')
    reduction_percent = serializers.FloatField(min_value=1.0, max_value=100.0, default=20.0)
    months = serializers.IntegerField(min_value=1, max_value=60, default=6)

