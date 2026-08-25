"""
MONVEX Cashflow & Trajectory Forecasting Engine
Deterministic Projections Based on Historical Run-Rates & Volatility
"""
import math
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Q
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, RecurringPayment, Asset

class ForecastingEngine:
    """
    Computes deterministic forward-looking forecasts for 30/60/90 days.
    Uses rolling daily spend pace, income run-rate, and known recurring commitments.
    """

    @classmethod
    def forecast(cls, user: User, months_ahead: int = 3) -> dict:
        months_ahead = max(1, min(12, int(months_ahead)))
        today = date.today()

        # Lookback 60 days to build statistical baseline
        start_60 = today - timedelta(days=60)
        start_30 = today - timedelta(days=30)

        # Single combined query for 30-day and 60-day income and expenses
        agg = Transaction.objects.filter(user=user, date__gte=start_60).aggregate(
            exp_30=Sum('amount', filter=Q(date__gte=start_30, type='EXPENSE')),
            inc_30=Sum('amount', filter=Q(date__gte=start_30, type='INCOME')),
            exp_60=Sum('amount', filter=Q(type='EXPENSE')),
            inc_60=Sum('amount', filter=Q(type='INCOME'))
        )

        expense_30 = float(agg['exp_30'] or Decimal('0.00'))
        income_30 = float(agg['inc_30'] or Decimal('0.00'))
        expense_60 = float(agg['exp_60'] or Decimal('0.00'))
        income_60 = float(agg['inc_60'] or Decimal('0.00'))

        profile = getattr(user, 'profile', None)
        monthly_income_profile = float(getattr(profile, 'monthly_income', Decimal('0.00')) or Decimal('0.00'))

        # Weighted Monthly Income & Expense Baseline
        if income_60 > 0:
            baseline_monthly_income = (income_30 * 0.6) + ((income_60 / 2.0) * 0.4)
        else:
            baseline_monthly_income = max(income_30, monthly_income_profile)

        if expense_60 > 0:
            baseline_monthly_expense = (expense_30 * 0.6) + ((expense_60 / 2.0) * 0.4)
        else:
            baseline_monthly_expense = expense_30

        # Current Liquid Assets
        assets = Asset.objects.filter(user=user)
        current_liquidity = float(assets.filter(asset_type__in=['BANK', 'CASH']).aggregate(s=Sum('value'))['s'] or Decimal('0.00'))

        # Fixed Subscriptions / Recurring Payments
        recs = RecurringPayment.objects.filter(user=user, is_active=True)
        recurring_monthly = sum((float(r.amount) if r.frequency == 'MONTHLY' else float(r.amount) / 12.0 for r in recs), 0.0)

        # Monthly Projection Breakdown
        monthly_net_surplus = baseline_monthly_income - baseline_monthly_expense
        daily_burn_rate = round(baseline_monthly_expense / 30.0, 2)

        monthly_projections = []
        running_balance = current_liquidity

        for m in range(1, months_ahead + 1):
            projected_income = round(baseline_monthly_income, 2)
            projected_expense = round(baseline_monthly_expense, 2)
            projected_net = round(projected_income - projected_expense, 2)
            running_balance += projected_net

            # Future Month Name
            future_date = today + timedelta(days=m * 30)
            month_label = future_date.strftime('%B %Y')

            monthly_projections.append({
                "month_index": m,
                "month_label": month_label,
                "projected_income": projected_income,
                "projected_expense": projected_expense,
                "projected_net_savings": projected_net,
                "projected_end_balance": round(running_balance, 2)
            })

        # Confidence assessment based on data depth
        tx_count = txs_60.count()
        if tx_count >= 30:
            confidence = 'HIGH'
            confidence_pct = 92
        elif tx_count >= 10:
            confidence = 'MODERATE'
            confidence_pct = 75
        elif tx_count > 0:
            confidence = 'LOW_BASELINE'
            confidence_pct = 50
        else:
            confidence = 'INITIAL_ESTIMATE'
            confidence_pct = 30

        return {
            "timeframe_months": months_ahead,
            "current_liquid_balance": current_liquidity,
            "baseline_monthly_income": round(baseline_monthly_income, 2),
            "baseline_monthly_expense": round(baseline_monthly_expense, 2),
            "daily_burn_rate": daily_burn_rate,
            "fixed_recurring_monthly": round(recurring_monthly, 2),
            "monthly_net_trajectory": round(monthly_net_surplus, 2),
            "projected_final_balance": round(running_balance, 2),
            "net_wealth_change": round(running_balance - current_liquidity, 2),
            "confidence": confidence,
            "confidence_score_pct": confidence_pct,
            "monthly_breakdown": monthly_projections,
            "disclaimer": "Forecast is a statistical projection based on recent cashflows and is not a guaranteed outcome."
        }
