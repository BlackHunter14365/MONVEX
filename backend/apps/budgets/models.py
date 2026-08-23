"""
Budgets Models
"""
import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.transactions.models import Category

class Budget(models.Model):
    PERIOD_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('WEEKLY', 'Weekly'),
        ('CUSTOM', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    limit_amount = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='MONTHLY')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category', 'period')

    def __str__(self):
        return f"{self.category.name} Budget: ₹{self.limit_amount} ({self.period})"

class BudgetHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='history')
    period_start = models.DateField()
    period_end = models.DateField()
    actual_spent = models.DecimalField(max_digits=12, decimal_places=2)
    variance = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.budget.category.name} ({self.period_start} to {self.period_end}): Spent ₹{self.actual_spent}"
