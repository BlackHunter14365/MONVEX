"""
Forecast Service
Calculates cash flow projections, future balance trajectories, and uncertainty bounds.
"""
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, Avg
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, RecurringPayment

class ForecastService:

    @staticmethod
    def forecast_cash_flow(user: User, days: int = 30) -> dict:
        today = date.today()
        start_30_ago = today - timedelta(days=30)

        # 1. Calculate historical daily average expense over the last 30 days
        past_expenses = Transaction.objects.filter(
            user=user,
            type='EXPENSE',
            date__gte=start_30_ago,
            date__lte=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        daily_avg_expense = past_expenses / Decimal('30.0')

        # 2. Get current starting net balance
        total_income = Transaction.objects.filter(user=user, type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        total_expense = Transaction.objects.filter(user=user, type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        starting_balance = total_income - total_expense

        # 3. Fetch active recurring obligations in forecast window
        forecast_end_date = today + timedelta(days=days)
        recurring_bills = RecurringPayment.objects.filter(
            user=user,
            is_active=True,
            next_due_date__gte=today,
            next_due_date__lte=forecast_end_date
        )
        recurring_by_date = {}
        for bill in recurring_bills:
            d_str = str(bill.next_due_date)
            recurring_by_date[d_str] = recurring_by_date.get(d_str, Decimal('0.00')) + bill.amount

        # 4. Generate daily trajectory
        daily_projection = []
        current_running_balance = starting_balance
        uncertainty_rate = Decimal('0.03')  # 3% variance widening per 10 days

        for i in range(1, days + 1):
            day_date = today + timedelta(days=i)
            day_str = str(day_date)

            # Standard daily burn
            day_burn = daily_avg_expense
            # Add scheduled recurring bill if any
            if day_str in recurring_by_date:
                day_burn += recurring_by_date[day_str]

            current_running_balance -= day_burn

            spread = day_burn * (uncertainty_rate * Decimal(i))
            upper_bound = current_running_balance + spread
            lower_bound = current_running_balance - spread

            daily_projection.append({
                "date": day_str,
                "day_number": i,
                "projected_balance": float(round(current_running_balance, 2)),
                "upper_bound": float(round(upper_bound, 2)),
                "lower_bound": float(round(lower_bound, 2)),
                "scheduled_bills": float(recurring_by_date.get(day_str, 0.00))
            })

        projected_end_balance = daily_projection[-1]['projected_balance'] if daily_projection else float(starting_balance)

        return {
            "starting_balance": float(starting_balance),
            "forecast_days": days,
            "projected_end_balance": projected_end_balance,
            "daily_burn_rate": float(round(daily_avg_expense, 2)),
            "daily_trajectory": daily_projection
        }
