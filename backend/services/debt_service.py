"""
MONVEX Debt & Loan Amortization Engine
Calculates EMI schedules, remaining interest liabilities, and accelerated payoff scenarios.
"""
from decimal import Decimal
from datetime import date, timedelta
import math
from django.contrib.auth.models import User
from apps.transactions.models import Liability


class DebtService:

    @staticmethod
    def calculate_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
        """Standard reducing-balance EMI formula"""
        if principal <= 0 or tenure_months <= 0:
            return 0.0
        if annual_rate_pct <= 0:
            return round(principal / tenure_months, 2)

        r = (annual_rate_pct / 100.0) / 12.0
        n = tenure_months
        emi = principal * (r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)
        return round(emi, 2)

    @staticmethod
    def get_user_debt_overview(user: User) -> dict:
        liabilities = Liability.objects.filter(user=user)
        total_principal = sum((float(l.principal_amount) for l in liabilities), 0.0)
        total_remaining = sum((float(l.remaining_balance) for l in liabilities), 0.0)
        total_monthly_emi = sum((float(l.monthly_emi) for l in liabilities), 0.0)

        items = []
        for l in liabilities:
            p = float(l.principal_amount)
            rem = float(l.remaining_balance)
            rate = float(l.interest_rate_pct)
            tenure = l.tenure_months

            computed_emi = float(l.monthly_emi) if l.monthly_emi > 0 else DebtService.calculate_emi(p, rate, tenure)
            total_interest = max(0.0, (computed_emi * tenure) - p)

            items.append({
                "id": str(l.id),
                "name": l.name,
                "liability_type": l.liability_type,
                "principal_amount": p,
                "remaining_balance": rem,
                "interest_rate_pct": rate,
                "tenure_months": tenure,
                "monthly_emi": computed_emi,
                "total_interest_payable": round(total_interest, 2),
                "lender": l.lender,
                "next_due_date": str(l.next_due_date) if l.next_due_date else None,
                "progress_pct": round(((p - rem) / max(1.0, p)) * 100, 1)
            })

        return {
            "total_liabilities_count": len(items),
            "total_principal": round(total_principal, 2),
            "total_remaining_balance": round(total_remaining, 2),
            "total_monthly_emi": round(total_monthly_emi, 2),
            "items": items
        }

    @staticmethod
    def simulate_extra_payment(
        principal_remaining: float,
        annual_rate_pct: float,
        current_monthly_emi: float,
        extra_monthly_payment: float = 2000.0
    ) -> dict:
        """
        Simulate the impact of paying extra amount every month towards loan principal.
        """
        if principal_remaining <= 0 or current_monthly_emi <= 0:
            return {"error": "Invalid principal or EMI"}

        r = (annual_rate_pct / 100.0) / 12.0

        # Baseline payoff
        balance = principal_remaining
        baseline_months = 0
        baseline_total_interest = 0.0
        while balance > 0 and baseline_months < 600:
            interest = balance * r
            principal_part = current_monthly_emi - interest
            if principal_part <= 0:
                break
            baseline_total_interest += interest
            balance -= principal_part
            baseline_months += 1

        # Accelerated payoff with extra payment
        balance = principal_remaining
        accelerated_emi = current_monthly_emi + extra_monthly_payment
        accelerated_months = 0
        accelerated_total_interest = 0.0
        while balance > 0 and accelerated_months < 600:
            interest = balance * r
            principal_part = accelerated_emi - interest
            if principal_part <= 0:
                break
            accelerated_total_interest += interest
            balance -= principal_part
            accelerated_months += 1

        months_saved = max(0, baseline_months - accelerated_months)
        interest_saved = max(0.0, baseline_total_interest - accelerated_total_interest)

        today = date.today()
        baseline_payoff_date = today + timedelta(days=baseline_months * 30)
        accelerated_payoff_date = today + timedelta(days=accelerated_months * 30)

        return {
            "principal_remaining": principal_remaining,
            "annual_rate_pct": annual_rate_pct,
            "baseline_emi": current_monthly_emi,
            "extra_monthly_payment": extra_monthly_payment,
            "accelerated_emi": accelerated_emi,
            "baseline_tenure_months": baseline_months,
            "baseline_payoff_date": baseline_payoff_date.strftime("%B %Y"),
            "baseline_total_interest": round(baseline_total_interest, 2),
            "accelerated_tenure_months": accelerated_months,
            "accelerated_payoff_date": accelerated_payoff_date.strftime("%B %Y"),
            "accelerated_total_interest": round(accelerated_total_interest, 2),
            "months_saved": months_saved,
            "interest_saved": round(interest_saved, 2)
        }
