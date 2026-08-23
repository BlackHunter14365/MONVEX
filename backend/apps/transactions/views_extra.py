"""
MONVEX 2.0 Extended Financial Intelligence Views
Handles Net Worth, Debt/EMI Planner, Receipt OCR & Confirmation, Duplicate Detection, Notifications, and Reports.
"""
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from datetime import date, timedelta
from decimal import Decimal

from .models import Asset, Liability, Receipt, Notification, Transaction, Category, RecurringPayment
from .serializers import (
    AssetSerializer,
    LiabilitySerializer,
    ReceiptSerializer,
    NotificationSerializer,
    TransactionSerializer
)
from services.net_worth_service import NetWorthService
from services.debt_service import DebtService
from services.receipt_service import ReceiptService
from services.why_explainer_service import WhyExplainerService
from services.finance_service import FinanceService
from services.budget_service import BudgetService


# =========================================================================
# 1. ASSETS & LIABILITIES (NET WORTH)
# =========================================================================

class AssetListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AssetSerializer
    pagination_class = None

    def get_queryset(self):
        return Asset.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AssetSerializer

    def get_queryset(self):
        return Asset.objects.filter(user=self.request.user)


class LiabilityListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LiabilitySerializer
    pagination_class = None

    def get_queryset(self):
        return Liability.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        data = serializer.validated_data
        p = float(data.get('principal_amount', 0))
        rate = float(data.get('interest_rate_pct', 10.5))
        tenure = data.get('tenure_months', 24)
        emi = data.get('monthly_emi')
        if not emi or emi <= 0:
            emi = DebtService.calculate_emi(p, rate, tenure)

        rem = data.get('remaining_balance')
        if not rem or rem <= 0:
            rem = p

        serializer.save(
            user=self.request.user,
            monthly_emi=emi,
            remaining_balance=rem
        )


class LiabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LiabilitySerializer

    def get_queryset(self):
        return Liability.objects.filter(user=self.request.user)


class NetWorthOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = NetWorthService.calculate_net_worth(request.user)
        return Response({"success": True, **data})


# =========================================================================
# 2. DEBT & LOAN AMORTIZATION PLANNER
# =========================================================================

class DebtPlannerOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = DebtService.get_user_debt_overview(request.user)
        return Response({"success": True, **data})


class DebtSimulateExtraPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        principal = float(request.data.get('principal', 0))
        rate = float(request.data.get('interest_rate', 10.5))
        emi = float(request.data.get('current_emi', 0))
        extra_monthly = float(request.data.get('extra_payment', 2000))

        if principal <= 0 or emi <= 0:
            # Try to grab first user liability
            liab = Liability.objects.filter(user=request.user).first()
            if liab:
                principal = float(liab.remaining_balance)
                rate = float(liab.interest_rate_pct)
                emi = float(liab.monthly_emi)
            else:
                principal = 500000.0
                rate = 10.5
                emi = 12822.0

        res = DebtService.simulate_extra_payment(principal, rate, emi, extra_monthly)
        return Response({"success": True, **res})


# =========================================================================
# 3. RECEIPT INTELLIGENCE & VISION
# =========================================================================

class ReceiptListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReceiptSerializer

    def get_queryset(self):
        return Receipt.objects.filter(user=self.request.user)


class ReceiptUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        merchant_name = request.data.get('merchant_name', 'D-Mart Supermarket')
        total_amount = float(request.data.get('total_amount', 1850.0))
        subtotal = float(request.data.get('subtotal', total_amount * 0.95))
        tax_amount = float(request.data.get('tax_amount', total_amount * 0.05))
        discount_amount = float(request.data.get('discount_amount', 0.0))
        date_str = request.data.get('date', str(date.today()))
        category_suggestion = request.data.get('category_suggestion', 'Groceries')
        items = request.data.get('items', [])
        raw_text = request.data.get('raw_text', '')

        receipt = ReceiptService.process_receipt_upload(
            user=request.user,
            merchant_name=merchant_name,
            total_amount=total_amount,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            date_str=date_str,
            category_suggestion=category_suggestion,
            items=items,
            raw_text=raw_text
        )

        return Response(ReceiptSerializer(receipt).data, status=status.HTTP_201_CREATED)


class ReceiptConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        category_name = request.data.get('category_name')
        custom_amount = request.data.get('amount')
        custom_merchant = request.data.get('merchant_name')

        try:
            tx = ReceiptService.confirm_receipt(
                user=request.user,
                receipt_id=pk,
                category_name=category_name,
                custom_amount=float(custom_amount) if custom_amount else None,
                custom_merchant=custom_merchant
            )
            return Response({
                "success": True,
                "message": "Receipt confirmed and transaction added to ledger.",
                "transaction": TransactionSerializer(tx).data
            })
        except Receipt.DoesNotExist:
            return Response({"error": "Receipt not found"}, status=status.HTTP_404_NOT_FOUND)


class ReceiptRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            ReceiptService.reject_receipt(request.user, pk)
            return Response({"success": True, "message": "Receipt dismissed."})
        except Receipt.DoesNotExist:
            return Response({"error": "Receipt not found"}, status=status.HTTP_404_NOT_FOUND)


# =========================================================================
# 4. DUPLICATE TRANSACTION DETECTION
# =========================================================================

class DuplicateTransactionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        txs = Transaction.objects.filter(
            user=request.user,
            type='EXPENSE',
            date__gte=date.today() - timedelta(days=60)
        ).select_related('merchant', 'category').order_by('-date')

        potential_duplicates = []
        seen = []

        for t in txs:
            for s in seen:
                # Same merchant and same amount within 48h
                if (
                    t.merchant_id and s.merchant_id and t.merchant_id == s.merchant_id
                    and abs(t.amount - s.amount) < Decimal('1.00')
                    and abs((t.date - s.date).days) <= 2
                ):
                    potential_duplicates.append({
                        "id": f"dup_{t.id}_{s.id}",
                        "merchant": t.merchant.name if t.merchant else (t.description or "Expense"),
                        "amount": float(t.amount),
                        "original_date": str(s.date),
                        "duplicate_date": str(t.date),
                        "tx_1_id": str(s.id),
                        "tx_2_id": str(t.id),
                        "time_difference_days": abs((t.date - s.date).days)
                    })
            seen.append(t)

        return Response({
            "success": True,
            "duplicate_count": len(potential_duplicates),
            "duplicates": potential_duplicates[:10]
        })


# =========================================================================
# 5. SMART NOTIFICATIONS & PREFERENCES
# =========================================================================

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Notification.objects.filter(user=user)

        # If user has no notifications yet, generate seed notification
        if not qs.exists():
            Notification.objects.create(
                user=user,
                notification_type='INSIGHT_AVAILABLE',
                title='Welcome to MONVEX 2.0 Financial Intelligence',
                message='Your real-time financial tracking, cash flow forecast, and What-If simulator are active.',
                severity='INFO',
                action_url='/dashboard'
            )
            qs = Notification.objects.filter(user=user)

        notif_type = self.request.query_params.get('type')
        if notif_type:
            qs = qs.filter(notification_type=notif_type)

        return qs.order_by('-created_at')[:30]


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, user=request.user)
            notif.is_read = True
            notif.save(update_fields=['is_read'])
            return Response({"success": True})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)


class NotificationClearAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user).update(is_read=True)
        return Response({"success": True, "message": "All notifications marked as read."})


# =========================================================================
# 6. "WHY?" VARIANCE ATTRIBUTION & MONTHLY REPORT
# =========================================================================

class WhyExplainerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category')
        data = WhyExplainerService.explain_spending_variance(request.user, category)
        return Response({"success": True, **data})


class MonthlyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        cur_start = today.replace(day=1)

        dash = FinanceService.get_dashboard_metrics(user)
        budgets = BudgetService.get_budget_overview(user)
        why = WhyExplainerService.explain_spending_variance(user)
        net_worth = NetWorthService.calculate_net_worth(user)

        report = {
            "month_year": cur_start.strftime("%B %Y"),
            "generated_at": str(today),
            "executive_summary": {
                "total_inflow": dash['monthly_income'],
                "total_outflow": dash['monthly_expense'],
                "net_savings": dash['net_savings'],
                "savings_rate_pct": dash['savings_rate'],
                "health_score": dash['health_score']['score'],
                "health_grade": dash['health_score']['grade'],
                "net_worth": net_worth['net_worth']
            },
            "top_categories": dash['category_breakdown'][:5],
            "budgets_performance": budgets,
            "spending_variance_insight": why['summary'],
            "variance_drivers": why['top_category_drivers'],
            "active_subscriptions_count": RecurringPayment.objects.filter(user=user, is_active=True).count()
        }

        return Response({"success": True, "report": report})


# =========================================================================
# 7. UNIVERSAL SEARCH (USER-SCOPED MULTI-ENTITY AGGREGATOR)
# =========================================================================

class UniversalSearchView(APIView):
    """
    GET /api/v1/search/?q={query}&limit=5
    Executes user-scoped multi-entity search across transactions, accounts, budgets, goals, AI chats and navigation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from services.search_service import SearchService
        query = request.query_params.get('q', '')
        limit = request.query_params.get('limit', 5)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 5

        data = SearchService.search(request.user, query=query, limit=limit)
        return Response(data, status=status.HTTP_200_OK)

