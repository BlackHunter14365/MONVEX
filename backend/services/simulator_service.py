"""
MONVEX What-If Financial Simulator Engine
100% Deterministic Mathematical Scenario Modeling.
Calculates savings velocity shifts, goal completion date acceleration, and compounded wealth accumulation.
"""
from decimal import Decimal
from datetime import date, timedelta
import math
from django.db.models import Sum
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from services.finance_service import FinanceService


class SimulatorService:

    @staticmethod
    def run_simulation(
        user: User,
        income_delta: float = 0.0,
        category_cuts: dict = None,
        extra_monthly_savings: float = 0.0,
        extra_debt_payment: float = 0.0,
        timeframe_months: int = 12
    ) -> dict:
        """
        Run a deterministic What-If simulation for the user.
        - income_delta: +/- change in monthly income (e.g. +5000)
        - category_cuts: { "Food & Dining": 20, "Shopping": 15 } (% reduction)
        - extra_monthly_savings: direct additional SIP allocation
        - extra_debt_payment: additional payment towards liabilities
        - timeframe_months: simulation projection window
        """
        today = date.today()
        first_day_month = today.replace(day=1)
        start_30_ago = today - timedelta(days=30)

        # Baseline Metrics
        dash = FinanceService.get_dashboard_metrics(user)
        baseline_income = float(dash['monthly_income'])
        baseline_expense = float(dash['monthly_expense'])
        baseline_savings = max(0.0, float(dash['net_savings']))
        baseline_rate = float(dash['savings_rate'])

        # Calculate Category Reductions
        total_monthly_category_savings = 0.0
        category_breakdown_results = []

        if category_cuts:
            for cat_name, cut_pct in category_cuts.items():
                cut_pct_float = float(cut_pct)
                if cut_pct_float <= 0:
                    continue

                # Query user spend in this category last 30 days
                cat_spend = Transaction.objects.filter(
                    user=user,
                    type='EXPENSE',
                    category__name__icontains=cat_name,
                    date__gte=start_30_ago
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

                spend_val = float(cat_spend)
                if spend_val <= 0:
                    # Fallback to budget or typical baseline
                    b = Budget.objects.filter(user=user, category__name__icontains=cat_name).first()
                    spend_val = float(b.limit_amount) if b else 6000.0

                monthly_cut = spend_val * (cut_pct_float / 100.0)
                total_monthly_category_savings += monthly_cut

                category_breakdown_results.append({
                    "category": cat_name,
                    "current_monthly_spend": round(spend_val, 2),
                    "reduction_pct": cut_pct_float,
                    "monthly_saved": round(monthly_cut, 2),
                    "total_saved_over_horizon": round(monthly_cut * timeframe_months, 2)
                })

        # New Simulated Monthly Cash Flow
        simulated_income = max(0.0, baseline_income + income_delta)
        simulated_expense = max(0.0, baseline_expense - total_monthly_category_savings)
        simulated_monthly_surplus = max(
            0.0,
            (simulated_income - simulated_expense) + extra_monthly_savings
        )

        simulated_savings_rate = round(
            (simulated_monthly_surplus / simulated_income * 100.0), 1
        ) if simulated_income > 0 else 0.0

        monthly_surplus_delta = simulated_monthly_surplus - baseline_savings
        total_additional_wealth_saved = monthly_surplus_delta * timeframe_months

        # Goals Acceleration Modeling
        goals = SavingsGoal.objects.filter(user=user, status='IN_PROGRESS')
        goal_impacts = []
        for goal in goals:
            target = float(goal.target_amount)
            current = float(goal.current_amount)
            remaining = max(0.0, target - current)
            baseline_commitment = float(goal.monthly_commitment) if goal.monthly_commitment > 0 else max(1000.0, baseline_savings * 0.4)

            # Baseline months to finish
            baseline_months_needed = math.ceil(remaining / baseline_commitment) if baseline_commitment > 0 else 999

            # Simulated commitment with allocated surplus boost
            boost_share = monthly_surplus_delta * 0.5  # 50% of surplus to goals
            simulated_commitment = baseline_commitment + max(0.0, boost_share)
            simulated_months_needed = math.ceil(remaining / simulated_commitment) if simulated_commitment > 0 else 999

            months_saved = max(0, baseline_months_needed - simulated_months_needed)
            baseline_finish_date = today + timedelta(days=baseline_months_needed * 30)
            simulated_finish_date = today + timedelta(days=simulated_months_needed * 30)

            goal_impacts.append({
                "goal_id": str(goal.id),
                "title": goal.title,
                "target_amount": target,
                "current_amount": current,
                "baseline_finish_date": baseline_finish_date.strftime("%B %Y"),
                "simulated_finish_date": simulated_finish_date.strftime("%B %Y"),
                "months_saved": months_saved,
                "status": "ACCELERATED" if months_saved > 0 else "MAINTAINED"
            })

        # 3-Year & 5-Year SIP Compounded Growth Engine (12% CAGR Benchmark)
        def compound_sip(monthly_amt: float, years: int, cagr: float = 12.0) -> dict:
            r = (cagr / 100.0) / 12.0
            n = years * 12
            if r > 0:
                fv = monthly_amt * (((1 + r) ** n - 1) / r) * (1 + r)
            else:
                fv = monthly_amt * n
            total_invested = monthly_amt * n
            return {
                "years": years,
                "monthly_sip": round(monthly_amt, 2),
                "total_invested": round(total_invested, 2),
                "projected_corpus": round(fv, 2),
                "wealth_gain": round(max(0.0, fv - total_invested), 2)
            }

        sip_3yr_baseline = compound_sip(baseline_savings, 3)
        sip_3yr_simulated = compound_sip(simulated_monthly_surplus, 3)
        sip_5yr_baseline = compound_sip(baseline_savings, 5)
        sip_5yr_simulated = compound_sip(simulated_monthly_surplus, 5)

        return {
            "timeframe_months": timeframe_months,
            "baseline": {
                "monthly_income": baseline_income,
                "monthly_expense": baseline_expense,
                "monthly_surplus": baseline_savings,
                "savings_rate": baseline_rate,
            },
            "simulated": {
                "monthly_income": simulated_income,
                "monthly_expense": simulated_expense,
                "monthly_surplus": simulated_monthly_surplus,
                "savings_rate": simulated_savings_rate,
                "monthly_surplus_delta": round(monthly_surplus_delta, 2),
                "total_wealth_created": round(total_additional_wealth_saved, 2)
            },
            "category_reductions": category_breakdown_results,
            "goal_impacts": goal_impacts,
            "compounded_growth": {
                "three_year_horizon": {
                    "baseline_corpus": sip_3yr_baseline['projected_corpus'],
                    "simulated_corpus": sip_3yr_simulated['projected_corpus'],
                    "additional_wealth": round(sip_3yr_simulated['projected_corpus'] - sip_3yr_baseline['projected_corpus'], 2)
                },
                "five_year_horizon": {
                    "baseline_corpus": sip_5yr_baseline['projected_corpus'],
                    "simulated_corpus": sip_5yr_simulated['projected_corpus'],
                    "additional_wealth": round(sip_5yr_simulated['projected_corpus'] - sip_5yr_baseline['projected_corpus'], 2)
                }
            }
        }
