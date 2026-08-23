from django.urls import path
from .views import (
    TransactionListCreateView,
    TransactionDetailView,
    TransactionExportCSVView,
    CategoryListCreateView,
    NaturalLanguageParseView,
    RecurringPaymentListCreateView,
    RecurringPaymentDetailView
)
from .views_extra import (
    AssetListCreateView,
    AssetDetailView,
    LiabilityListCreateView,
    LiabilityDetailView,
    NetWorthOverviewView,
    DebtPlannerOverviewView,
    DebtSimulateExtraPaymentView,
    ReceiptListView,
    ReceiptUploadView,
    ReceiptConfirmView,
    ReceiptRejectView,
    DuplicateTransactionsView,
    NotificationListView,
    NotificationMarkReadView,
    NotificationClearAllView,
    WhyExplainerView,
    MonthlyReportView,
    UniversalSearchView
)

urlpatterns = [
    # Core Transactions & Search
    path('', TransactionListCreateView.as_view(), name='transaction_list_create'),
    path('search/', UniversalSearchView.as_view(), name='transaction_search'),
    path('export/', TransactionExportCSVView.as_view(), name='transaction_export_csv'),
    path('parse-natural/', NaturalLanguageParseView.as_view(), name='transaction_parse_natural'),
    path('categories/', CategoryListCreateView.as_view(), name='category_list_create'),
    path('recurring/', RecurringPaymentListCreateView.as_view(), name='recurring_list_create'),
    path('recurring/<uuid:pk>/', RecurringPaymentDetailView.as_view(), name='recurring_detail'),
    path('duplicates/', DuplicateTransactionsView.as_view(), name='transaction_duplicates'),
    
    # Net Worth: Assets & Liabilities
    path('assets/', AssetListCreateView.as_view(), name='asset_list_create'),
    path('assets/<uuid:pk>/', AssetDetailView.as_view(), name='asset_detail'),
    path('liabilities/', LiabilityListCreateView.as_view(), name='liability_list_create'),
    path('liabilities/<uuid:pk>/', LiabilityDetailView.as_view(), name='liability_detail'),
    path('net-worth/', NetWorthOverviewView.as_view(), name='net_worth_overview'),

    # Debt & Loan Amortization Planner
    path('debt-planner/', DebtPlannerOverviewView.as_view(), name='debt_planner_overview'),
    path('debt-simulate/', DebtSimulateExtraPaymentView.as_view(), name='debt_simulate_extra'),

    # Receipt Intelligence Studio
    path('receipts/', ReceiptListView.as_view(), name='receipt_list'),
    path('receipts/upload/', ReceiptUploadView.as_view(), name='receipt_upload'),
    path('receipts/<uuid:pk>/confirm/', ReceiptConfirmView.as_view(), name='receipt_confirm'),
    path('receipts/<uuid:pk>/reject/', ReceiptRejectView.as_view(), name='receipt_reject'),

    # Smart Alerts & Notifications
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<uuid:pk>/read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('notifications/clear-all/', NotificationClearAllView.as_view(), name='notification_clear_all'),

    # Variance Attribution & Monthly Statement
    path('why/', WhyExplainerView.as_view(), name='why_explainer'),
    path('report/monthly/', MonthlyReportView.as_view(), name='monthly_report'),

    path('<uuid:pk>/', TransactionDetailView.as_view(), name='transaction_detail'),
]
