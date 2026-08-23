"""
MONVEX Financial AI Agent Tools Suite
Strict Multi-Tenant Database Query & Calculation Interfaces
"""
import math
from decimal import Decimal
from datetime import date, timedelta, datetime
from django.db.models import Sum, Count, Avg, StdDev, Q
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category, RecurringPayment, Merchant, Asset, Liability
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from .financial_health import FinancialHealthEngine
from .forecasting import ForecastingEngine
from .affordability import AffordabilityEngine

class MONVEXTools:
    """
    Sanitized, parameterized data access layer for the Financial Intelligence Agent.
    Every tool requires an authenticated `user` and returns clean dictionaries.
    """

    @classmethod
    def get_transactions(
        cls,
        user: User,
        start_date: str = None,
        end_date: str = None,
        category: str = None,
        type: str = None,
        merchant: str = None,
        limit: int = 20
    ) -> dict:
        """
        Retrieves user transactions filtered by date, category, type (INCOME/EXPENSE/TRANSFER), or merchant.
        """
        qs = Transaction.objects.filter(user=user).select_related('category', 'merchant')

        if start_date:
            try:
                d_start = datetime.strptime(start_date, '%Y-%m-%d').date()
                qs = qs.filter(date__gte=d_start)
            except (ValueError, TypeError):
                pass

        if end_date:
            try:
                d_end = datetime.strptime(end_date, '%Y-%m-%d').date()
                qs = qs.filter(date__lte=d_end)
            except (ValueError, TypeError):
                pass

        if category:
            qs = qs.filter(category__name__icontains=category)

        if type and type.upper() in ['INCOME', 'EXPENSE', 'TRANSFER']:
            qs = qs.filter(type=type.upper())

        if merchant:
            qs = qs.filter(Q(merchant__name__icontains=merchant) | Q(description__icontains=merchant))

        total_count = qs.count()
        total_amount = float(qs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))

        tx_list = []
        for t in qs.order_by('-date', '-created_at')[:limit]:
            m_name = t.merchant.name if t.merchant else (t.description or "Transaction")
            c_name = t.category.name if t.category else "Uncategorized"
            tx_list.append({
                "id": str(t.id),
                "date": str(t.date),
                "merchant": m_name,
                "category": c_name,
                "type": t.type,
                "amount": float(t.amount),
                "source": t.source
            })

        return {
            "total_count": total_count,
            "total_filtered_amount": total_amount,
            "limit": limit,
            "transactions": tx_list
        }

    @classmethod
    def get_transaction_summary(cls, user: User, period_days: int = 30) -> dict:
        """
        Computes aggregate inflow, outflow, net savings, top categories, and top merchants for a rolling period.
        """
        period_days = max(1, min(365, int(period_days)))
        today = date.today()
        start_date = today - timedelta(days=period_days)

        qs = Transaction.objects.filter(user=user, date__gte=start_date).select_related('category', 'merchant')

        income = float(qs.filter(type='INCOME').aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))
        expense = float(qs.filter(type='EXPENSE').aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))
        net = income - expense

        # Category breakdown
        cat_map = {}
        merchant_map = {}
        for t in qs.filter(type='EXPENSE'):
            cname = t.category.name if t.category else "Uncategorized"
            cat_map[cname] = cat_map.get(cname, 0.0) + float(t.amount)

            mname = t.merchant.name if t.merchant else (t.description or "General Expense")
            merchant_map[mname] = merchant_map.get(mname, 0.0) + float(t.amount)

        top_cats = sorted([{"category": k, "amount": round(v, 2), "pct": round((v / max(1.0, expense)) * 100, 1)} for k, v in cat_map.items()], key=lambda x: x['amount'], reverse=True)
        top_merchants = sorted([{"merchant": k, "amount": round(v, 2)} for k, v in merchant_map.items()], key=lambda x: x['amount'], reverse=True)[:5]

        return {
            "period_days": period_days,
            "start_date": str(start_date),
            "end_date": str(today),
            "total_income": round(income, 2),
            "total_expense": round(expense, 2),
            "net_savings": round(net, 2),
            "savings_rate_pct": round((net / income) * 100, 1) if income > 0 else 0.0,
            "transaction_count": qs.count(),
            "top_categories": top_cats[:6],
            "top_merchants": top_merchants
        }

    @classmethod
    def search_transactions(cls, user: User, query: str = None, min_amount: float = None, max_amount: float = None, limit: int = 20) -> dict:
        """
        Fuzzy search across transaction merchants, descriptions, and category tags.
        """
        qs = Transaction.objects.filter(user=user).select_related('category', 'merchant')

        if query:
            qs = qs.filter(
                Q(description__icontains=query) |
                Q(merchant__name__icontains=query) |
                Q(category__name__icontains=query)
            )

        if min_amount is not None:
            qs = qs.filter(amount__gte=Decimal(str(min_amount)))

        if max_amount is not None:
            qs = qs.filter(amount__lte=Decimal(str(max_amount)))

        results = []
        for t in qs.order_by('-date', '-created_at')[:limit]:
            m_name = t.merchant.name if t.merchant else (t.description or "Transaction")
            c_name = t.category.name if t.category else "Uncategorized"
            results.append({
                "id": str(t.id),
                "date": str(t.date),
                "merchant": m_name,
                "category": c_name,
                "amount": float(t.amount),
                "type": t.type
            })


        return {
            "query": query,
            "match_count": qs.count(),
            "results": results
        }

    @classmethod
    def get_accounts(cls, user: User) -> dict:
        """
        Retrieves user's verified bank accounts, credit cards, and digital wallets with masked numbers.
        """
        assets = Asset.objects.filter(user=user).order_by('-created_at')
        accounts = []
        total_balance = 0.0

        for a in assets:
            val = float(a.value)
            total_balance += val
            last4 = "••••"
            if a.notes:
                try:
                    import json
                    meta = json.loads(a.notes)
                    last4 = meta.get('last4', '••••')
                except:
                    pass

            accounts.append({
                "id": str(a.id),
                "name": a.name,
                "institution": a.institution or "Financial Institution",
                "asset_type": a.asset_type,
                "balance": val,
                "masked_account": f"•••• {last4}"
            })

        return {
            "total_accounts": len(accounts),
            "total_liquid_balance": round(total_balance, 2),
            "accounts": accounts
        }

    @classmethod
    def get_account_balance(cls, user: User, account_id: str = None) -> dict:
        """
        Retrieves balance for a specific account or the aggregate portfolio balance.
        """
        if account_id:
            asset = Asset.objects.filter(user=user, id=account_id).first()
            if not asset:
                return {"error": f"Account with ID {account_id} not found."}
            return {
                "account_id": str(asset.id),
                "name": asset.name,
                "balance": float(asset.value),
                "institution": asset.institution
            }

        total = float(Asset.objects.filter(user=user).aggregate(s=Sum('value'))['s'] or Decimal('0.00'))
        return {
            "total_balance": round(total, 2),
            "account_count": Asset.objects.filter(user=user).count()
        }

    @classmethod
    def get_budgets(cls, user: User) -> dict:
        """
        Retrieves all active category budgets with live spending, remaining funds, and utilization %.
        """
        budgets = Budget.objects.filter(user=user, is_active=True).select_related('category')
        today = date.today()
        start_30 = today - timedelta(days=30)
        txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=start_30)

        items = []
        total_limit = 0.0
        total_spent = 0.0

        for b in budgets:
            cname = b.category.name if b.category else "General"
            spent = float(txs.filter(category=b.category).aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))
            limit = float(b.limit_amount)
            rem = max(0.0, limit - spent)
            pct = round((spent / max(1.0, limit)) * 100, 1)

            total_limit += limit
            total_spent += spent

            status = 'EXCEEDED' if spent > limit else ('WARNING' if pct >= 80.0 else 'ON_TRACK')

            items.append({
                "id": str(b.id),
                "category": cname,
                "limit_amount": limit,
                "spent_amount": round(spent, 2),
                "remaining_amount": round(rem, 2),
                "usage_pct": pct,
                "status": status,
                "period": b.period
            })

        return {
            "total_budgets": len(items),
            "total_budget_limit": round(total_limit, 2),
            "total_budget_spent": round(total_spent, 2),
            "overall_usage_pct": round((total_spent / max(1.0, total_limit)) * 100, 1) if total_limit > 0 else 0.0,
            "budgets": items
        }

    @classmethod
    def get_budget_status(cls, user: User, category_name: str = None) -> dict:
        """
        Returns budget health for a specific category or the most critical budget closest to overspend.
        """
        all_budgets = cls.get_budgets(user)['budgets']
        if not all_budgets:
            return {"message": "You haven't set up any budgets yet. You can set them in the Budgets section."}

        if category_name:
            matched = [b for b in all_budgets if category_name.lower() in b['category'].lower()]
            if matched:
                return {"budget": matched[0]}
            return {"message": f"No active budget found for '{category_name}'.", "available_budgets": [b['category'] for b in all_budgets]}

        # Find closest to limit
        sorted_by_usage = sorted(all_budgets, key=lambda x: x['usage_pct'], reverse=True)
        return {
            "highest_risk_budget": sorted_by_usage[0],
            "all_budgets_summary": all_budgets
        }

    @classmethod
    def get_goals(cls, user: User) -> dict:
        """
        Retrieves all active savings goals with target amount, current amount, and completion %.
        """
        goals = SavingsGoal.objects.filter(user=user)
        items = []
        today = date.today()

        for g in goals:
            target = float(g.target_amount)
            saved = float(g.current_amount)
            pct = round((saved / max(1.0, target)) * 100, 1)
            rem = max(0.0, target - saved)

            days_left = (g.target_date - today).days if g.target_date else None
            monthly_req = round(rem / max(1.0, (days_left / 30.0)), 2) if days_left and days_left > 0 else rem

            items.append({
                "id": str(g.id),
                "title": g.title,
                "target_amount": target,
                "current_saved": saved,
                "remaining_amount": rem,
                "progress_pct": pct,
                "target_date": str(g.target_date) if g.target_date else None,
                "days_remaining": days_left,
                "required_monthly_savings": monthly_req,
                "is_completed": saved >= target
            })

        return {
            "total_goals": len(items),
            "goals": items
        }

    @classmethod
    def get_goal_progress(cls, user: User, goal_id: str = None) -> dict:
        """
        Detailed progress report for a specific goal.
        """
        goals_data = cls.get_goals(user)['goals']
        if not goals_data:
            return {"message": "You have no active savings goals configured."}

        if goal_id:
            matched = [g for g in goals_data if g['id'] == goal_id or goal_id.lower() in g['title'].lower()]
            if matched:
                return {"goal": matched[0]}
            return {"error": f"Goal '{goal_id}' not found."}

        return {"goals": goals_data}

    @classmethod
    def get_cashflow(cls, user: User, period_days: int = 30) -> dict:
        """
        Deterministic cashflow analysis: total inflow, outflow, burn rate, and runway.
        """
        period_days = max(1, min(365, int(period_days)))
        today = date.today()
        start_date = today - timedelta(days=period_days)

        txs = Transaction.objects.filter(user=user, date__gte=start_date)
        inflow = float(txs.filter(type='INCOME').aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))
        outflow = float(txs.filter(type='EXPENSE').aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))

        profile = getattr(user, 'profile', None)
        profile_income = float(getattr(profile, 'monthly_income', Decimal('0.00')) or Decimal('0.00'))
        effective_inflow = max(inflow, profile_income)

        net_flow = effective_inflow - outflow
        daily_burn = round(outflow / float(period_days), 2)
        daily_inflow = round(effective_inflow / float(period_days), 2)

        assets = Asset.objects.filter(user=user)
        liquid = float(assets.filter(asset_type__in=['BANK', 'CASH']).aggregate(s=Sum('value'))['s'] or Decimal('0.00'))
        runway_days = round((liquid / max(1.0, daily_burn)), 1) if liquid > 0 else 0.0

        return {
            "period_days": period_days,
            "total_inflow": round(effective_inflow, 2),
            "total_outflow": round(outflow, 2),
            "net_cashflow": round(net_flow, 2),
            "average_daily_spend": daily_burn,
            "average_daily_income": daily_inflow,
            "total_liquid_reserves": round(liquid, 2),
            "cash_runway_days": runway_days,
            "savings_rate_pct": round((net_flow / effective_inflow) * 100, 1) if effective_inflow > 0 else 0.0
        }

    @classmethod
    def get_spending_by_category(cls, user: User, period_days: int = 30) -> dict:
        """
        Spending grouped by category with amounts, transaction counts, and percentages.
        """
        period_days = max(1, min(365, int(period_days)))
        today = date.today()
        start_date = today - timedelta(days=period_days)

        txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=start_date).select_related('category')
        total_expense = float(txs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))

        cats = {}
        for t in txs:
            cname = t.category.name if t.category else "Uncategorized"
            if cname not in cats:
                cats[cname] = {"category": cname, "amount": 0.0, "count": 0}
            cats[cname]["amount"] += float(t.amount)
            cats[cname]["count"] += 1

        res = []
        for c in cats.values():
            pct = round((c['amount'] / max(1.0, total_expense)) * 100, 1)
            res.append({
                "category": c['category'],
                "amount": round(c['amount'], 2),
                "transaction_count": c['count'],
                "percentage": pct
            })

        res.sort(key=lambda x: x['amount'], reverse=True)
        return {
            "total_expense": round(total_expense, 2),
            "period_days": period_days,
            "categories": res
        }

    @classmethod
    def get_recurring_expenses(cls, user: User) -> dict:
        """
        Active recurring subscriptions and fixed obligations.
        """
        recs = RecurringPayment.objects.filter(user=user, is_active=True)
        items = []
        total_monthly = 0.0

        for r in recs:
            amt = float(r.amount)
            monthly_equiv = amt if r.frequency == 'MONTHLY' else (amt / 12.0 if r.frequency == 'YEARLY' else amt * 4.33)
            total_monthly += monthly_equiv

            items.append({
                "id": str(r.id),
                "name": r.name,
                "amount": amt,
                "frequency": r.frequency,
                "monthly_equivalent": round(monthly_equiv, 2),
                "next_due_date": str(r.next_due_date) if r.next_due_date else None,
                "category": r.category.name if r.category else "Subscription"
            })

        return {
            "active_subscriptions_count": len(items),
            "total_monthly_burn": round(total_monthly, 2),
            "total_annualized_burn": round(total_monthly * 12.0, 2),
            "subscriptions": items
        }

    @classmethod
    def compare_periods(cls, user: User, period1_days: int = 30, period2_days: int = 30) -> dict:
        """
        Compares spending between current period (e.g. past 30 days) and preceding period (e.g. 30 to 60 days ago).
        """
        today = date.today()
        cur_start = today - timedelta(days=period1_days)
        prev_start = cur_start - timedelta(days=period2_days)

        cur_txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=cur_start)
        prev_txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=prev_start, date__lt=cur_start)

        cur_total = float(cur_txs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))
        prev_total = float(prev_txs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00'))

        delta = round(cur_total - prev_total, 2)
        pct_change = round(((cur_total - prev_total) / max(1.0, prev_total)) * 100, 1) if prev_total > 0 else 0.0

        # Category level comparison
        cur_cats = {}
        for t in cur_txs:
            cname = t.category.name if t.category else "Uncategorized"
            cur_cats[cname] = cur_cats.get(cname, 0.0) + float(t.amount)

        prev_cats = {}
        for t in prev_txs:
            cname = t.category.name if t.category else "Uncategorized"
            prev_cats[cname] = prev_cats.get(cname, 0.0) + float(t.amount)

        all_cat_names = set(cur_cats.keys()).union(set(prev_cats.keys()))
        cat_deltas = []
        for c in all_cat_names:
            c_cur = cur_cats.get(c, 0.0)
            c_prev = prev_cats.get(c, 0.0)
            c_d = round(c_cur - c_prev, 2)
            c_pct = round(((c_cur - c_prev) / max(1.0, c_prev)) * 100, 1) if c_prev > 0 else 0.0
            cat_deltas.append({
                "category": c,
                "current_period": round(c_cur, 2),
                "previous_period": round(c_prev, 2),
                "delta": c_d,
                "pct_change": c_pct
            })

        cat_deltas.sort(key=lambda x: abs(x['delta']), reverse=True)

        return {
            "current_period_spend": round(cur_total, 2),
            "previous_period_spend": round(prev_total, 2),
            "net_delta": delta,
            "pct_change": pct_change,
            "trend": "INCREASED" if delta > 0 else ("DECREASED" if delta < 0 else "FLAT"),
            "category_variances": cat_deltas[:5]
        }

    @classmethod
    def detect_anomalies(cls, user: User, lookback_days: int = 60) -> dict:
        """
        Z-Score statistical outlier detection for irregular expenses.
        """
        today = date.today()
        start_date = today - timedelta(days=lookback_days)
        txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=start_date).select_related('category', 'merchant')

        if not txs.exists():
            return {"anomalies_found": 0, "items": [], "average_ticket": 0.0}

        amounts = [float(t.amount) for t in txs]
        mean_val = sum(amounts) / len(amounts)
        variance = sum((x - mean_val) ** 2 for x in amounts) / max(1, len(amounts) - 1)
        std_dev = math.sqrt(variance)
        threshold = mean_val + (1.8 * std_dev)

        anomalies = []
        for t in txs:
            amt = float(t.amount)
            if amt > threshold and amt > 1000:
                z_score = round((amt - mean_val) / max(1.0, std_dev), 2)
                anomalies.append({
                    "id": str(t.id),
                    "description": t.merchant.name if t.merchant else (t.description or "Expense"),
                    "amount": amt,
                    "date": str(t.date),
                    "category": t.category.name if t.category else "General",
                    "z_score": z_score,
                    "delta_vs_mean": round(amt - mean_val, 2)
                })


        return {
            "anomalies_found": len(anomalies),
            "items": anomalies[:5],
            "average_ticket": round(mean_val, 2),
            "std_dev": round(std_dev, 2),
            "threshold": round(threshold, 2)
        }

    # Engines dispatch
    @classmethod
    def calculate_financial_health(cls, user: User) -> dict:
        return FinancialHealthEngine.calculate(user)

    @classmethod
    def forecast_cashflow(cls, user: User, months_ahead: int = 3) -> dict:
        return ForecastingEngine.forecast(user, months_ahead)

    @classmethod
    def simulate_purchase(cls, user: User, item_name: str, price: float) -> dict:
        return AffordabilityEngine.simulate_purchase(user, item_name, price)

    @classmethod
    def simulate_spending_reduction(cls, user: User, category_name: str, reduction_pct: float = 20.0, months: int = 6) -> dict:
        return AffordabilityEngine.simulate_spending_reduction(user, category_name, reduction_pct, months)
