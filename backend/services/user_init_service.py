"""
User Initialization Service
Seeds fresh multi-tenant database records and default financial categories for verified users.
"""
from decimal import Decimal
from datetime import date
from django.contrib.auth.models import User
from apps.transactions.models import Category, Transaction
from apps.budgets.models import Budget

class UserInitService:

    DEFAULT_CATEGORIES = [
        {"name": "Food & Dining", "icon": "Utensils", "color": "#F59E0B"},
        {"name": "Groceries", "icon": "ShoppingBag", "color": "#10B981"},
        {"name": "Transportation", "icon": "Car", "color": "#3B82F6"},
        {"name": "Bills & Utilities", "icon": "Zap", "color": "#EF4444"},
        {"name": "Housing & Rent", "icon": "Home", "color": "#8B5CF6"},
        {"name": "Shopping", "icon": "ShoppingBag", "color": "#EC4899"},
        {"name": "Entertainment", "icon": "Film", "color": "#6366F1"},
        {"name": "Health & Medical", "icon": "Activity", "color": "#14B8A6"},
        {"name": "Salary & Income", "icon": "Briefcase", "color": "#22C55E"},
        {"name": "Investments", "icon": "TrendingUp", "color": "#EAB308"},
    ]

    @classmethod
    def initialize_fresh_user_account(cls, user: User):
        """
        Sets up personalized categories for a new user.
        Leaves accounts, transactions, budgets, and goals completely empty.
        """
        # Create standard categories specifically for this user
        for cat_data in cls.DEFAULT_CATEGORIES:
            Category.objects.get_or_create(
                user=user,
                name=cat_data["name"],
                defaults={
                    "icon": cat_data["icon"],
                    "color": cat_data["color"]
                }
            )
