"""
AI Copilot & Intelligence Models
"""
import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.transactions.models import Transaction

class AIInteraction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_interactions')
    question = models.TextField()
    tools_used = models.JSONField(default=list, blank=True)
    response = models.TextField()
    rating = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Query by {self.user.username} at {self.created_at}"

class AIInsight(models.Model):
    TYPE_CHOICES = [
        ('OVERSPENDING', 'Overspending Alert'),
        ('SAVINGS_OPPORTUNITY', 'Savings Opportunity'),
        ('BILL_REMINDER', 'Upcoming Bill Reminder'),
        ('ANOMALY', 'Unusual Spending Detected'),
        ('GOAL_PROGRESS', 'Goal Velocity Update'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_insights')
    insight_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    score_impact = models.IntegerField(default=0)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.insight_type}] {self.title}"

class AnomalyEvent(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('CONFIRMED', 'Confirmed Unusual'),
        ('DISMISSED', 'Dismissed / Expected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='anomalies')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='anomaly_events')
    score = models.DecimalField(max_digits=5, decimal_places=4, default=0.0000)
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Anomaly on ₹{self.transaction.amount} ({self.reason})"


class ConversationSession(models.Model):
    """
    Multi-turn conversation session for the Financial AI Agent.
    Strictly isolated per authenticated user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    title = models.CharField(max_length=255, default='New Financial Inquiry')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation {self.id} ({self.user.username}): {self.title}"


class ConversationMessage(models.Model):
    """
    Individual turn within a multi-turn conversation session.
    """
    SENDER_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    content = models.TextField()
    intent = models.CharField(max_length=50, blank=True, default='GENERAL_KNOWLEDGE')
    tools_used = models.JSONField(default=list, blank=True)
    tool_activity = models.JSONField(default=list, blank=True)
    citations = models.JSONField(default=list, blank=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender}] {self.content[:40]}..."

