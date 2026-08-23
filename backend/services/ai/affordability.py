"""
MONVEX Affordability & What-If Simulation Engine
Deterministic Purchase Evaluation & Spending Cut Simulators
"""
import math
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Q
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category, Asset, RecurringPayment
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal

class AffordabilityEngine:
    """
    Deterministic Affordability and What-If Scenario Simulators.
    """

    @classmethod
    def simulate_purchase(cls, user: User, item_name: str, price: float) -> dict:
        price = max(0.0, float(price))
        today = date.today()
        start_30 = today - timedelta(days=30)

        # 1. Real Liquidity & Cash Flow
        assets = Asset.objects.filter(user=user)
        liquid_balance = float(assets.filter(asset_type__in=['BANK', 'CASH']).aggregate(s=Sum('value'))['s'] or Decimal('0.00'))

        txs_30 = Transaction.objects.filter(user=user, date__gte=start_30)
        expense_30 = float(txs_30.filter(type='EXPENSE').aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))
        income_30 = float(txs_30.filter(type='INCOME').aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))

        profile = getattr(user, 'profile', None)
        monthly_income_profile = float(getattr(profile, 'monthly_income', Decimal('0.00')) or Decimal('0.00'))
        effective_income = max(income_30, monthly_income_profile)

        monthly_surplus = max(0.0, effective_income - expense_30) if effective_income > 0 else 0.0

        # Safety Buffer: 2.5 months of basic living expenses (minimum 25,000)
        emergency_buffer = max(25000.0, expense_30 * 2.5) if expense_30 > 0 else 25000.0
        disposable_liquidity = max(0.0, liquid_balance - emergency_buffer)

        # Active Goals Impact
        goals = SavingsGoal.objects.filter(user=user)
        active_goals_target = float(goals.aggregate(s=Sum('target_amount'))['s'] or Decimal('0.00'))

        # Tiers:
        # Tier 1: Outright Safe (Liquid balance covers price + full emergency buffer)
        # Tier 2: Feasible with structured savings (Discretionary surplus can fund within 1-6 months)
        # Tier 3: High Risk (Insufficient buffer / deficit cash flow)
        if liquid_balance >= (price + emergency_buffer) and price > 0:
            risk_level = 'LOW'
            tier = 'TIER_1_IMMEDIATE_SAFE'
            tier_label = 'Safe to Purchase (Outright)'
            months_to_save = 0
            post_purchase_balance = liquid_balance - price
            post_purchase_runway_days = round((post_purchase_balance / max(1.0, expense_30)) * 30, 1)
            explanation = (
                f"You can safely buy {item_name} for ₹{price:,.2f} outright. "
                f"Your liquid balance will remain at ₹{post_purchase_balance:,.2f}, preserving a {post_purchase_runway_days}-day emergency runway "
                f"well above your ₹{emergency_buffer:,.2f} safety buffer."
            )
        elif monthly_surplus > 0 or disposable_liquidity > 0:
            risk_level = 'MODERATE'
            tier = 'TIER_2_STRUCTURED_SURPLUS'
            tier_label = 'Feasible via Staged Savings'
            effective_alloc = max(2000.0, monthly_surplus)
            deficit = max(0.0, price - disposable_liquidity)
            months_to_save = max(1, int(math.ceil(deficit / effective_alloc)))
            post_purchase_balance = max(0.0, liquid_balance - price)
            post_purchase_runway_days = round((post_purchase_balance / max(1.0, expense_30)) * 30, 1)
            explanation = (
                f"Purchasing {item_name} (₹{price:,.2f}) immediately would reduce your emergency buffer below optimal safety levels. "
                f"By allocating your monthly surplus of ₹{effective_alloc:,.2f}/mo, you can fully fund this in {months_to_save} month(s) without financial stress."
            )
        else:
            risk_level = 'HIGH'
            tier = 'TIER_3_HIGH_RISK'
            tier_label = 'High Cashflow Risk'
            months_to_save = max(1, int(math.ceil(price / 5000.0)))
            post_purchase_balance = max(0.0, liquid_balance - price)
            post_purchase_runway_days = 0.0
            explanation = (
                f"Purchasing {item_name} (₹{price:,.2f}) presents high liquidity risk. "
                f"Your verified liquid reserves (₹{liquid_balance:,.2f}) cannot absorb this expense without jeopardizing basic cashflow."
            )

        liquidity_impact_pct = min(100.0, round((price / max(1.0, liquid_balance)) * 100, 1)) if liquid_balance > 0 else 100.0

        return {
            "item_name": item_name,
            "purchase_price": price,
            "risk_level": risk_level,
            "tier": tier,
            "tier_label": tier_label,
            "current_liquid_balance": liquid_balance,
            "emergency_buffer_required": emergency_buffer,
            "safe_disposable_liquidity": disposable_liquidity,
            "monthly_cashflow_surplus": monthly_surplus,
            "liquidity_impact_pct": liquidity_impact_pct,
            "months_to_save": months_to_save,
            "explanation": explanation
        }

    @classmethod
    def simulate_spending_reduction(cls, user: User, category_name: str, reduction_pct: float = 20.0, months: int = 6) -> dict:
        reduction_pct = max(1.0, min(100.0, float(reduction_pct)))
        months = max(1, min(60, int(months)))
        today = date.today()
        start_30 = today - timedelta(days=30)

        # Category Spend
        cat = Category.objects.filter(
            Q(user=user) | Q(is_system_default=True),
            name__icontains=category_name
        ).first()

        cat_filter = Q(category=cat) if cat else Q(category__name__icontains=category_name)
        cat_spend_30 = float(Transaction.objects.filter(user=user, type='EXPENSE', date__gte=start_30).filter(cat_filter).aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))

        if cat_spend_30 <= 0:
            budget = Budget.objects.filter(user=user, category__name__icontains=category_name).first()
            cat_spend_30 = float(budget.limit_amount) if budget else 6000.0

        monthly_saved = round(cat_spend_30 * (reduction_pct / 100.0), 2)
        total_timeframe_saved = round(monthly_saved * months, 2)
        annual_saved = round(monthly_saved * 12.0, 2)

        # Compounded SIP Growth at 12% CAGR over 3 years
        r = (12.0 / 100.0) / 12.0
        n = 36 # 3 years
        sip_3yr_future_value = round(monthly_saved * (((1 + r) ** n - 1) / r) * (1 + r), 2) if r > 0 else monthly_saved * n
        wealth_gain_3yr = round(max(0.0, sip_3yr_future_value - (monthly_saved * n)), 2)

        return {
            "category": cat.name if cat else category_name.title(),
            "baseline_monthly_spend": cat_spend_30,
            "reduction_percentage": reduction_pct,
            "monthly_savings": monthly_saved,
            "timeframe_months": months,
            "timeframe_total_saved": total_timeframe_saved,
            "annualized_savings": annual_saved,
            "invested_3yr_corpus_12cagr": sip_3yr_future_value,
            "compounded_wealth_gain_3yr": wealth_gain_3yr,
            "summary": f"Cutting {reduction_pct:.0f}% in {cat.name if cat else category_name.title()} saves ₹{monthly_saved:,.2f}/mo (₹{annual_saved:,.2f}/yr) and yields ₹{sip_3yr_future_value:,.2f} if invested for 3 years."
        }
