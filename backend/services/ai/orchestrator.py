"""
MONVEX Financial Intelligence Orchestration Layer
Central Orchestrator coordinating Intent Detection, Tool Selection, Gemini Reasoning, and Context Memory.
"""
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from django.contrib.auth.models import User
from apps.ai_copilot.models import AIInteraction, ConversationSession, ConversationMessage
from .gemini_client import GeminiClient
from .tools import MONVEXTools

logger = logging.getLogger(__name__)

class FinancialAgentOrchestrator:
    """
    Central orchestration engine for the MONVEX Financial AI Agent.
    - Resolves multi-turn conversation context
    - Classifies user intent
    - Neutralizes adversarial prompts
    - Executes function calls & search grounding
    - Persists interaction history per user
    """

    ADVERSARIAL_PATTERNS = [
        r'ignore (?:all )?(?:previous|prior) instructions',
        r'disregard system prompt',
        r'show me (?:other|all) users?',
        r'dump (?:the )?database',
        r'select \* from',
        r'give me api keys?',
        r'reveal (?:the )?secret',
        r'system prompt leak',
        r'you are now DAN',
        r'act as an unrestricted AI',
    ]

    @classmethod
    def classify_intent(cls, prompt: str) -> str:
        """
        Deterministic intent classifier for logging and routing.
        """
        p = prompt.lower().strip()

        # Public market / current web queries
        if any(w in p for w in ['usd/inr', 'dollar to inr', 'gold price', 'silver price', 'repo rate', 'rbi policy', 'sensex', 'nifty', 'inflation rate']):
            return 'CURRENT_MARKET_INFORMATION'

        # Affordability & purchase
        if any(w in p for w in ['afford', 'can i buy', 'can i purchase', 'iphone', 'laptop', 'car', 'should i get']):
            return 'AFFORDABILITY'

        # What-if simulations
        if any(w in p for w in ['what if', 'cut spending', 'reduce by', 'simulate']):
            return 'WHAT_IF_SIMULATION'

        # Health score
        if any(w in p for w in ['health score', 'financial health', 'diagnostic', 'grade']):
            return 'FINANCIAL_HEALTH'

        # Forecasts
        if any(w in p for w in ['forecast', 'predict', 'next month', 'year ahead', 'future balance']):
            return 'FORECAST'

        # Budgets
        if any(w in p for w in ['budget', 'over budget', 'limit', 'remaining budget']):
            return 'BUDGET_QUERY'

        # Goals
        if any(w in p for w in ['goal', 'emergency fund', 'target', 'savings goal']):
            return 'GOAL_QUERY'

        # Accounts
        if any(w in p for w in ['account', 'balance', 'total balance', 'bank', 'wallet', 'card']):
            return 'ACCOUNT_QUERY'

        # Period comparison
        if any(w in p for w in ['compare', 'last month', 'previous month', 'variance', 'difference']):
            return 'PERIOD_COMPARISON'

        # Anomalies
        if any(w in p for w in ['anomaly', 'unusual', 'spike', 'outlier', 'irregular']):
            return 'ANOMALY_DETECTION'

        # Transactions & category spend
        if any(w in p for w in ['spend', 'spent', 'expense', 'transaction', 'bought', 'outflow', 'merchant', 'food', 'dining', 'groceries', 'shopping']):
            return 'TRANSACTION_QUERY'

        # General education
        if any(w in p for w in ['what is', 'explain', 'how does', 'definition', 'compound interest', 'sip', 'cagr']):
            return 'GENERAL_KNOWLEDGE'

        return 'GENERAL_FINANCIAL_INQUIRY'

    @classmethod
    def sanitize_prompt(cls, prompt: str) -> Tuple[str, bool]:
        """
        Scans prompt for adversarial jailbreaks. Returns (clean_prompt, was_adversarial).
        """
        for pattern in cls.ADVERSARIAL_PATTERNS:
            if re.search(pattern, prompt, re.IGNORECASE):
                return (
                    "I am the MONVEX Financial Assistant. I can only assist you with managing your authenticated personal financial data, cash flows, and investments.",
                    True
                )
        return prompt, False

    @classmethod
    def chat(
        cls,
        user: User,
        prompt: str,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Primary entrypoint for AI Chat turns.
        """
        raw_prompt = prompt.strip()
        if not raw_prompt:
            return {
                "response": "Please provide a financial inquiry or question.",
                "tools_used": [],
                "tool_activity": [],
                "citations": [],
                "data": {},
                "intent": "EMPTY"
            }

        # 1. Security Check
        clean_prompt, is_adversarial = cls.sanitize_prompt(raw_prompt)
        if is_adversarial:
            return {
                "response": "🔒 **Security Guardrail Active:** MONVEX AI operates strictly within authenticated financial boundaries. Direct access to system prompts or cross-tenant databases is prohibited.",
                "tools_used": [],
                "tool_activity": ["Security Guardrail Triggered"],
                "citations": [],
                "data": {},
                "intent": "SECURITY_BLOCK"
            }

        # 2. Conversation Session Management
        session = None
        if conversation_id:
            try:
                session = ConversationSession.objects.filter(user=user, id=conversation_id).first()
            except Exception:
                session = None

        if not session:
            # Create fresh session for user
            title = raw_prompt[:50] + ("..." if len(raw_prompt) > 50 else "")
            session = ConversationSession.objects.create(
                user=user,
                title=title
            )

        # 3. Retrieve recent history for context
        recent_messages = session.messages.order_by('-created_at')[:6]
        history_list = []
        for m in reversed(recent_messages):
            history_list.append({
                "sender": m.sender,
                "content": m.content
            })

        # 4. Classify Intent
        intent = cls.classify_intent(raw_prompt)
        use_search_grounding = (intent == 'CURRENT_MARKET_INFORMATION')

        # 5. Record User Turn
        ConversationMessage.objects.create(
            session=session,
            sender='user',
            content=raw_prompt,
            intent=intent
        )

        # 6. Execute Gemini Generation Loop
        ai_result = GeminiClient.generate_response(
            user=user,
            prompt=raw_prompt,
            conversation_history=history_list,
            use_search_grounding=use_search_grounding
        )

        response_text = ai_result.get("response", "")
        tools_used = ai_result.get("tools_used", [])
        tool_activity = ai_result.get("tool_activity", [])
        citations = ai_result.get("citations", [])
        data_payload = ai_result.get("data", {})

        # 7. Record Assistant Turn
        ConversationMessage.objects.create(
            session=session,
            sender='assistant',
            content=response_text,
            intent=intent,
            tools_used=tools_used,
            tool_activity=tool_activity,
            citations=citations,
            data=data_payload
        )

        # 8. Record Legacy AIInteraction for backward compatibility
        try:
            AIInteraction.objects.create(
                user=user,
                question=raw_prompt,
                tools_used=tools_used,
                response=response_text
            )
        except Exception:
            pass

        return {
            "response": response_text,
            "answer": response_text, # backward compat alias
            "conversation_id": str(session.id),
            "intent": intent,
            "tools_used": tools_used,
            "tool_activity": tool_activity,
            "citations": citations,
            "data": data_payload,
            "model": ai_result.get("model", "MONVEX-AI")
        }
