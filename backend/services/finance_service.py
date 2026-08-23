"""
Finance Service
Encapsulates financial intelligence calculations, dashboard aggregations, and transparent Financial Health Score.
"""
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, Count
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from services.budget_service import BudgetService

class FinanceService:

    @staticmethod
    def get_dashboard_metrics(user: User) -> dict:
        today = date.today()
        first_day_this_month = today.replace(day=1)

        # Monthly Income & Expenses
        monthly_income = Transaction.objects.filter(
            user=user,
            type='INCOME',
            date__gte=first_day_this_month,
            date__lte=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        monthly_expense = Transaction.objects.filter(
            user=user,
            type='EXPENSE',
            date__gte=first_day_this_month,
            date__lte=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Fallback to profile monthly income if no income transactions recorded yet this month
        profile = getattr(user, 'profile', None)
        if monthly_income == Decimal('0.00') and profile and profile.monthly_income > Decimal('0.00'):
            monthly_income = profile.monthly_income

        # All-time Net Balance
        total_income_all_time = Transaction.objects.filter(
            user=user,
            type='INCOME'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        total_expense_all_time = Transaction.objects.filter(
            user=user,
            type='EXPENSE'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        net_balance = total_income_all_time - total_expense_all_time

        # Savings & Savings Rate
        net_savings = max(monthly_income - monthly_expense, Decimal('0.00'))
        savings_rate = round((net_savings / monthly_income * 100), 1) if monthly_income > 0 else 0.0

        # Category Breakdown for Current Month
        category_spending = Transaction.objects.filter(
            user=user,
            type='EXPENSE',
            date__gte=first_day_this_month,
            date__lte=today,
            category__isnull=False
        ).values(
            'category__id', 'category__name', 'category__color', 'category__icon'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        category_breakdown = [
            {
                "category_id": str(item['category__id']),
                "name": item['category__name'],
                "color": item['category__color'],
                "icon": item['category__icon'],
                "total": float(item['total']),
                "count": item['count'],
                "percentage": round(float((item['total'] / monthly_expense) * 100), 1) if monthly_expense > 0 else 0.0
            }
            for item in category_spending
        ]

        # 6-Month Monthly Trends
        monthly_trends = []
        for i in range(5, -1, -1):
            # calculate year and month
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            month_start = date(y, m, 1)
            if m == 12:
                next_month = date(y + 1, 1, 1)
            else:
                next_month = date(y, m + 1, 1)
            month_end = next_month - timedelta(days=1)

            inc = Transaction.objects.filter(
                user=user, type='INCOME', date__gte=month_start, date__lte=month_end
            ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

            exp = Transaction.objects.filter(
                user=user, type='EXPENSE', date__gte=month_start, date__lte=month_end
            ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

            monthly_trends.append({
                "month": month_start.strftime("%b %Y"),
                "short_month": month_start.strftime("%b"),
                "income": float(inc),
                "expense": float(exp),
                "savings": float(max(inc - exp, Decimal('0.00')))
            })

        # Recent 5 transactions
        recent_transactions = Transaction.objects.filter(
            user=user
        ).select_related('category', 'merchant').order_by('-date', '-created_at')[:5]

        recent_tx_data = [
            {
                "id": str(tx.id),
                "amount": float(tx.amount),
                "type": tx.type,
                "date": str(tx.date),
                "description": tx.description,
                "category_name": tx.category.name if tx.category else "Uncategorized",
                "category_color": tx.category.color if tx.category else "#6B7280",
                "merchant_name": tx.merchant.normalized_name if tx.merchant else "",
                "source": tx.source,
                "confidence": float(tx.confidence)
            }
            for tx in recent_transactions
        ]

        # Financial Health Score
        health_score_data = FinanceService.calculate_financial_health_score(user)

        return {
            "currency": profile.currency if profile else "INR",
            "net_balance": float(net_balance),
            "total_income": float(total_income_all_time),
            "total_expense": float(total_expense_all_time),
            "monthly_income": float(monthly_income),
            "monthly_expense": float(monthly_expense),
            "net_savings": float(net_savings),
            "savings_rate": float(savings_rate),
            "savings_rate_pct": float(savings_rate),
            "category_breakdown": category_breakdown,
            "spending_by_category": category_breakdown,
            "monthly_trends": monthly_trends,
            "monthly_trend": monthly_trends,
            "recent_transactions": recent_tx_data,
            "health_score": health_score_data
        }

    @staticmethod
    def calculate_financial_health_score(user: User) -> dict:
        """
        Calculate a transparent 0-100 Financial Health Score with factor breakdowns.
        - Savings Rate (Max 30 pts)
        - Budget Adherence (Max 30 pts)
        - Expense Stability / Control (Max 20 pts)
        - Goals Progress (Max 20 pts)
        """
        today = date.today()
        first_day_this_month = today.replace(day=1)

        income = Transaction.objects.filter(
            user=user, type='INCOME', date__gte=first_day_this_month, date__lte=today
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        profile = getattr(user, 'profile', None)
        if income == Decimal('0.00') and profile and profile.monthly_income > Decimal('0.00'):
            income = profile.monthly_income

        expense = Transaction.objects.filter(
            user=user, type='EXPENSE', date__gte=first_day_this_month, date__lte=today
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        # 1. Savings Rate Score (0 - 30)
        savings_pts = 15
        savings_reason = "Default benchmark applied."
        if income > Decimal('0.00'):
            rate = ((income - expense) / income) * 100
            if rate >= 30:
                savings_pts = 30
                savings_reason = f"Excellent savings rate of {rate:.1f}% (target >= 30%)."
            elif rate >= 20:
                savings_pts = 24
                savings_reason = f"Healthy savings rate of {rate:.1f}% (target >= 20%)."
            elif rate >= 10:
                savings_pts = 18
                savings_reason = f"Moderate savings rate of {rate:.1f}%."
            elif rate > 0:
                savings_pts = 10
                savings_reason = f"Low savings rate of {rate:.1f}%. Consider reducing discretionary spending."
            else:
                savings_pts = 0
                savings_reason = "Expenses exceed income for the current month."

        # 2. Budget Adherence Score (0 - 30)
        budgets = BudgetService.get_budget_overview(user)
        budget_pts = 25
        budget_reason = "No budgets set yet. Set category budgets to optimize score."
        if budgets:
            total_budgets = len(budgets)
            on_track = sum(1 for b in budgets if b['status'] == 'ON_TRACK')
            warning = sum(1 for b in budgets if b['status'] == 'WARNING')
            exceeded = sum(1 for b in budgets if b['status'] == 'EXCEEDED')

            ratio = (on_track + (0.5 * warning)) / total_budgets
            budget_pts = int(round(ratio * 30))
            if exceeded > 0:
                budget_reason = f"{exceeded} category budget(s) exceeded this month."
            elif warning > 0:
                budget_reason = f"{warning} category budget(s) at risk of month-end overspending."
            else:
                budget_reason = "All category budgets are well within limits."

        # 3. Expense Control & Ratio (0 - 20)
        expense_pts = 15
        expense_reason = "Expense ratio is within expected parameters."
        if income > Decimal('0.00'):
            ratio = (expense / income)
            if ratio <= Decimal('0.50'):
                expense_pts = 20
                expense_reason = "Spending is strictly under 50% of monthly income."
            elif ratio <= Decimal('0.75'):
                expense_pts = 16
                expense_reason = "Spending is controlled under 75% of monthly income."
            elif ratio <= Decimal('0.90'):
                expense_pts = 10
                expense_reason = "Spending consumes over 75% of monthly income."
            else:
                expense_pts = 4
                expense_reason = "High expenditure ratio (>= 90% of income)."

        # 4. Goals Progress (0 - 20)
        goals = SavingsGoal.objects.filter(user=user, status='IN_PROGRESS')
        goal_pts = 15
        goal_reason = "Create savings targets to track goal health."
        if goals.exists():
            total_progress = sum(
                (float(g.current_amount) / float(g.target_amount)) * 100
                for g in goals if g.target_amount > 0
            ) / goals.count()
            goal_pts = min(20, max(5, int(round((total_progress / 100) * 20))))
            goal_reason = f"Average progress across active goals is {total_progress:.1f}%."

        total_score = min(100, max(0, savings_pts + budget_pts + expense_pts + goal_pts))

        if total_score >= 80:
            tier = "EXCELLENT"
            grade = "A"
        elif total_score >= 65:
            tier = "GOOD"
            grade = "B"
        elif total_score >= 50:
            tier = "FAIR"
            grade = "C"
        else:
            tier = "NEEDS_ATTENTION"
            grade = "D"

        return {
            "score": total_score,
            "tier": tier,
            "grade": grade,
            "breakdown": {
                "savings_rate": {"score": savings_pts, "max": 30, "reason": savings_reason},
                "budget_adherence": {"score": budget_pts, "max": 30, "reason": budget_reason},
                "expense_control": {"score": expense_pts, "max": 20, "reason": expense_reason},
                "goals_progress": {"score": goal_pts, "max": 20, "reason": goal_reason},
            }
        }
