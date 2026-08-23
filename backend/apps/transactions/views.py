"""
Transactions Views with Anti-CSV-Injection Export & Query Filtering
"""
import csv
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Merchant, Transaction, RecurringPayment
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    CreateTransactionInputSerializer,
    NaturalLanguageParseInputSerializer,
    RecurringPaymentSerializer
)
from services.transaction_service import TransactionService
from services.anomaly_service import AnomalyService

class CategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        cat_type = self.request.query_params.get('type')
        qs = Category.objects.filter(Q(is_system_default=True) | Q(user=self.request.user))
        if cat_type:
            qs = qs.filter(type=cat_type.upper())
        return qs.order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_system_default=False)

class TransactionListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).select_related('category', 'merchant')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        tx_type = self.request.query_params.get('type')
        category_id = self.request.query_params.get('category')
        search = self.request.query_params.get('search')

        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        if tx_type:
            qs = qs.filter(type=tx_type.upper())
        if category_id:
            qs = qs.filter(category_id=category_id)
        if search:
            qs = qs.filter(
                Q(description__icontains=search) |
                Q(merchant__normalized_name__icontains=search) |
                Q(category__name__icontains=search)
            )
        return qs.order_by('-date', '-created_at')

    def create(self, request, *args, **kwargs):
        input_serializer = CreateTransactionInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        tx = TransactionService.create_transaction(
            user=request.user,
            amount=data['amount'],
            type=data.get('type', 'EXPENSE'),
            date_val=data.get('date'),
            description=data.get('description', ''),
            category_id=data.get('category_id'),
            category_name=data.get('category_name'),
            merchant_name=data.get('merchant_name'),
            source=data.get('source', 'MANUAL'),
            raw_text=data.get('raw_text', '')
        )

        # Trigger anomaly evaluation
        AnomalyService.evaluate_transaction(tx)

        output_serializer = TransactionSerializer(tx)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

class TransactionExportCSVView(APIView):
    """
    Secure CSV Ledger Export with Anti-CSV-Injection Formula Sanitization.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def sanitize_field(val: str) -> str:
        s = str(val or '').strip()
        # Formula injection mitigation
        if s.startswith(('=', '+', '-', '@', '\t', '\r')):
            return f"'{s}"
        return s

    def get(self, request):
        txs = Transaction.objects.filter(user=request.user).select_related('category', 'merchant').order_by('-date', '-created_at')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="monvex_ledger_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Type', 'Amount', 'Currency', 'Merchant', 'Category', 'Description', 'Source'])

        for t in txs:
            merchant_name = t.merchant.name if t.merchant else ''
            category_name = t.category.name if t.category else 'General'
            writer.writerow([
                t.date.strftime('%Y-%m-%d'),
                t.type,
                str(t.amount),
                'INR',
                self.sanitize_field(merchant_name),
                self.sanitize_field(category_name),
                self.sanitize_field(t.description),
                t.source
            ])

        return response

class NaturalLanguageParseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = NaturalLanguageParseInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text = serializer.validated_data['text']
        parsed_result = TransactionService.parse_natural_language_transaction(text)
        return Response(parsed_result, status=status.HTTP_200_OK)

class RecurringPaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecurringPaymentSerializer

    def get_queryset(self):
        return RecurringPayment.objects.filter(user=self.request.user).select_related('category', 'merchant')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RecurringPaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RecurringPaymentSerializer

    def get_queryset(self):
        return RecurringPayment.objects.filter(user=self.request.user)
