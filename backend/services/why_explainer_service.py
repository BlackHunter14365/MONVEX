"""
MONVEX "WHY?" Explainer & Variance Attribution Engine
Deconstructs any financial metric, spending spike, or budget delta into root causes and merchant drivers.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Count, Q
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category, Merchant


class WhyExplainerService:

    @staticmethod
    def explain_spending_variance(user: User, category_name: str = None) -> dict:
        """
        Explains why spending changed between Current Month and Previous Month.
        Attributes variance to specific categories and merchants.
        """
        today = date.today()
        # Current month range
        cur_start = today.replace(day=1)
        cur_end = today

        # Previous month range (same number of days or full month)
        prev_end_date = cur_start - timedelta(days=1)
        prev_start = prev_end_date.replace(day=1)

        # Base queries
        cur_txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=cur_start, date__lte=cur_end)
        prev_txs = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=prev_start, date__lte=prev_end_date)

        if category_name:
            cur_txs = cur_txs.filter(category__name__icontains=category_name)
            prev_txs = prev_txs.filter(category__name__icontains=category_name)

        cur_total = float(cur_txs.aggregate(t=Sum('amount'))['t'] or Decimal('0.00'))
        prev_total = float(prev_txs.aggregate(t=Sum('amount'))['t'] or Decimal('0.00'))

        diff = cur_total - prev_total
        pct_change = round((diff / max(1.0, prev_total)) * 100, 1) if prev_total > 0 else 0.0

        # Category contributors
        category_drivers = []
        all_cats = Category.objects.filter(Q(user=user) | Q(is_system_default=True))
        for cat in all_cats:
            c_cur = float(cur_txs.filter(category=cat).aggregate(t=Sum('amount'))['t'] or Decimal('0.00'))
            c_prev = float(prev_txs.filter(category=cat).aggregate(t=Sum('amount'))['t'] or Decimal('0.00'))
            c_delta = c_cur - c_prev
            if abs(c_delta) > 50:
                category_drivers.append({
                    "category": cat.name,
                    "color": cat.color,
                    "current_spend": c_cur,
                    "previous_spend": c_prev,
                    "delta": round(c_delta, 2),
                    "pct_change": round((c_delta / max(1.0, c_prev)) * 100, 1) if c_prev > 0 else 100.0
                })

        category_drivers.sort(key=lambda x: abs(x['delta']), reverse=True)

        # Top merchant drivers
        merchants_cur = {}
        for t in cur_txs.select_related('merchant'):
            mname = t.merchant.normalized_name if t.merchant else (t.description or "Direct")
            merchants_cur[mname] = merchants_cur.get(mname, 0.0) + float(t.amount)

        merchants_prev = {}
        for t in prev_txs.select_related('merchant'):
            mname = t.merchant.normalized_name if t.merchant else (t.description or "Direct")
            merchants_prev[mname] = merchants_prev.get(mname, 0.0) + float(t.amount)

        merchant_drivers = []
        all_m_names = set(merchants_cur.keys()).union(set(merchants_prev.keys()))
        for m in all_m_names:
            m_cur = merchants_cur.get(m, 0.0)
            m_prev = merchants_prev.get(m, 0.0)
            m_delta = m_cur - m_prev
            if abs(m_delta) > 100:
                merchant_drivers.append({
                    "merchant": m,
                    "current_amount": round(m_cur, 2),
                    "previous_amount": round(m_prev, 2),
                    "delta": round(m_delta, 2)
                })

        merchant_drivers.sort(key=lambda x: abs(x['delta']), reverse=True)

        direction = "INCREASED" if diff > 0 else ("DECREASED" if diff < 0 else "STABLE")
        if direction == "INCREASED":
            summary = f"Total outflow increased by ₹{diff:,.2f} (+{pct_change}%) compared with last month."
        elif direction == "DECREASED":
            summary = f"Total outflow reduced by ₹{abs(diff):,.2f} ({pct_change}%) compared with last month."
        else:
            summary = "Spending has remained exactly consistent with last month."

        return {
            "category_filter": category_name or "ALL",
            "current_month_total": round(cur_total, 2),
            "previous_month_total": round(prev_total, 2),
            "net_difference": round(diff, 2),
            "percentage_change": pct_change,
            "direction": direction,
            "summary": summary,
            "top_category_drivers": category_drivers[:5],
            "top_merchant_drivers": merchant_drivers[:5]
        }
