"""
MONVEX Universal Search Service
Centralized, user-scoped multi-entity search across financial transactions, assets/accounts,
budgets, goals, AI conversation sessions, and system navigation commands.
"""
from typing import Dict, Any, List
from django.db.models import Q
from apps.transactions.models import Transaction, Asset, Merchant
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from apps.ai_copilot.models import ConversationSession


class SearchService:
    NAVIGATION_COMMANDS = [
        {
            "id": "nav-dashboard",
            "type": "navigation",
            "title": "Command Dashboard",
            "subtitle": "High-level liquidity, health score & cash flow",
            "destination": "/dashboard",
            "keywords": ["dashboard", "home", "overview", "command", "health", "net worth"]
        },
        {
            "id": "nav-transactions",
            "type": "navigation",
            "title": "Transactions Ledger",
            "subtitle": "Full categorized transaction history & search",
            "destination": "/transactions",
            "keywords": ["transactions", "ledger", "expenses", "income", "history", "records", "csv"]
        },
        {
            "id": "nav-accounts",
            "type": "navigation",
            "title": "Accounts & Net Worth",
            "subtitle": "Bank balances, liquid savings & asset positions",
            "destination": "/accounts",
            "keywords": ["accounts", "wallets", "banks", "cards", "checking", "savings", "balance", "net worth"]
        },
        {
            "id": "nav-budgets",
            "type": "navigation",
            "title": "Budgets & Spending Limits",
            "subtitle": "Category limits, monthly allocations & alerts",
            "destination": "/budgets",
            "keywords": ["budgets", "limits", "caps", "categories", "spending limit", "allocation"]
        },
        {
            "id": "nav-goals",
            "type": "navigation",
            "title": "Savings Goals & Milestones",
            "subtitle": "Track emergency funds, vacations & investments",
            "destination": "/goals",
            "keywords": ["goals", "savings", "targets", "emergency fund", "milestones", "commitments"]
        },
        {
            "id": "nav-analytics",
            "type": "navigation",
            "title": "Financial Analytics & Trends",
            "subtitle": "Income vs expense ratios & category breakdowns",
            "destination": "/analytics",
            "keywords": ["analytics", "trends", "reports", "insights", "breakdown", "charts", "velocity"]
        },
        {
            "id": "nav-forecast",
            "type": "navigation",
            "title": "Predictive Cash Flow Forecast",
            "subtitle": "30, 60 & 90 day balance and runway projections",
            "destination": "/forecast",
            "keywords": ["forecast", "projections", "runway", "cash flow", "future", "simulation"]
        },
        {
            "id": "nav-net-worth",
            "type": "navigation",
            "title": "Net Worth & Balance Sheet",
            "subtitle": "Consolidated liquid assets vs liabilities & loans",
            "destination": "/net-worth",
            "keywords": ["net worth", "assets", "liabilities", "loans", "balance sheet", "solvency"]
        },
        {
            "id": "nav-debt",
            "type": "navigation",
            "title": "Debt & Loan Amortization Planner",
            "subtitle": "Payoff accelerator & interest reduction simulator",
            "destination": "/debt",
            "keywords": ["debt", "loans", "emi", "prepayment", "amortization", "interest", "mortgage"]
        },
        {
            "id": "nav-subscriptions",
            "type": "navigation",
            "title": "Recurring Subscriptions & Bills",
            "subtitle": "Active subscriptions and annualized cash commitments",
            "destination": "/subscriptions",
            "keywords": ["subscriptions", "recurring", "bills", "spotify", "netflix", "annualized"]
        },
        {
            "id": "nav-simulator",
            "type": "navigation",
            "title": "What-If Scenario Simulator",
            "subtitle": "Simulate expense cuts, raises & 5-year compounding",
            "destination": "/simulator",
            "keywords": ["simulator", "what if", "scenario", "compounding", "sip", "affordability"]
        },
        {
            "id": "nav-receipts",
            "type": "navigation",
            "title": "Receipt Intelligence Studio",
            "subtitle": "Upload receipts and review AI-extracted line items",
            "destination": "/receipts",
            "keywords": ["receipts", "ocr", "upload", "bills", "scan", "line items"]
        },
        {
            "id": "nav-ai",
            "type": "navigation",
            "title": "MONVEX Financial AI Copilot",
            "subtitle": "Deterministic financial reasoning & decision agent",
            "destination": "/ai",
            "keywords": ["ai", "copilot", "chat", "intelligence", "ask", "agent", "gemini"]
        },
        {
            "id": "nav-security",
            "type": "navigation",
            "title": "Security & Access Center",
            "subtitle": "Zero-trust shields, active sessions & audit logs",
            "destination": "/security",
            "keywords": ["security", "audit", "sessions", "devices", "waf", "logs", "panic", "revoke"]
        },
        {
            "id": "nav-settings",
            "type": "navigation",
            "title": "Account Settings & Preferences",
            "subtitle": "Profile avatar, currency, data exports & themes",
            "destination": "/settings",
            "keywords": ["settings", "preferences", "profile", "currency", "export", "csv", "json", "avatar"]
        },
    ]

    @classmethod
    def search(cls, user, query: str = "", limit: int = 5) -> Dict[str, Any]:
        """
        Execute unified, user-scoped search across all core entities.
        Ensures strict tenant isolation by scoping all queries to request.user.
        """
        q = (query or "").strip()
        limit = max(1, min(int(limit), 20))  # Bound limit between 1 and 20

        results = {
            "transactions": [],
            "accounts": [],
            "budgets": [],
            "goals": [],
            "conversations": [],
            "navigation": []
        }

        # 1. Navigation Commands (Keyword Matched)
        if q:
            q_lower = q.lower()
            matched_nav = []
            for nav in cls.NAVIGATION_COMMANDS:
                if (q_lower in nav["title"].lower() or 
                    q_lower in nav["subtitle"].lower() or 
                    any(q_lower in kw for kw in nav["keywords"])):
                    matched_nav.append({
                        "id": nav["id"],
                        "type": "navigation",
                        "title": nav["title"],
                        "subtitle": nav["subtitle"],
                        "destination": nav["destination"],
                        "badge": "COMMAND"
                    })
            results["navigation"] = matched_nav[:limit]
        else:
            # Default top navigation suggestions when empty
            results["navigation"] = [
                {
                    "id": nav["id"],
                    "type": "navigation",
                    "title": nav["title"],
                    "subtitle": nav["subtitle"],
                    "destination": nav["destination"],
                    "badge": "COMMAND"
                } for nav in cls.NAVIGATION_COMMANDS[:limit]
            ]

        # 2. Transactions Search (User-Scoped)
        tx_qs = Transaction.objects.filter(user=user).select_related('category', 'merchant')
        if q:
            tx_qs = tx_qs.filter(
                Q(merchant__name__icontains=q) |
                Q(description__icontains=q) |
                Q(category__name__icontains=q)
            )
        tx_list = tx_qs.order_by('-date', '-created_at')[:limit]
        for tx in tx_list:
            cat_name = tx.category.name if tx.category else "Uncategorized"
            m_name = tx.merchant.name if tx.merchant else (tx.description or f"Transaction on {tx.date}")
            results["transactions"].append({
                "id": str(tx.id),
                "type": "transaction",
                "title": m_name,
                "subtitle": f"{cat_name} · {tx.date.strftime('%b %d, %Y') if tx.date else ''}",
                "amount": float(tx.amount),
                "badge": tx.type,
                "destination": "/transactions",
                "date": tx.date.isoformat() if tx.date else None
            })

        # 3. Assets & Accounts (User-Scoped)
        acc_qs = Asset.objects.filter(user=user)
        if q:
            acc_qs = acc_qs.filter(
                Q(name__icontains=q) |
                Q(institution__icontains=q) |
                Q(asset_type__icontains=q)
            )
        acc_list = acc_qs.order_by('-created_at')[:limit]
        for acc in acc_list:
            results["accounts"].append({
                "id": str(acc.id),
                "type": "account",
                "title": acc.name,
                "subtitle": f"{acc.institution or 'Liquid Asset'} · {acc.asset_type.replace('_', ' ').title()}",
                "amount": float(acc.value),
                "badge": acc.asset_type,
                "destination": "/accounts"
            })

        # 4. Budgets (User-Scoped)
        bg_qs = Budget.objects.filter(user=user, is_active=True).select_related('category')
        if q:
            bg_qs = bg_qs.filter(
                Q(category__name__icontains=q)
            )
        bg_list = bg_qs.order_by('-created_at')[:limit]
        for bg in bg_list:
            cat_name = bg.category.name if bg.category else "Category"
            results["budgets"].append({
                "id": str(bg.id),
                "type": "budget",
                "title": f"{cat_name} Budget",
                "subtitle": f"Limit: ₹{float(bg.limit_amount):,.2f} ({bg.period.capitalize()})",
                "amount": float(bg.limit_amount),
                "badge": bg.period,
                "destination": "/budgets"
            })

        # 5. Goals (User-Scoped)
        goal_qs = SavingsGoal.objects.filter(user=user)
        if q:
            goal_qs = goal_qs.filter(Q(title__icontains=q))
        goal_list = goal_qs.order_by('-created_at')[:limit]
        for g in goal_list:
            pct = int((float(g.current_amount) / float(g.target_amount) * 100)) if g.target_amount > 0 else 0
            results["goals"].append({
                "id": str(g.id),
                "type": "goal",
                "title": g.title,
                "subtitle": f"₹{float(g.current_amount):,.0f} of ₹{float(g.target_amount):,.0f} ({pct}% reached)",
                "amount": float(g.target_amount),
                "badge": g.status,
                "destination": "/goals"
            })

        # 6. AI Conversation Sessions (User-Scoped)
        conv_qs = ConversationSession.objects.filter(user=user)
        if q:
            conv_qs = conv_qs.filter(Q(title__icontains=q))
        conv_list = conv_qs.order_by('-updated_at')[:limit]
        for conv in conv_list:
            results["conversations"].append({
                "id": str(conv.id),
                "type": "conversation",
                "title": conv.title,
                "subtitle": f"AI Session · {conv.updated_at.strftime('%b %d, %Y')}",
                "badge": "AI CHAT",
                "destination": f"/ai?session={conv.id}"
            })

        total = sum(len(v) for v in results.values())

        return {
            "success": True,
            "query": q,
            "results": results,
            "total": total
        }
