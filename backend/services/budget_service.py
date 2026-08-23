"""
Budget Service
Implements budget intelligence, spending velocity, and month-end projections.
"""
import calendar
from datetime import date
from decimal import Decimal
from django.db.models import Sum
from django.contrib.auth.models import User
from apps.budgets.models import Budget
from apps.transactions.models import Transaction

class BudgetService:

    @staticmethod
    def get_budget_overview(user: User) -> list:
        """
        Calculate usage, daily velocity, and month-end projections for all active budgets.
        """
        today = date.today()
        first_day = today.replace(day=1)
        _, total_days_in_month = calendar.monthrange(today.year, today.month)
        days_elapsed = max(today.day, 1)
        days_remaining = total_days_in_month - days_elapsed

        budgets = Budget.objects.filter(user=user, is_active=True).select_related('category')
        results = []

        for budget in budgets:
            # Query spent in current month for this category
            spent = Transaction.objects.filter(
                user=user,
                category=budget.category,
                type='EXPENSE',
                date__gte=first_day,
                date__lte=today
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            limit = budget.limit_amount
            usage_percentage = round((spent / limit) * 100, 1) if limit > 0 else 0.0

            # Daily velocity & projections
            daily_velocity = spent / Decimal(days_elapsed)
            projected_month_end = spent + (daily_velocity * Decimal(days_remaining))
            projected_variance = projected_month_end - limit

            # Status determination
            if spent > limit:
                status = 'EXCEEDED'
            elif projected_month_end > limit:
                status = 'WARNING'
            else:
                status = 'ON_TRACK'

            results.append({
                "id": str(budget.id),
                "category_id": str(budget.category.id),
                "category_name": budget.category.name,
                "category_icon": budget.category.icon,
                "category_color": budget.category.color,
                "limit_amount": float(limit),
                "spent_amount": float(spent),
                "remaining_amount": float(max(limit - spent, Decimal('0.00'))),
                "usage_percentage": float(usage_percentage),
                "daily_velocity": float(round(daily_velocity, 2)),
                "projected_month_end": float(round(projected_month_end, 2)),
                "projected_variance": float(round(projected_variance, 2)),
                "status": status,
                "days_remaining": days_remaining
            })

        return results
