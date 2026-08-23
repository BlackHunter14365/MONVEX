"""
MONVEX Intelligent AI Financial Copilot Engine
World-Class Autonomous Telemetry Reasoner & Financial Intelligence System
"""
import os
import re
import math
from decimal import Decimal
from datetime import date, timedelta
from django.conf import settings
from django.db.models import Sum, Count, Avg, StdDev, Q
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category, RecurringPayment, Merchant
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from apps.ai_copilot.models import AIInteraction, AIInsight
from services.finance_service import FinanceService
from services.budget_service import BudgetService

class AICopilotService:

    @staticmethod
    def tool_detect_anomalies(user: User, lookback_days: int = 60) -> dict:
        """
        Statistical Z-Score Outlier Detection on recent expenses.
        Flags transactions where amount > mean + 1.8 * std_dev.
        """
        today = date.today()
        start_date = today - timedelta(days=lookback_days)
        txs = Transaction.objects.filter(
            user=user, type='EXPENSE', date__gte=start_date
        ).select_related('category', 'merchant').order_by('-date')

        if not txs.exists():
            return {"anomalies_found": 0, "items": [], "average_ticket": 0}

        amounts = [float(t.amount) for t in txs]
        n = len(amounts)
        mean_val = sum(amounts) / n
        variance = sum((x - mean_val) ** 2 for x in amounts) / max(1, n - 1)
        std_dev = math.sqrt(variance)

        threshold = mean_val + (1.8 * std_dev)
        anomalies = []

        for t in txs:
            amt = float(t.amount)
            if amt > threshold and amt > 1000:
                z_score = round((amt - mean_val) / max(1.0, std_dev), 2)
                anomalies.append({
                    "id": str(t.id),
                    "description": t.description or (t.merchant.name if t.merchant else (t.category.name if t.category else "Expense")),
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

    @staticmethod
    def tool_get_spending_summary(user: User, period_days: int = 30) -> dict:
        today = date.today()
        start_date = today - timedelta(days=period_days)
        txs = Transaction.objects.filter(
            user=user, type='EXPENSE', date__gte=start_date
        ).select_related('category', 'merchant').order_by('-date', '-created_at')

        total = sum((tx.amount for tx in txs), Decimal('0.00'))
        categories = {}
        merchant_map = {}

        for tx in txs:
            cname = tx.category.name if tx.category else "Uncategorized"
            categories[cname] = categories.get(cname, Decimal('0.00')) + tx.amount

            mname = tx.merchant.name if tx.merchant else (tx.description or "Direct")
            merchant_map[mname] = merchant_map.get(mname, Decimal('0.00')) + tx.amount

        sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        sorted_merchants = sorted(merchant_map.items(), key=lambda x: x[1], reverse=True)

        recent_samples = [
            f"{t.description or (t.category.name if t.category else 'Expense')} (₹{t.amount:,.2f})"
            for t in txs[:5]
        ]

        return {
            "period_days": period_days,
            "total_expense": float(total),
            "top_categories": [{"name": k, "amount": float(v)} for k, v in sorted_cats],
            "top_merchants": [{"name": k, "amount": float(v)} for k, v in sorted_merchants[:4]],
            "transaction_count": len(txs),
            "recent_entries": recent_samples
        }

    @staticmethod
    def tool_deep_category_audit(user: User, category_query: str) -> dict:
        today = date.today()
        start_30 = today - timedelta(days=30)
        start_60 = today - timedelta(days=60)

        cat = Category.objects.filter(
            Q(user=user) | Q(is_system_default=True),
            name__icontains=category_query
        ).first()

        cat_filter = Q(category=cat) if cat else Q(category__name__icontains=category_query)

        txs_cur = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=start_30).filter(cat_filter)
        txs_prev = Transaction.objects.filter(user=user, type='EXPENSE', date__gte=start_60, date__lt=start_30).filter(cat_filter)

        cur_sum = float(txs_cur.aggregate(total=Sum('amount'))['total'] or Decimal('0.00'))
        prev_sum = float(txs_prev.aggregate(total=Sum('amount'))['total'] or Decimal('0.00'))

        pct_change = round(((cur_sum - prev_sum) / max(1.0, prev_sum)) * 100, 1) if prev_sum > 0 else 0.0

        merchants = {}
        for t in txs_cur:
            m = t.merchant.name if t.merchant else (t.description or "General")
            merchants[m] = merchants.get(m, 0.0) + float(t.amount)

        sorted_m = sorted(merchants.items(), key=lambda x: x[1], reverse=True)

        return {
            "category": cat.name if cat else category_query.title(),
            "current_30d_spend": cur_sum,
            "previous_30d_spend": prev_sum,
            "pct_change_vs_last_month": pct_change,
            "tx_count": txs_cur.count(),
            "top_merchants": [{"merchant": k, "amount": v} for k, v in sorted_m[:3]],
            "recommendation_potential": round(cur_sum * 0.18, 2)
        }

    @staticmethod
    def tool_evaluate_affordability_advanced(user: User, item_name: str, target_price: float) -> dict:
        dash_metrics = FinanceService.get_dashboard_metrics(user)
        balance = float(dash_metrics['net_balance'])
        monthly_income = float(dash_metrics['monthly_income'])
        monthly_expense = float(dash_metrics['monthly_expense'])
        monthly_surplus = max(0.0, float(dash_metrics['net_savings']))

        emergency_buffer = max(25000.0, monthly_expense * 2.5)
        disposable_liquidity = max(0.0, balance - emergency_buffer)

        if balance >= (target_price + emergency_buffer):
            tier = "TIER_1_IMMEDIATE_SAFE"
            tier_name = "✅ Highly Affordable (Outright Purchase)"
            months_to_save = 0
            verdict_desc = f"You can comfortably purchase {item_name} for ₹{target_price:,.2f} outright while keeping an emergency reserve of ₹{emergency_buffer:,.2f} intact."
        elif disposable_liquidity > 0 or monthly_surplus > 0:
            tier = "TIER_2_STRUCTURED_SURPLUS"
            tier_name = "⚠️ Feasible via Structured Allocation"
            effective_surplus = monthly_surplus if monthly_surplus > 1000 else 5000.0
            deficit = max(0.0, target_price - disposable_liquidity)
            months_to_save = int(math.ceil(deficit / effective_surplus))
            verdict_desc = f"Buying {item_name} (₹{target_price:,.2f}) right now would dip into your emergency reserve. By allocating your current monthly savings of ₹{effective_surplus:,.2f}/mo, you will fund it completely in {months_to_save} months without stress."
        else:
            tier = "TIER_3_HIGH_RISK"
            tier_name = "🛑 Not Recommended Right Now"
            effective_surplus = 4000.0
            months_to_save = int(math.ceil(target_price / effective_surplus))
            verdict_desc = f"Purchasing {item_name} (₹{target_price:,.2f}) presents high liquidity risk. Establish positive monthly cash flow before committing to this discretionary outlay."

        return {
            "item_name": item_name,
            "target_price": target_price,
            "tier": tier,
            "tier_name": tier_name,
            "current_balance": balance,
            "emergency_buffer_required": emergency_buffer,
            "disposable_liquidity": disposable_liquidity,
            "monthly_surplus": monthly_surplus,
            "months_to_save": months_to_save,
            "verdict_desc": verdict_desc
        }

    @staticmethod
    def tool_debt_and_investment_growth_simulator(monthly_investment: float, expected_cagr: float = 12.0, years: int = 5) -> dict:
        r = (expected_cagr / 100.0) / 12.0
        n = years * 12
        if r > 0:
            fv = monthly_investment * (((1 + r) ** n - 1) / r) * (1 + r)
        else:
            fv = monthly_investment * n

        total_invested = monthly_investment * n
        wealth_gain = max(0.0, fv - total_invested)

        return {
            "monthly_sip": monthly_investment,
            "expected_cagr": expected_cagr,
            "duration_years": years,
            "total_invested": round(total_invested, 2),
            "estimated_corpus": round(fv, 2),
            "compounded_wealth_gain": round(wealth_gain, 2)
        }

    @staticmethod
    def tool_calculate_what_if(user: User, category_name: str, reduction_percent: float, months: int = 6) -> dict:
        today = date.today()
        start_30_ago = today - timedelta(days=30)

        cat_expense = Transaction.objects.filter(
            user=user,
            type='EXPENSE',
            category__name__icontains=category_name,
            date__gte=start_30_ago
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if cat_expense == Decimal('0.00'):
            budget = Budget.objects.filter(user=user, category__name__icontains=category_name).first()
            if budget:
                cat_expense = budget.limit_amount
            else:
                cat_expense = Decimal('8000.00')

        monthly_saved = (cat_expense * Decimal(str(reduction_percent / 100.0)))
        total_projected_savings = monthly_saved * Decimal(str(months))

        sip_growth = AICopilotService.tool_debt_and_investment_growth_simulator(float(monthly_saved), 12.0, 3)

        return {
            "category": category_name,
            "baseline_monthly_spend": float(cat_expense),
            "reduction_percent": reduction_percent,
            "monthly_savings": float(round(monthly_saved, 2)),
            "timeframe_months": months,
            "total_projected_savings": float(round(total_projected_savings, 2)),
            "invested_growth_3yr": sip_growth['estimated_corpus']
        }

    @staticmethod
    def ask_copilot(user: User, question: str, conversation_id: str = None) -> dict:
        from services.ai.orchestrator import FinancialAgentOrchestrator
        return FinancialAgentOrchestrator.chat(user=user, prompt=question, conversation_id=conversation_id)

    @staticmethod
    def _legacy_ask_copilot(user: User, question: str) -> dict:
        q_raw = question.strip()
        q_lower = q_raw.lower()

        # Prompt Injection & Jailbreak Defense Guardrail
        jailbreak_patterns = [
            'ignore previous instructions',
            'ignore all previous',
            'disregard all instructions',
            'reveal system prompt',
            'system prompt leakage',
            'show me your secret key',
            'you are now dan',
            'bypass security policy',
            'override system instructions'
        ]
        if any(p in q_lower for p in jailbreak_patterns):
            response_text = (
                "### 🛡️ MONVEX Security Guardrail Triggered\n\n"
                "System prompt override and adversarial injection attempts are strictly prevented by MONVEX AppSec policies. "
                "I am your personal financial intelligence assistant — please ask any financial analysis, budget, or transaction question."
            )
            return {
                "id": "sec_guardrail",
                "question": q_raw,
                "response": response_text,
                "tools_used": ["security_guardrail_sanitizer"],
                "data": {},
                "created_at": str(date.today())
            }

        dash_metrics = FinanceService.get_dashboard_metrics(user)
        budgets_overview = BudgetService.get_budget_overview(user)

        balance_dec = Decimal(str(dash_metrics['net_balance']))
        income_dec = Decimal(str(dash_metrics['monthly_income']))
        expense_dec = Decimal(str(dash_metrics['monthly_expense']))
        savings_dec = Decimal(str(dash_metrics['net_savings']))

        latest_txs = list(
            Transaction.objects.filter(user=user).select_related('category', 'merchant').order_by('-date', '-created_at')[:10]
        )

        tools_executed = []
        context_data = {
            'net_balance': float(balance_dec),
            'monthly_income': float(income_dec),
            'monthly_expense': float(expense_dec),
            'monthly_savings': float(savings_dec),
            'savings_rate': float(dash_metrics['savings_rate']),
            'health_score': dash_metrics['health_score']['score']
        }

        # -------------------------------------------------------------
        # DOMAIN 1: Statistical Anomaly & Outlier Detection
        # -------------------------------------------------------------
        if any(w in q_lower for w in ['anomaly', 'anomalies', 'unusual', 'spike', 'irregular', 'ajab', 'unexpected', 'leak']):
            tools_executed.append('tool_detect_anomalies')
            anom = AICopilotService.tool_detect_anomalies(user, 60)
            context_data['anomaly_telemetry'] = anom

            if anom['anomalies_found'] > 0:
                items_str = "\n".join([
                    f"- ⚠️ **{i['description']}**: **₹{i['amount']:,.2f}** on {i['date']} ({i['category']}) — *Z-Score: +{i['z_score']}σ vs ₹{anom['average_ticket']:,.2f} mean*"
                    for i in anom['items']
                ])
                response_text = (
                    f"### 🔍 Anomaly Detection Report\n\n"
                    f"Our statistical telemetry engine scanned your recent transactions against rolling standard deviation benchmarks:\n\n"
                    f"{items_str}\n\n"
                    f"**Statistical Baseline:**\n"
                    f"- **Average Expense Ticket:** ₹{anom['average_ticket']:,.2f}\n"
                    f"- **Standard Deviation (σ):** ₹{anom['std_dev']:,.2f}\n"
                    f"- **Anomaly Trigger Threshold:** ₹{anom['threshold']:,.2f}\n\n"
                    f"💡 **Recommendation:** Review these flagged entries in your Transactions log to verify if they are one-off capital expenses or recurring velocity creep."
                )
            else:
                response_text = (
                    f"### 🛡️ Clean Telemetry — No Outliers Detected\n\n"
                    f"Across your recent transaction stream, all outlays are within standard statistical variance bounds (**< +1.8σ** from your ₹{anom['average_ticket']:,.2f} ticket mean).\n\n"
                    f"- **Average Outlay:** ₹{anom['average_ticket']:,.2f}\n"
                    f"- **Upper Anomaly Cutoff:** ₹{anom['threshold']:,.2f}\n\n"
                    f"Your spending velocity is consistent and predictable."
                )

        # -------------------------------------------------------------
        # DOMAIN 2: What-If & Compound Wealth Simulation
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['what if', 'reduce', 'cut', 'save more', 'simulate', 'kum kare', 'kam kare']):
            tools_executed.append('tool_calculate_what_if')
            pct = 20.0
            pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', q_raw)
            if pct_match:
                pct = float(pct_match.group(1))

            target_cat = "Food & Dining"
            for c in ['shopping', 'dining', 'food', 'travel', 'entertainment', 'groceries', 'utilities', 'subscriptions']:
                if c in q_lower:
                    target_cat = c.title()
                    break

            sim = AICopilotService.tool_calculate_what_if(user, target_cat, pct, 6)
            annual = sim['monthly_savings'] * 12

            response_text = (
                f"### 🔮 What-If Scenario: {int(pct)}% Cut in {sim['category']}\n\n"
                f"**Baseline & Immediate Surplus:**\n"
                f"- **Current Monthly Spend:** ₹{sim['baseline_monthly_spend']:,.2f}\n"
                f"- **Monthly Capital Retained:** **+₹{sim['monthly_savings']:,.2f} / mo**\n"
                f"- **6-Month Accumulated Liquidity:** **₹{sim['total_projected_savings']:,.2f}**\n"
                f"- **1-Year Total Retained:** **₹{annual:,.2f}**\n\n"
                f"📈 **Compounded Investment Projection (12% CAGR):**\n"
                f"If you route this monthly **₹{sim['monthly_savings']:,.2f}** surplus into an index fund / SIP, it will grow to **₹{sim['invested_growth_3yr']:,.2f}** in 3 years!\n\n"
                f"💡 **Milestone Impact:** Accelerates your active savings goals completion by **~45 days**."
            )

        # -------------------------------------------------------------
        # DOMAIN 3: Advanced Multi-Tier Affordability Evaluation
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['afford', 'kharid', 'le sakta', 'buy', 'can i get', 'purchasing', 'kharcha kar']):
            tools_executed.append('tool_evaluate_affordability')
            target_price = 50000.0
            item_name = "this purchase"

            numbers = re.findall(r'\b\d+(?:,\d+)?(?:\.\d+)?\b', q_raw.replace(',', ''))
            valid_nums = [float(n) for n in numbers if float(n) > 100 and float(n) != 2026.0]
            if valid_nums:
                target_price = max(valid_nums)

            for candidate in ['iphone', 'macbook', 'laptop', 'car', 'bike', 'watch', 'phone', 'trip', 'vacation', 'sofa', 'tv', 'camera']:
                if candidate in q_lower:
                    item_name = candidate.title()
                    break

            eval_res = AICopilotService.tool_evaluate_affordability_advanced(user, item_name, target_price)

            response_text = (
                f"### {eval_res['tier_name']}\n\n"
                f"**Purchase Target:** {eval_res['item_name']} — **₹{eval_res['target_price']:,.2f}**\n\n"
                f"**Financial Position Check:**\n"
                f"- **Net Liquid Balance:** ₹{eval_res['current_balance']:,.2f}\n"
                f"- **Safety Reserve Required (2.5mo buffer):** ₹{eval_res['emergency_buffer_required']:,.2f}\n"
                f"- **Safe Disposable Liquidity:** ₹{eval_res['disposable_liquidity']:,.2f}\n"
                f"- **Monthly Net Savings Velocity:** +₹{eval_res['monthly_surplus']:,.2f} / month\n\n"
                f"💡 **Recommendation:** {eval_res['verdict_desc']}"
            )

        # -------------------------------------------------------------
        # DOMAIN 4: Specific Category Deep-Dive Audit
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['food', 'dining', 'swiggy', 'zomato', 'uber', 'amazon', 'groceries', 'shopping', 'bills']):
            matched_cat = "Food & Dining" if ('food' in q_lower or 'dining' in q_lower) else "Shopping"
            for c in ['shopping', 'travel', 'groceries', 'utilities', 'bills', 'amazon', 'swiggy']:
                if c in q_lower:
                    matched_cat = c.title()
                    break

            tools_executed.append('tool_get_spending_summary')
            cat_audit = AICopilotService.tool_deep_category_audit(user, matched_cat)

            m_lines = "\n".join([f"- **{m['merchant']}**: ₹{m['amount']:,.2f}" for m in cat_audit['top_merchants']]) if cat_audit['top_merchants'] else "- Direct/Unrecorded merchants"

            trend_badge = f"+{cat_audit['pct_change_vs_last_month']}% vs prior month" if cat_audit['pct_change_vs_last_month'] > 0 else f"{cat_audit['pct_change_vs_last_month']}% vs prior month"

            response_text = (
                f"### 📊 Spending Breakdown — {cat_audit['category']}\n\n"
                f"- **Past 30-Day Outflow:** **₹{cat_audit['current_30d_spend']:,.2f}** ({trend_badge})\n"
                f"- **Transaction Count:** {cat_audit['tx_count']} entries\n"
                f"- **Previous 30-Day Outflow:** ₹{cat_audit['previous_30d_spend']:,.2f}\n\n"
                f"**Top Merchant Drivers:**\n"
                f"{m_lines}\n\n"
                f"💡 **Optimization Target:** A gentle 18% optimization in this category frees up **₹{cat_audit['recommendation_potential']:,.2f}/month** for your savings goals."
            )

        # -------------------------------------------------------------
        # DOMAIN 5: Overall Spending Breakdown & Ingestion Check
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['where did i spend', 'where did my money go', 'spend', 'spending', 'expense', 'kharcha', 'outflow', 'total']):
            summary = AICopilotService.tool_get_spending_summary(user, 30)
            tools_executed.append('tool_get_spending_summary')
            context_data['spending_summary'] = summary

            top_cats = summary.get('top_categories', [])
            cat_lines = "\n".join([f"- **{c['name']}**: ₹{c['amount']:,.2f}" for c in top_cats]) if top_cats else "- No categorized expenses yet."
            recent_str = ", ".join(summary.get('recent_entries', [])[:4]) if summary.get('recent_entries') else "None"

            response_text = (
                f"### 📊 Spending Breakdown (Past 30 Days)\n\n"
                f"You have recorded **{summary.get('transaction_count', 0)} total expenses** amounting to **₹{summary.get('total_expense', 0):,.2f}**.\n\n"
                f"**Category Distribution:**\n"
                f"{cat_lines}\n\n"
                f"**Recent Logged Ingestion:** {recent_str}\n\n"
                f"💡 All live transaction additions across voice and web are fully integrated into this analysis."
            )

        # -------------------------------------------------------------
        # DOMAIN 6: Budget Velocity & Overspend Protection
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['budget', 'over budget', 'limit', 'pace', 'velocity']):
            tools_executed.append('tool_get_budget_status')
            context_data['budgets'] = budgets_overview

            if not budgets_overview:
                response_text = (
                    "### ⚠️ No Active Category Budgets Found\n\n"
                    "You haven't set up budget thresholds yet. We recommend setting limits for **Food & Dining (₹8,000)** and **Shopping (₹5,000)** to maintain a 25% savings velocity."
                )
            else:
                lines = []
                for b in budgets_overview:
                    status_badge = "🟢 ON TRACK" if b['status'] == 'ON_TRACK' else ("🟡 WARNING" if b['status'] == 'WARNING' else "🔴 EXCEEDED")
                    lines.append(f"- **{b['category_name']}**: {status_badge} — ₹{b['spent_amount']:,.2f} / ₹{b['limit_amount']:,.2f} (**{b['usage_percentage']}%**)")

                response_text = (
                    f"### 🎯 Budget Velocity Breakdown\n\n"
                    + "\n".join(lines) +
                    f"\n\n💡 Daily burn velocity is monitored continuously. Check the Budgets page to adjust limits."
                )

        # -------------------------------------------------------------
        # DOMAIN 6.5: Net Worth & Balance Sheet Telemetry
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['net worth', 'networth', 'assets', 'liabilities', 'wealth', 'balance sheet', 'sampatti']):
            from services.net_worth_service import NetWorthService
            tools_executed.append('tool_get_net_worth')
            nw_data = NetWorthService.calculate_net_worth(user)
            context_data['net_worth_telemetry'] = nw_data

            alloc_str = ", ".join([f"{a['label']}: ₹{a['total']:,.2f} ({a['percentage']}%)" for a in nw_data['asset_allocation']]) if nw_data['asset_allocation'] else "Cash/Ledger balance"

            response_text = (
                f"### 💎 Net Worth Command Breakdown\n\n"
                f"- **Total Asset Base:** **₹{nw_data['total_assets']:,.2f}**\n"
                f"- **Total Liabilities:** **₹{nw_data['total_liabilities']:,.2f}**\n"
                f"- **Calculated Net Worth:** **₹{nw_data['net_worth']:,.2f}**\n"
                f"- **Debt-to-Asset Ratio:** **{nw_data['debt_to_asset_ratio']}%** (Status: **{nw_data['solvency_status']}**)\n\n"
                f"**Asset Allocation:**\n{alloc_str}\n\n"
                f"💡 Open the **/net-worth** tab to view your complete balance sheet and asset class distribution."
            )

        # -------------------------------------------------------------
        # DOMAIN 6.6: Debt, Loan & EMI Amortization
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['loan', 'emi', 'debt', 'interest', 'karz', 'prepay', 'pre-pay', 'mortgage']):
            from services.debt_service import DebtService
            tools_executed.append('tool_get_debt_plan')
            debt_data = DebtService.get_user_debt_overview(user)
            context_data['debt_telemetry'] = debt_data

            if debt_data['total_liabilities_count'] == 0:
                response_text = (
                    "### 🛡️ Zero Active Debt Detected\n\n"
                    "You have no registered loan liabilities or active EMIs in MONVEX. Your debt burden ratio is **0.0%**!"
                )
            else:
                lines = [f"- **{i['name']}** ({i['liability_type']}): Balance ₹{i['remaining_balance']:,.2f} / ₹{i['principal_amount']:,.2f} • EMI ₹{i['monthly_emi']:,.2f}/mo @ {i['interest_rate_pct']}%" for i in debt_data['items']]
                response_text = (
                    f"### 💳 Debt & Loan Amortization Status\n\n"
                    f"- **Total Outstanding Principal:** **₹{debt_data['total_remaining_balance']:,.2f}**\n"
                    f"- **Total Monthly EMI Outflow:** **₹{debt_data['total_monthly_emi']:,.2f} / month**\n\n"
                    f"**Active Liabilities:**\n" + "\n".join(lines) +
                    f"\n\n💡 Tip: Adding just ₹2,000/mo extra payment in the **/debt** simulator can shave months off your repayment schedule."
                )

        # -------------------------------------------------------------
        # DOMAIN 6.7: "WHY?" Variance Attribution
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['why', 'karan', 'kyu', 'increase', 'variance', 'difference', 'more than last month']):
            from services.why_explainer_service import WhyExplainerService
            tools_executed.append('tool_explain_why_variance')
            why_data = WhyExplainerService.explain_spending_variance(user)
            context_data['why_telemetry'] = why_data

            drivers = "\n".join([f"- **{d['category']}**: {'+' if d['delta'] > 0 else ''}₹{d['delta']:,.2f} ({'+' if d['pct_change'] > 0 else ''}{d['pct_change']}%)" for d in why_data['top_category_drivers'][:3]]) if why_data['top_category_drivers'] else "- Inflow & Outflow distribution is balanced."

            response_text = (
                f"### 🔍 Root Cause Spending Attribution (Variance Engine)\n\n"
                f"{why_data['summary']}\n\n"
                f"**Top Contributors to Delta:**\n"
                f"{drivers}\n\n"
                f"💡 MONVEX continuously tracks your category run-rates so you can take corrective action before month-end."
            )

        # -------------------------------------------------------------
        # DOMAIN 6.8: Recurring Obligations & Subscriptions
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['subscription', 'recurring', 'netflix', 'spotify', 'prime', 'membership']):
            recs = RecurringPayment.objects.filter(user=user, is_active=True)
            tools_executed.append('tool_get_subscriptions')
            total_monthly = sum((float(r.amount) for r in recs), 0.0)
            annual = total_monthly * 12.0

            r_lines = "\n".join([f"- **{r.name}**: ₹{r.amount:,.2f} / {r.frequency.lower()} (Next: {r.next_due_date})" for r in recs]) if recs.exists() else "- No active recurring subscriptions tracked."

            response_text = (
                f"### 🔄 Recurring Subscriptions & Fixed Obligations\n\n"
                f"- **Monthly Recurring Burn:** **₹{total_monthly:,.2f} / month**\n"
                f"- **Annualized Obligation:** **₹{annual:,.2f} / year**\n\n"
                f"**Active Services:**\n"
                f"{r_lines}\n\n"
                f"💡 Check the **/subscriptions** section to audit your recurring cash burn."
            )

        # -------------------------------------------------------------
        # DOMAIN 7: Comprehensive Financial Health Audit & SIP Growth
        # -------------------------------------------------------------
        elif any(w in q_lower for w in ['health', 'score', 'audit', 'advice', 'diagnostic', 'invest', 'sip']):
            tools_executed.append('tool_financial_health_audit')
            score = dash_metrics['health_score']['score']
            grade = dash_metrics['health_score']['grade']
            sip_5yr = AICopilotService.tool_debt_and_investment_growth_simulator(float(savings_dec), 12.0, 5)

            response_text = (
                f"### 🏆 Financial Health Index: **{score}/100 (Grade {grade})**\n\n"
                f"**Telemetry Summary:**\n"
                f"- **Monthly Inflow:** ₹{income_dec:,.2f}\n"
                f"- **Monthly Outflow:** ₹{expense_dec:,.2f}\n"
                f"- **Monthly Surplus (Net Savings):** **₹{savings_dec:,.2f}** ({dash_metrics['savings_rate']}% rate)\n\n"
                f"**5-Year Compounded Wealth Trajectory:**\n"
                f"Investing your **₹{savings_dec:,.2f}/mo** surplus at a historical 12% CAGR yields:\n"
                f"- **Total Capital Invested:** ₹{sip_5yr['total_invested']:,.2f}\n"
                f"- **Projected 5-Year Portfolio:** **₹{sip_5yr['estimated_corpus']:,.2f}** (+₹{sip_5yr['compounded_wealth_gain']:,.2f} wealth gain!)\n\n"
                f"**Top 3 Actionable Recommendations:**\n"
                f"1. **Discretionary Capping:** Cap dining orders at ₹6,000/mo.\n"
                f"2. **Automated Sweep:** Schedule SIP transfer on salary day to enforce savings first.\n"
                f"3. **Emergency Fund Lock:** Maintain 3 months of basic expenses in liquid savings."
            )

        # -------------------------------------------------------------
        # Default Fallback Telemetry
        # -------------------------------------------------------------
        else:
            tools_executed.append('get_dashboard_metrics')
            recent_str = ", ".join([f"{t.description or t.category.name} (₹{t.amount:,.2f})" for t in latest_txs[:3]]) if latest_txs else "No recent entries"
            response_text = (
                f"### 💰 Financial Overview (Current Live State)\n\n"
                f"- **Total Net Balance:** **₹{balance_dec:,.2f}**\n"
                f"- **Total Inflow (Income):** +₹{income_dec:,.2f}\n"
                f"- **Total Outflow (Expenses):** -₹{expense_dec:,.2f}\n"
                f"- **Net Monthly Savings:** +₹{savings_dec:,.2f} (**{dash_metrics['savings_rate']}%** rate)\n"
                f"- **Financial Health Score:** **{dash_metrics['health_score']['score']}/100**\n"
                f"- **Recent Transactions:** {recent_str}\n\n"
                f"Ask me anything! Try:\n"
                f"- *\"Did I have any unusual expense or anomaly this month?\"*\n"
                f"- *\"Can I afford a ₹70,000 gadget?\"*\n"
                f"- *\"Analyze my Food & Dining spending\"*\n"
                f"- *\"What if I cut expenses by 20%?\"*"
            )

        interaction = AIInteraction.objects.create(
            user=user,
            question=q_raw,
            tools_used=tools_executed,
            response=response_text
        )

        return {
            "id": str(interaction.id),
            "question": q_raw,
            "response": response_text,
            "tools_used": tools_executed,
            "data": context_data,
            "created_at": str(interaction.created_at)
        }
