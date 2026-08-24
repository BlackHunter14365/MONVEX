"""
MONVEX Google GenAI SDK Client & Function Calling Dispatcher
Official Google GenAI SDK (@google/genai & google-genai) Integration
"""
import os
import logging
from typing import List, Dict, Any, Tuple
from django.conf import settings
from django.contrib.auth.models import User
from .tools import MONVEXTools

logger = logging.getLogger(__name__)

# Try importing official Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None
    types = None

class GeminiClient:
    """
    Client managing communication with Gemini models via the official Google GenAI SDK.
    Enforces function calling, tool execution loops, search grounding, and security boundaries.
    """

    SYSTEM_INSTRUCTION = """You are MONVEX Financial Intelligence, an elite autonomous financial reasoning agent.
You are assisting the currently authenticated user in managing their personal finances, cash flow, investments, budgets, and wealth goals.

CRITICAL RULES:
1. ALWAYS use the provided MONVEX tools to fetch actual user financial data. NEVER invent, hallucinate, or guess numbers, transactions, balances, or budget limits.
2. If a tool returns zero records or empty accounts, state clearly that no accounts or transactions are recorded yet. Do NOT use fake demo data.
3. Clearly distinguish:
   - FACTS (Directly from verified ledger / accounts)
   - CALCULATIONS (Computed cash flows, savings rates, health metrics)
   - FORECASTS (Estimated future projections based on run-rates)
   - RECOMMENDATIONS (Actionable financial advice and optimization strategies)
4. For general financial education (e.g. compound interest, SIP, inflation), explain clearly and concisely without needing user data.
5. For public real-time market queries (e.g. current USD/INR rate, gold price, RBI repo rate), use Google Search grounding. NEVER send private user transactions to search.
6. Present currency formatted in Indian Rupees (₹) by default, using standard Indian numbering (e.g. ₹1,50,000).
7. Keep tone professional, analytical, direct, and encouraging.
"""

    @classmethod
    def get_api_key(cls) -> str:
        return getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY', '')

    @classmethod
    def get_model_name(cls) -> str:
        return getattr(settings, 'MONVEX_AI_MODEL', None) or os.environ.get('MONVEX_AI_MODEL', 'gemini-2.0-flash')

    @classmethod
    def is_configured(cls) -> bool:
        return GENAI_AVAILABLE and bool(cls.get_api_key())

    @classmethod
    def build_tool_declarations(cls) -> list:
        """
        Builds Gemini Function Declarations for MONVEX tools.
        """
        if not GENAI_AVAILABLE:
            return []

        tool_defs = [
            types.FunctionDeclaration(
                name="get_transactions",
                description="Retrieve user transactions filtered by date range, category, type (INCOME/EXPENSE/TRANSFER), or merchant.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "start_date": {"type": "STRING", "description": "ISO date YYYY-MM-DD"},
                        "end_date": {"type": "STRING", "description": "ISO date YYYY-MM-DD"},
                        "category": {"type": "STRING", "description": "Category name filter"},
                        "type": {"type": "STRING", "description": "INCOME, EXPENSE, or TRANSFER"},
                        "merchant": {"type": "STRING", "description": "Merchant name filter"},
                        "limit": {"type": "INTEGER", "description": "Max results to return (default 20)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="get_transaction_summary",
                description="Get aggregated income, expenses, net savings, top categories, and top merchants for a rolling period.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "period_days": {"type": "INTEGER", "description": "Number of lookback days (default 30)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="search_transactions",
                description="Search user transactions by merchant, description, or amount range.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "query": {"type": "STRING", "description": "Search keyword or merchant"},
                        "min_amount": {"type": "NUMBER", "description": "Minimum transaction amount"},
                        "max_amount": {"type": "NUMBER", "description": "Maximum transaction amount"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="get_accounts",
                description="Retrieve user's verified bank accounts, cards, and liquid wallets with balances.",
                parameters={"type": "OBJECT", "properties": {}}
            ),
            types.FunctionDeclaration(
                name="get_budgets",
                description="Retrieve active category budgets, spending progress, remaining allowances, and utilization percentages.",
                parameters={"type": "OBJECT", "properties": {}}
            ),
            types.FunctionDeclaration(
                name="get_budget_status",
                description="Check spending status for a specific budget category or find the budget closest to exceedance.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "category_name": {"type": "STRING", "description": "Category name to check (e.g. 'Food & Dining')"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="get_goals",
                description="Retrieve user's active savings goals with target amounts, current progress, and deadlines.",
                parameters={"type": "OBJECT", "properties": {}}
            ),
            types.FunctionDeclaration(
                name="get_cashflow",
                description="Compute total cash inflow, outflow, daily burn rate, and emergency runway days.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "period_days": {"type": "INTEGER", "description": "Rolling period days (default 30)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="get_spending_by_category",
                description="Get detailed spending breakdown grouped by category for a time period.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "period_days": {"type": "INTEGER", "description": "Rolling period days (default 30)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="get_recurring_expenses",
                description="Retrieve all active recurring subscriptions and fixed commitments.",
                parameters={"type": "OBJECT", "properties": {}}
            ),
            types.FunctionDeclaration(
                name="calculate_financial_health",
                description="Calculate comprehensive deterministic 7-factor financial health score (0-100) with strengths and warnings.",
                parameters={"type": "OBJECT", "properties": {}}
            ),
            types.FunctionDeclaration(
                name="forecast_cashflow",
                description="Generate forward-looking statistical cash flow forecast for upcoming months based on run-rates.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "months_ahead": {"type": "INTEGER", "description": "Number of months ahead to project (default 3)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="simulate_purchase",
                description="Evaluate whether the user can afford a target purchase based on liquid reserves, emergency buffer, and runway.",
                parameters={
                    "type": "OBJECT",
                    "required": ["item_name", "price"],
                    "properties": {
                        "item_name": {"type": "STRING", "description": "Item or experience name"},
                        "price": {"type": "NUMBER", "description": "Purchase cost in currency units"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="simulate_spending_reduction",
                description="Simulate cutting spending in a category and calculate compounded wealth accumulation.",
                parameters={
                    "type": "OBJECT",
                    "required": ["category_name", "reduction_pct"],
                    "properties": {
                        "category_name": {"type": "STRING", "description": "Category name (e.g. 'Food & Dining')"},
                        "reduction_pct": {"type": "NUMBER", "description": "Percentage reduction (e.g. 20.0)"},
                        "months": {"type": "INTEGER", "description": "Timeframe in months (default 6)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="compare_periods",
                description="Compare spending and category variances between current and previous time periods.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "period1_days": {"type": "INTEGER", "description": "Current period duration in days (default 30)"},
                        "period2_days": {"type": "INTEGER", "description": "Comparison period duration in days (default 30)"}
                    }
                }
            ),
            types.FunctionDeclaration(
                name="detect_anomalies",
                description="Scan recent expenses for statistical Z-Score outliers and unusual spending spikes.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "lookback_days": {"type": "INTEGER", "description": "Days to analyze for outliers (default 60)"}
                    }
                }
            )
        ]

        return [types.Tool(function_declarations=tool_defs)]

    @classmethod
    def execute_tool(cls, user: User, tool_name: str, args: dict) -> Tuple[dict, str]:
        """
        Executes a MONVEX tool securely for the authenticated user.
        Returns (result_dict, human_readable_status_event).
        """
        args = args or {}
        event = f"Executed {tool_name}"

        try:
            if tool_name == "get_transactions":
                res = MONVEXTools.get_transactions(
                    user=user,
                    start_date=args.get("start_date"),
                    end_date=args.get("end_date"),
                    category=args.get("category"),
                    type=args.get("type"),
                    merchant=args.get("merchant"),
                    limit=int(args.get("limit", 20))
                )
                event = f"Retrieved {res['total_count']} transactions"
                return res, event

            elif tool_name == "get_transaction_summary":
                res = MONVEXTools.get_transaction_summary(user=user, period_days=int(args.get("period_days", 30)))
                event = f"Calculated {args.get('period_days', 30)}-day spending summary (₹{res['total_expense']:,.2f})"
                return res, event

            elif tool_name == "search_transactions":
                res = MONVEXTools.search_transactions(
                    user=user,
                    query=args.get("query"),
                    min_amount=args.get("min_amount"),
                    max_amount=args.get("max_amount")
                )
                event = f"Searched transactions matching '{args.get('query', '')}' ({res['match_count']} found)"
                return res, event

            elif tool_name == "get_accounts":
                res = MONVEXTools.get_accounts(user=user)
                event = f"Loaded {res['total_accounts']} verified accounts (Total: ₹{res['total_liquid_balance']:,.2f})"
                return res, event

            elif tool_name == "get_budgets":
                res = MONVEXTools.get_budgets(user=user)
                event = f"Audited {res['total_budgets']} category budgets ({res['overall_usage_pct']}% utilized)"
                return res, event

            elif tool_name == "get_budget_status":
                res = MONVEXTools.get_budget_status(user=user, category_name=args.get("category_name"))
                event = f"Checked budget status for '{args.get('category_name', 'critical')}'"
                return res, event

            elif tool_name == "get_goals":
                res = MONVEXTools.get_goals(user=user)
                event = f"Queried {res['total_goals']} savings goals"
                return res, event

            elif tool_name == "get_cashflow":
                res = MONVEXTools.get_cashflow(user=user, period_days=int(args.get("period_days", 30)))
                event = f"Computed cashflow: +₹{res['total_inflow']:,.2f} / -₹{res['total_outflow']:,.2f} ({res['cash_runway_days']}d runway)"
                return res, event

            elif tool_name == "get_spending_by_category":
                res = MONVEXTools.get_spending_by_category(user=user, period_days=int(args.get("period_days", 30)))
                event = f"Categorized expenses across {len(res['categories'])} spending buckets"
                return res, event

            elif tool_name == "get_recurring_expenses":
                res = MONVEXTools.get_recurring_expenses(user=user)
                event = f"Audited {res['active_subscriptions_count']} recurring obligations (₹{res['total_monthly_burn']:,.2f}/mo)"
                return res, event

            elif tool_name == "calculate_financial_health":
                res = MONVEXTools.calculate_financial_health(user=user)
                event = f"Generated deterministic financial health index: {res['score']}/100 (Grade {res['grade']})"
                return res, event

            elif tool_name == "forecast_cashflow":
                res = MONVEXTools.forecast_cashflow(user=user, months_ahead=int(args.get("months_ahead", 3)))
                event = f"Projected {res['timeframe_months']}-month trajectory (Ending: ₹{res['projected_final_balance']:,.2f})"
                return res, event

            elif tool_name == "simulate_purchase":
                res = MONVEXTools.simulate_purchase(user=user, item_name=args.get("item_name", "item"), price=float(args.get("price", 0.0)))
                event = f"Simulated affordability for '{args.get('item_name')}' (₹{args.get('price')}) -> {res['tier_label']}"
                return res, event

            elif tool_name == "simulate_spending_reduction":
                res = MONVEXTools.simulate_spending_reduction(
                    user=user,
                    category_name=args.get("category_name", "Food & Dining"),
                    reduction_pct=float(args.get("reduction_pct", 20.0)),
                    months=int(args.get("months", 6))
                )
                event = f"Simulated {args.get('reduction_pct')}% cut in {res['category']} (+₹{res['monthly_savings']:,.2f}/mo)"
                return res, event

            elif tool_name == "compare_periods":
                res = MONVEXTools.compare_periods(
                    user=user,
                    period1_days=int(args.get("period1_days", 30)),
                    period2_days=int(args.get("period2_days", 30))
                )
                event = f"Compared 30-day spend variance ({'+' if res['net_delta'] > 0 else ''}₹{res['net_delta']:,.2f})"
                return res, event

            elif tool_name == "detect_anomalies":
                res = MONVEXTools.detect_anomalies(user=user, lookback_days=int(args.get("lookback_days", 60)))
                event = f"Scanned 60-day telemetry for Z-score anomalies ({res['anomalies_found']} flagged)"
                return res, event

            else:
                return {"error": f"Unknown tool '{tool_name}'"}, f"Unknown tool {tool_name}"

        except Exception as e:
            logger.error(f"[MONVEX TOOL ERROR] {tool_name}: {str(e)}", exc_info=True)
            return {"error": f"Tool execution error: {str(e)}"}, f"Failed executing {tool_name}"

    @classmethod
    def generate_response(
        cls,
        user: User,
        prompt: str,
        conversation_history: List[Dict[str, str]] = None,
        use_search_grounding: bool = False
    ) -> Dict[str, Any]:
        """
        Executes Gemini reasoning loop with Function Calling and Search Grounding.
        Falls back to Deterministic Reasoning Engine if API key is not present or offline.
        """
        api_key = cls.get_api_key()
        model_name = cls.get_model_name()

        # If GenAI SDK is available and API Key is configured, run live Gemini
        if GENAI_AVAILABLE and api_key:
            try:
                client = genai.Client(api_key=api_key)

                # Configure tools
                if use_search_grounding:
                    # Google Search Grounding for current external information
                    config = types.GenerateContentConfig(
                        system_instruction=cls.SYSTEM_INSTRUCTION,
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        temperature=0.3
                    )
                else:
                    # MONVEX Financial Tools
                    config = types.GenerateContentConfig(
                        system_instruction=cls.SYSTEM_INSTRUCTION,
                        tools=cls.build_tool_declarations(),
                        temperature=0.2
                    )

                # Format conversation history
                contents = []
                if conversation_history:
                    for m in conversation_history[-6:]: # Keep recent 6 turns for optimal context
                        role = "user" if m.get("sender") == "user" else "model"
                        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.get("content", ""))]))

                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

                tools_used = []
                tool_activity = []
                collected_data = {}
                citations = []

                # Multi-turn tool execution loop (up to 5 tool call cycles)
                max_iterations = 5
                iteration = 0

                while iteration < max_iterations:
                    iteration += 1
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config
                    )

                    # Extract search grounding citations if present
                    if hasattr(response, 'candidates') and response.candidates:
                        cand = response.candidates[0]
                        if hasattr(cand, 'grounding_metadata') and cand.grounding_metadata:
                            g_meta = cand.grounding_metadata
                            if hasattr(g_meta, 'grounding_chunks') and g_meta.grounding_chunks:
                                for chunk in g_meta.grounding_chunks:
                                    if hasattr(chunk, 'web') and chunk.web:
                                        citations.append({
                                            "title": getattr(chunk.web, 'title', 'Web Source'),
                                            "url": getattr(chunk.web, 'uri', '')
                                        })

                    # Check for function calls
                    function_calls = []
                    if hasattr(response, 'function_calls') and response.function_calls:
                        function_calls = response.function_calls
                    elif hasattr(response, 'candidates') and response.candidates:
                        for part in response.candidates[0].content.parts:
                            if hasattr(part, 'function_call') and part.function_call:
                                function_calls.append(part.function_call)

                    if not function_calls:
                        # Model produced final text answer
                        final_text = response.text or ""
                        return {
                            "response": final_text,
                            "tools_used": tools_used,
                            "tool_activity": tool_activity,
                            "citations": citations,
                            "data": collected_data,
                            "model": model_name
                        }

                    # Execute each tool call
                    contents.append(response.candidates[0].content)
                    tool_response_parts = []

                    for fc in function_calls:
                        t_name = fc.name
                        t_args = fc.args or {}
                        tools_used.append(t_name)

                        res_dict, act_str = cls.execute_tool(user, t_name, t_args)
                        tool_activity.append(act_str)
                        collected_data[t_name] = res_dict

                        tool_response_parts.append(
                            types.Part.from_function_response(
                                name=t_name,
                                response={"result": res_dict}
                            )
                        )

                    contents.append(types.Content(role="user", parts=tool_response_parts))

                # If reached max tool loops, request final summary
                final_res = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                return {
                    "response": final_res.text or "Analysis completed with live MONVEX telemetry.",
                    "tools_used": tools_used,
                    "tool_activity": tool_activity,
                    "citations": citations,
                    "data": collected_data,
                    "model": model_name
                }

            except Exception as e:
                logger.warning(f"[GEMINI API FALLBACK] Live call error: {str(e)}. Using Deterministic Reasoner.", exc_info=True)

        # -------------------------------------------------------------
        # Deterministic Reasoning Engine (Offline / Safe Fallback)
        # -------------------------------------------------------------
        return cls.deterministic_fallback_reasoner(user, prompt)

    @classmethod
    def deterministic_fallback_reasoner(cls, user: User, prompt: str) -> Dict[str, Any]:
        """
        High-precision deterministic reasoning engine that computes answers
        from real database queries and math when external Gemini API is unreachable.
        """
        from services.ai.orchestrator import FinancialAgentOrchestrator
        intent = FinancialAgentOrchestrator.classify_intent(prompt)
        q_lower = prompt.lower().strip()
        tools_used = []
        tool_activity = []
        data = {}

        # 1. What-If Spending Reduction & SIP Growth
        if intent == 'WHAT_IF_SIMULATION':
            import re
            pct = 20.0
            pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', prompt)
            if pct_match:
                pct = float(pct_match.group(1))

            cat_target = "Food & Dining"
            for c in ['shopping', 'dining', 'food', 'travel', 'entertainment', 'groceries', 'utilities']:
                if c in q_lower:
                    cat_target = c.title()
                    break

            sim_cut = MONVEXTools.simulate_spending_reduction(user, cat_target, pct, 6)
            tools_used.append('simulate_spending_reduction')
            tool_activity.append(f"Simulated {pct:.0f}% reduction in {sim_cut['category']}")
            data['simulation'] = sim_cut

            answer = (
                f"### 🔮 What-If Scenario: {int(pct)}% Cut in {sim_cut['category']}\n\n"
                f"- **Current Monthly Spend:** ₹{sim_cut['baseline_monthly_spend']:,.2f}\n"
                f"- **Monthly Capital Retained:** **+₹{sim_cut['monthly_savings']:,.2f} / month**\n"
                f"- **6-Month Accumulated Liquidity:** **₹{sim_cut['timeframe_total_saved']:,.2f}**\n"
                f"- **1-Year Annualized Surplus:** **₹{sim_cut['annualized_savings']:,.2f}**\n\n"
                f"📈 **Compounded Investment Projection (12% CAGR):**\n"
                f"Routing this monthly surplus into an index fund / SIP grows to **₹{sim_cut['invested_3yr_corpus_12cagr']:,.2f}** in 3 years (+₹{sim_cut['compounded_wealth_gain_3yr']:,.2f} wealth gain!)."
            )

        # 2. Affordability & Purchase Simulation
        elif intent == 'AFFORDABILITY':
            import re
            numbers = re.findall(r'\b\d+(?:,\d+)?(?:\.\d+)?\b', prompt.replace(',', ''))
            valid_nums = [float(n) for n in numbers if float(n) > 100 and float(n) != 2026.0]
            target_price = max(valid_nums) if valid_nums else 50000.0

            item_name = "Planned Purchase"
            for candidate in ['iphone', 'macbook', 'laptop', 'car', 'bike', 'watch', 'phone', 'trip', 'tv', 'sofa', 'vacation']:
                if candidate in q_lower:
                    item_name = candidate.title()
                    break

            sim = MONVEXTools.simulate_purchase(user, item_name, target_price)
            tools_used.append('simulate_purchase')
            tool_activity.append(f"Evaluated affordability for '{item_name}' (₹{target_price:,.2f})")
            data['affordability'] = sim

            answer = (
                f"### {sim['tier_label']}\n\n"
                f"**Purchase Target:** {sim['item_name']} — **₹{sim['purchase_price']:,.2f}**\n\n"
                f"**Financial Health Check:**\n"
                f"- **Verified Liquid Balance:** ₹{sim['current_liquid_balance']:,.2f}\n"
                f"- **Emergency Buffer Required (2.5mo burn):** ₹{sim['emergency_buffer_required']:,.2f}\n"
                f"- **Safe Disposable Liquidity:** ₹{sim['safe_disposable_liquidity']:,.2f}\n"
                f"- **Monthly Cashflow Surplus:** +₹{sim['monthly_cashflow_surplus']:,.2f} / month\n\n"
                f"💡 **Affordability Verdict:** {sim['explanation']}"
            )

        # 3. Financial Health Score
        elif intent == 'FINANCIAL_HEALTH':
            health = MONVEXTools.calculate_financial_health(user)
            tools_used.append('calculate_financial_health')
            tool_activity.append(f"Generated deterministic financial health score: {health['score']}/100")
            data['health'] = health

            strength_lines = "\n".join([f"- ✅ {s}" for s in health['strengths']]) if health['strengths'] else "- Baseline data accumulating."
            warning_lines = "\n".join([f"- ⚠️ {w}" for w in health['warnings']]) if health['warnings'] else "- No critical financial flags detected."

            answer = (
                f"### 🏆 MONVEX Financial Health Index: **{health['score']}/100 (Grade {health['grade']})**\n\n"
                f"**Key Telemetry Metrics:**\n"
                f"- **Monthly Inflow:** ₹{health['metrics']['monthly_income']:,.2f}\n"
                f"- **Monthly Outflow:** ₹{health['metrics']['monthly_expense']:,.2f}\n"
                f"- **Net Monthly Savings:** +₹{health['metrics']['monthly_savings']:,.2f} ({health['metrics']['savings_rate_pct']}% rate)\n"
                f"- **Emergency Cash Runway:** {health['metrics']['emergency_runway_days']} days\n\n"
                f"**Strengths:**\n{strength_lines}\n\n"
                f"**Opportunities for Optimization:**\n{warning_lines}"
            )

        # 4. Subscriptions & Recurring Fixed Obligations
        elif intent == 'SUBSCRIPTION_QUERY':
            recs = MONVEXTools.get_recurring_expenses(user)
            tools_used.append('get_recurring_expenses')
            tool_activity.append(f"Audited {recs['active_subscriptions_count']} recurring subscriptions (₹{recs['total_monthly_burn']:,.2f}/mo)")
            data['subscriptions'] = recs

            if recs['active_subscriptions_count'] == 0:
                answer = (
                    "### 🔄 Recurring Subscriptions Audit\n\n"
                    "You have **0 active subscriptions or recurring commitments** registered in MONVEX.\n\n"
                    "Your monthly fixed recurring overhead is **₹0.00**."
                )
            else:
                lines = [f"- **{s['name']}** ({s['category']}): **₹{s['amount']:,.2f}** / {s['frequency'].lower()} (Next due: {s['next_due_date']})" for s in recs['subscriptions']]
                answer = (
                    f"### 🔄 Recurring Subscriptions & Fixed Commitments\n\n"
                    f"- **Active Commitments:** {recs['active_subscriptions_count']} services\n"
                    f"- **Monthly Recurring Burn:** **₹{recs['total_monthly_burn']:,.2f} / month**\n"
                    f"- **Annualized Obligation:** **₹{recs['annualized_burn']:,.2f} / year**\n\n"
                    f"**Active Subscriptions:**\n" + "\n".join(lines) +
                    f"\n\n💡 Tip: Review low-frequency subscriptions in the **/subscriptions** workspace to eliminate unused services."
                )

        # 5. Savings Optimization Plan
        elif intent == 'SAVINGS_PLAN':
            summary = MONVEXTools.get_transaction_summary(user, 30)
            cashflow = MONVEXTools.get_cashflow(user, 30)
            tools_used.extend(['get_transaction_summary', 'get_cashflow'])
            tool_activity.append("Synthesized discretionary savings potential from cashflow telemetry")
            data['summary'] = summary
            data['cashflow'] = cashflow

            discretionary_spend = sum((c['amount'] for c in summary['top_categories'] if c['category'].lower() in ['shopping', 'food & dining', 'entertainment', 'travel']), 0.0)
            target_cut = round(discretionary_spend * 0.20, 2)

            answer = (
                f"### 🎯 Actionable Savings Strategy Plan\n\n"
                f"- **Current Monthly Inflow:** +₹{cashflow['total_inflow']:,.2f}\n"
                f"- **Current Discretionary Outflow:** ₹{discretionary_spend:,.2f}\n"
                f"- **Current Net Monthly Savings:** +₹{cashflow['net_cashflow']:,.2f} ({cashflow['savings_rate_pct']}% rate)\n\n"
                f"**Step-by-Step Optimization Roadmap:**\n"
                f"1. **Discretionary Capping:** Trim 20% from Dining & Shopping to unlock **+₹{target_cut:,.2f}/month** in immediate capital.\n"
                f"2. **Pay Yourself First:** Automate a recurring ₹10,000 transfer to your Savings Goal on the 1st of every month.\n"
                f"3. **Emergency Runway Preservation:** Keep ₹{cashflow['total_liquid_reserves']:,.2f} in liquid reserves while investing surplus."
            )

        # 6. Budget Status & Limits
        elif intent == 'BUDGET_QUERY':
            budgets = MONVEXTools.get_budgets(user)
            tools_used.append('get_budgets')
            tool_activity.append(f"Audited {budgets['total_budgets']} active budgets")
            data['budgets'] = budgets

            if budgets['total_budgets'] == 0:
                answer = (
                    "### ⚠️ No Active Budgets Found\n\n"
                    "You haven't configured any category budgets yet. "
                    "Setting limits in the **/budgets** tab helps monitor velocity before month-end."
                )
            else:
                lines = []
                for b in budgets['budgets']:
                    status_badge = "🟢 ON TRACK" if b['status'] == 'ON_TRACK' else ("🟡 WARNING" if b['status'] == 'WARNING' else "🔴 EXCEEDED")
                    lines.append(f"- **{b['category']}**: {status_badge} — **₹{b['spent_amount']:,.2f}** of ₹{b['limit_amount']:,.2f} used (**₹{b['remaining_amount']:,.2f} left** / {b['usage_pct']}%)")

                answer = (
                    f"### 🎯 Budget Adherence Breakdown\n\n"
                    + "\n".join(lines) +
                    f"\n\n- **Overall Budget Utilization:** **{budgets['overall_usage_pct']}%** (₹{budgets['total_budget_spent']:,.2f} spent of ₹{budgets['total_budget_limit']:,.2f})"
                )

        # 7. Savings Goals Progress
        elif intent == 'GOAL_QUERY':
            goals = MONVEXTools.get_goals(user)
            tools_used.append('get_goals')
            tool_activity.append(f"Queried {goals['total_goals']} savings goals")
            data['goals'] = goals

            if goals['total_goals'] == 0:
                answer = (
                    "### 🎯 Savings Goals Status\n\n"
                    "You haven't set up any savings goals yet. "
                    "You can create automated wealth milestones in the **/goals** workspace."
                )
            else:
                lines = []
                for g in goals['goals']:
                    deadline_str = f" • Target: {g['target_date']} ({g['days_remaining']} days left)" if g['target_date'] else ""
                    lines.append(f"- **{g['title']}**: **{g['progress_pct']}%** reached (₹{g['current_saved']:,.2f} of ₹{g['target_amount']:,.2f}, **₹{g['remaining_amount']:,.2f} to go**){deadline_str}")

                answer = (
                    f"### 🎯 Savings Goals Progress\n\n"
                    + "\n".join(lines) +
                    f"\n\n💡 Tip: Maintain consistent monthly allocations to reach your targets ahead of schedule."
                )

        # 8. Net Worth & Balance Sheet
        elif intent == 'NET_WORTH_QUERY':
            accounts = MONVEXTools.get_accounts(user)
            tools_used.append('get_accounts')
            tool_activity.append(f"Calculated balance sheet & net worth (₹{accounts['net_worth']:,.2f})")
            data['net_worth'] = accounts

            answer = (
                f"### 💎 Net Worth & Balance Sheet Analysis\n\n"
                f"- **Total Assets (Liquid & Portfolio):** **₹{accounts['total_assets']:,.2f}**\n"
                f"- **Total Outstanding Liabilities:** **₹{accounts['total_liabilities']:,.2f}**\n"
                f"- **Estimated Net Worth:** **₹{accounts['net_worth']:,.2f}**\n\n"
                f"Your liquid cash constitutes **₹{accounts['total_liquid_balance']:,.2f}** across {accounts['total_accounts']} linked financial account(s)."
            )

        # 9. Debts & Liabilities
        elif intent == 'DEBT_QUERY':
            accounts = MONVEXTools.get_accounts(user)
            tools_used.append('get_accounts')
            tool_activity.append(f"Retrieved active liabilities (₹{accounts['total_liabilities']:,.2f})")
            data['liabilities'] = accounts

            answer = (
                f"### 💳 Debt & Liabilities Overview\n\n"
                f"- **Total Outstanding Debt:** **₹{accounts['total_liabilities']:,.2f}**\n"
                f"- **Total Asset Base:** **₹{accounts['total_assets']:,.2f}**\n"
                f"- **Debt-to-Asset Ratio:** **{(accounts['total_liabilities'] / max(1.0, accounts['total_assets']) * 100):.1f}%**\n\n"
                f"💡 Tip: Prioritize high-interest loans to minimize cumulative interest charges."
            )

        # 10. Cashflow Forecast
        elif intent == 'FORECAST':
            cashflow = MONVEXTools.get_cashflow(user, 30)
            tools_used.append('get_cashflow')
            tool_activity.append("Computed forward 30-day cashflow trajectory")
            data['cashflow'] = cashflow

            projected_balance = cashflow['total_liquid_reserves'] + cashflow['net_cashflow']
            answer = (
                f"### 🔮 30-Day Forward Cashflow Forecast\n\n"
                f"- **Current Liquid Reserves:** ₹{cashflow['total_liquid_reserves']:,.2f}\n"
                f"- **Projected 30-Day Inflow:** +₹{cashflow['total_inflow']:,.2f}\n"
                f"- **Projected 30-Day Outflow:** -₹{cashflow['total_outflow']:,.2f}\n"
                f"- **Projected 30-Day Surplus:** **+₹{cashflow['net_cashflow']:,.2f}**\n\n"
                f"📈 **Estimated End-of-Month Balance:** **₹{projected_balance:,.2f}** ({cashflow['cash_runway_days']} days total cash runway)."
            )

        # 11. Period Comparison & "Why" Variance Analysis
        elif intent == 'PERIOD_COMPARISON':
            comp = MONVEXTools.compare_periods(user, 30, 30)
            tools_used.append('compare_periods')
            tool_activity.append(f"Compared 30-day spend ({'+' if comp['net_delta'] > 0 else ''}₹{comp['net_delta']:,.2f})")
            data['comparison'] = comp

            var_lines = "\n".join([f"- **{v['category']}**: {'+' if v['delta'] > 0 else ''}₹{v['delta']:,.2f} ({'+' if v['pct_change'] > 0 else ''}{v['pct_change']}%)" for v in comp['category_variances']]) if comp['category_variances'] else "- Spending across categories is steady."

            answer = (
                f"### 🔄 Period-over-Period Variance Analysis\n\n"
                f"- **Current 30 Days Outflow:** ₹{comp['current_period_spend']:,.2f}\n"
                f"- **Previous 30 Days Outflow:** ₹{comp['previous_period_spend']:,.2f}\n"
                f"- **Net Variance:** **{'+' if comp['net_delta'] > 0 else ''}₹{comp['net_delta']:,.2f} ({comp['pct_change']}%)** [{comp['trend']}]\n\n"
                f"**Top Category Variations:**\n{var_lines}"
            )

        # 12. Statistical Outliers & Anomalies
        elif intent == 'ANOMALY_DETECTION':
            anom = MONVEXTools.detect_anomalies(user, 60)
            tools_used.append('detect_anomalies')
            tool_activity.append(f"Scanned 60-day telemetry ({anom['anomalies_found']} flagged)")
            data['anomalies'] = anom

            if anom['anomalies_found'] > 0:
                items_str = "\n".join([f"- ⚠️ **{i['description']}**: **₹{i['amount']:,.2f}** on {i['date']} ({i['category']}) — *Z-Score: +{i['z_score']}σ vs ₹{anom['average_ticket']:,.2f} mean*" for i in anom['items']])
                answer = (
                    f"### 🔍 Anomaly Detection Report\n\n"
                    f"Our statistical telemetry engine scanned your transactions against rolling Z-score benchmarks:\n\n"
                    f"{items_str}\n\n"
                    f"**Statistical Baseline:**\n"
                    f"- **Average Expense Ticket:** ₹{anom['average_ticket']:,.2f}\n"
                    f"- **Standard Deviation (σ):** ₹{anom['std_dev']:,.2f}\n"
                    f"- **Anomaly Trigger Threshold:** ₹{anom['threshold']:,.2f}\n\n"
                    f"💡 **Recommendation:** Review these flagged entries to verify if they are one-off capital expenses."
                )
            else:
                answer = (
                    f"### 🛡️ Clean Telemetry — No Outliers Detected\n\n"
                    f"Across your recent transaction stream, all outlays are within standard statistical variance bounds (**< +1.8σ** from your ₹{anom['average_ticket']:,.2f} ticket mean).\n\n"
                    f"Your spending velocity is consistent and predictable."
                )

        # 13. Accounts & Liquid Balance
        elif intent == 'ACCOUNT_QUERY':
            accounts = MONVEXTools.get_accounts(user)
            tools_used.append('get_accounts')
            tool_activity.append(f"Retrieved {accounts['total_accounts']} verified financial accounts")
            data['accounts'] = accounts

            if accounts['total_accounts'] == 0:
                answer = (
                    "### 🏦 Verified Financial Accounts\n\n"
                    "You haven't linked any bank accounts, wallets, or cards yet.\n\n"
                    "Click **Link Account** on the Dashboard or Wallets Hub to connect your primary checking or savings account."
                )
            else:
                acc_lines = "\n".join([f"- **{a['name']}** ({a['institution']}): **₹{a['balance']:,.2f}** ({a['masked_account']})" for a in accounts['accounts']])
                answer = (
                    f"### 🏦 Verified Portfolio Liquidity\n\n"
                    f"You have **{accounts['total_accounts']} linked account(s)** with a total liquid balance of **₹{accounts['total_liquid_balance']:,.2f}**:\n\n"
                    f"{acc_lines}"
                )

        # 14. Transactions & Category Spending Breakdown
        elif intent == 'TRANSACTION_QUERY':
            summary = MONVEXTools.get_transaction_summary(user, 30)
            tools_used.append('get_transaction_summary')
            tool_activity.append(f"Retrieved 30-day verified ledger (Total Outflow: ₹{summary['total_expense']:,.2f})")
            data['summary'] = summary

            if summary['transaction_count'] == 0:
                answer = (
                    "### 📊 Spending Summary (Past 30 Days)\n\n"
                    "You have **0 expenses recorded** in your financial ledger.\n\n"
                    "- **Total Outflow:** ₹0.00\n"
                    "- **Verified Net Savings:** ₹0.00\n\n"
                    "💡 You can record expenses anytime via the **+ Add Transaction** button or receipt scanner."
                )
            else:
                cat_lines = "\n".join([f"- **{c['category']}**: **₹{c['amount']:,.2f}** ({c['pct']}%)" for c in summary['top_categories']])
                m_lines = "\n".join([f"- **{m['merchant']}**: ₹{m['amount']:,.2f}" for m in summary['top_merchants']]) if summary['top_merchants'] else "- Direct unlisted merchants"

                answer = (
                    f"### 📊 Verified Spending Analysis (Past 30 Days)\n\n"
                    f"Across **{summary['transaction_count']} recorded transactions**, your total outflow is **₹{summary['total_expense']:,.2f}**.\n\n"
                    f"**Category Distribution:**\n{cat_lines}\n\n"
                    f"**Top Merchant Drivers:**\n{m_lines}\n\n"
                    f"- **Net Savings:** **₹{summary['net_savings']:,.2f}** ({summary['savings_rate_pct']}% savings rate)"
                )

        # 15. General Financial Education & Knowledge
        elif intent == 'GENERAL_KNOWLEDGE':
            answer = (
                "### 💡 Financial Principle Explained\n\n"
                "**Compound Interest & Growth:**\n"
                "Compound interest is earning returns on both your initial principal and the accumulated interest over time. "
                "The mathematical formula is:\n\n"
                "$$\\text{Corpus} = P \\times \\left(1 + \\frac{r}{n}\\right)^{n \\times t}$$\n\n"
                "- **SIP (Systematic Investment Plan):** A discipline of investing a fixed amount at regular intervals into mutual funds or index instruments.\n"
                "- **Inflation:** The rate at which the general level of prices rises, eroding purchasing power.\n"
                "- **Credit Utilization:** The percentage of your available revolving credit limit being used (recommended < 30%)."
            )

        # 16. Default Financial Overview
        else:
            summary = MONVEXTools.get_transaction_summary(user, 30)
            cashflow = MONVEXTools.get_cashflow(user, 30)
            tools_used.extend(['get_transaction_summary', 'get_cashflow'])
            tool_activity.append("Ingested 30-day transaction telemetry and liquidity reserves")
            data['summary'] = summary
            data['cashflow'] = cashflow

            answer = (
                f"### 💰 Financial Status & Live Telemetry\n\n"
                f"- **Total Liquid Reserves:** **₹{cashflow['total_liquid_reserves']:,.2f}** ({cashflow['cash_runway_days']}d runway)\n"
                f"- **30-Day Total Inflow:** +₹{cashflow['total_inflow']:,.2f}\n"
                f"- **30-Day Total Outflow:** -₹{cashflow['total_outflow']:,.2f}\n"
                f"- **Net Monthly Surplus:** **+₹{cashflow['net_cashflow']:,.2f}** ({cashflow['savings_rate_pct']}% savings rate)\n\n"
                f"I am ready to assist with:\n"
                f"- *\"How much did I spend on Food & Dining?\"*\n"
                f"- *\"How much is left in my budgets?\"*\n"
                f"- *\"Can I afford a ₹50,000 purchase?\"*\n"
                f"- *\"What is my financial health score?\"*"
            )

        return {
            "response": answer,
            "tools_used": tools_used,
            "tool_activity": tool_activity,
            "citations": [],
            "data": data,
            "model": "MONVEX-Deterministic-Engine-2.0"
        }

