"""
MONVEX Financial Health Scoring Engine
Deterministic, Multi-Factor Financial Health Calculator (0 - 100)
"""
import math
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Avg, StdDev, Q
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, RecurringPayment, Asset, Liability
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal

class FinancialHealthEngine:
    """
    Computes a deterministic, multi-factor financial health score (0 - 100).
    Factors:
      1. Savings Rate (25 pts): % of monthly income saved (target >= 25%)
      2. Cash Runway (20 pts): Liquid balance / monthly burn (target >= 90 days / 3 months)
      3. Budget Adherence (20 pts): Ratio of active budgets kept within limits (target 100%)
      4. Recurring Fixed Burden (10 pts): Subscriptions & fixed commitments vs income (target <= 15%)
      5. Debt-to-Income / Solvency (10 pts): Monthly EMI vs income (target <= 20%)
      6. Savings Goal Progress (10 pts): Progress & contributions to active targets
      7. Spending Stability (5 pts): Variance / volatility of daily expenses
    """

    @classmethod
    def calculate(cls, user: User) -> dict:
        today = date.today()
        start_30 = today - timedelta(days=30)

        # 1. Income & Expenses (Past 30 Days)
        txs_30 = Transaction.objects.filter(user=user, date__gte=start_30)
        flows_30 = txs_30.aggregate(
            inc=Sum('amount', filter=Q(type='INCOME')),
            exp=Sum('amount', filter=Q(type='EXPENSE'))
        )
        income_30 = float(flows_30['inc'] or Decimal('0.00'))
        expense_30 = float(flows_30['exp'] or Decimal('0.00'))

        profile = getattr(user, 'profile', None)
        monthly_income_profile = float(getattr(profile, 'monthly_income', Decimal('0.00')) or Decimal('0.00'))
        effective_income = max(income_30, monthly_income_profile)

        net_savings = max(0.0, effective_income - expense_30) if effective_income > 0 else 0.0
        savings_rate = round((net_savings / effective_income) * 100, 1) if effective_income > 0 else 0.0

        # Factor 1: Savings Rate (25 pts)
        if effective_income <= 0:
            score_savings = 0.0
        elif savings_rate >= 30.0:
            score_savings = 25.0
        elif savings_rate >= 20.0:
            score_savings = 20.0 + ((savings_rate - 20.0) / 10.0) * 5.0
        elif savings_rate >= 10.0:
            score_savings = 10.0 + ((savings_rate - 10.0) / 10.0) * 10.0
        elif savings_rate > 0:
            score_savings = (savings_rate / 10.0) * 10.0
        else:
            score_savings = 0.0

        # Factor 2: Cash Runway / Liquid Reserves (20 pts)
        assets = Asset.objects.filter(user=user)
        liquid_balance = float(assets.filter(asset_type__in=['BANK', 'CASH']).aggregate(s=Sum('value'))['s'] or Decimal('0.00'))
        monthly_burn = expense_30 if expense_30 > 0 else 1.0
        runway_days = round((liquid_balance / monthly_burn) * 30, 1) if liquid_balance > 0 else 0.0

        if runway_days >= 180: # 6+ months
            score_runway = 20.0
        elif runway_days >= 90: # 3-6 months
            score_runway = 15.0 + ((runway_days - 90) / 90.0) * 5.0
        elif runway_days >= 30: # 1-3 months
            score_runway = 8.0 + ((runway_days - 30) / 60.0) * 7.0
        elif runway_days > 0:
            score_runway = (runway_days / 30.0) * 8.0
        else:
            score_runway = 0.0

        # Factor 3: Budget Adherence (20 pts)
        budgets = list(Budget.objects.filter(user=user, is_active=True))
        total_budgets = len(budgets)
        overspent_budgets = 0

        if total_budgets > 0:
            cat_spends = {
                r['category_id']: float(r['total'])
                for r in txs_30.filter(type='EXPENSE').values('category_id').annotate(total=Sum('amount'))
            }
            for b in budgets:
                cat_spend = cat_spends.get(b.category_id, 0.0)
                if cat_spend > float(b.limit_amount):
                    overspent_budgets += 1
            kept_ratio = (total_budgets - overspent_budgets) / total_budgets
            score_budget = round(kept_ratio * 20.0, 1)
        else:
            score_budget = 14.0

        # Factor 4: Recurring Commitments & Subscriptions (10 pts)
        recs = RecurringPayment.objects.filter(user=user, is_active=True)
        recurring_monthly = sum((float(r.amount) if r.frequency == 'MONTHLY' else float(r.amount) / 12.0 for r in recs), 0.0)
        recurring_ratio = (recurring_monthly / effective_income) * 100 if effective_income > 0 else 0.0

        if recurring_ratio <= 10.0:
            score_recurring = 10.0
        elif recurring_ratio <= 25.0:
            score_recurring = 10.0 - ((recurring_ratio - 10.0) / 15.0) * 5.0
        else:
            score_recurring = max(0.0, 5.0 - ((recurring_ratio - 25.0) / 25.0) * 5.0)

        # Factor 5: Debt / Liability Burden (10 pts)
        liabilities = Liability.objects.filter(user=user)
        total_monthly_emi = float(liabilities.aggregate(s=Sum('monthly_emi'))['s'] or Decimal('0.00'))
        dti_ratio = (total_monthly_emi / effective_income) * 100 if effective_income > 0 else 0.0

        if dti_ratio <= 15.0:
            score_debt = 10.0
        elif dti_ratio <= 35.0:
            score_debt = 10.0 - ((dti_ratio - 15.0) / 20.0) * 6.0
        else:
            score_debt = max(0.0, 4.0 - ((dti_ratio - 35.0) / 30.0) * 4.0)

        # Factor 6: Savings Goals Progress (10 pts)
        goals = SavingsGoal.objects.filter(user=user)
        goal_agg = goals.aggregate(t=Sum('target_amount'), s=Sum('current_amount'))
        total_target = float(goal_agg['t'] or Decimal('0.00'))
        total_saved = float(goal_agg['s'] or Decimal('0.00'))
        if total_target > 0:
            goal_pct = min(100.0, (total_saved / total_target) * 100)
            score_goals = round((goal_pct / 100.0) * 10.0, 1)
        elif goal_agg['t'] is not None:
            score_goals = 5.0
        else:
            score_goals = 5.0

        # Factor 7: Spending Volatility (5 pts)
        tx_expenses = list(txs_30.filter(type='EXPENSE').values_list('amount', flat=True))
        if len(tx_expenses) >= 4:
            amounts_f = [float(a) for a in tx_expenses]
            mean_a = sum(amounts_f) / len(amounts_f)
            std_a = math.sqrt(sum((x - mean_a) ** 2 for x in amounts_f) / len(amounts_f))
            cv = (std_a / mean_a) if mean_a > 0 else 0.0
            if cv <= 1.0:
                score_stability = 5.0
            elif cv <= 2.0:
                score_stability = 3.5
            else:
                score_stability = 2.0
        else:
            score_stability = 4.0

        total_score = int(round(score_savings + score_runway + score_budget + score_recurring + score_debt + score_goals + score_stability))
        total_score = max(0, min(100, total_score))

        if total_score >= 80:
            grade = 'A'
            rating = 'EXCELLENT'
        elif total_score >= 65:
            grade = 'B'
            rating = 'HEALTHY'
        elif total_score >= 50:
            grade = 'C'
            rating = 'FAIR'
        else:
            grade = 'D'
            rating = 'AT_RISK'

        warnings = []
        strengths = []

        if savings_rate >= 20.0:
            strengths.append(f"Strong savings rate of {savings_rate}% of monthly income.")
        elif effective_income > 0 and savings_rate < 10.0:
            warnings.append(f"Low savings rate ({savings_rate}%); recommend aiming for at least 15-20%.")

        if runway_days >= 90:
            strengths.append(f"Solid emergency reserve covering ~{int(runway_days)} days of living expenses.")
        else:
            warnings.append(f"Emergency cash runway is only ~{int(runway_days)} days; target 90-180 days.")

        if overspent_budgets > 0:
            warnings.append(f"{overspent_budgets} active category budget(s) exceeded.")

        if dti_ratio > 35.0:
            warnings.append(f"High debt EMI burden ({dti_ratio:.1f}% of income).")

        return {
            "score": total_score,
            "grade": grade,
            "rating": rating,
            "components": {
                "savings_rate_score": round(score_savings, 1),
                "cash_runway_score": round(score_runway, 1),
                "budget_adherence_score": round(score_budget, 1),
                "recurring_burden_score": round(score_recurring, 1),
                "debt_solvency_score": round(score_debt, 1),
                "goals_progress_score": round(score_goals, 1),
                "spending_stability_score": round(score_stability, 1),
            },
            "metrics": {
                "monthly_income": effective_income,
                "monthly_expense": expense_30,
                "monthly_savings": net_savings,
                "savings_rate_pct": savings_rate,
                "liquid_balance": liquid_balance,
                "emergency_runway_days": runway_days,
                "active_budgets_count": total_budgets,
                "overspent_budgets_count": overspent_budgets,
                "monthly_emi_total": total_monthly_emi,
                "recurring_monthly_total": recurring_monthly,
            },
            "strengths": strengths,
            "warnings": warnings,
        }
