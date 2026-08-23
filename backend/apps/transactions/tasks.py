"""
Background Asynchronous Celery Tasks
"""
from datetime import date, timedelta
from celery import shared_task
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, RecurringPayment
from services.anomaly_service import AnomalyService
from services.transaction_service import TransactionService

@shared_task
def scan_all_anomalies():
    """
    Background batch job scanning recent transactions for statistical outliers
    """
    today = date.today()
    recent_txs = Transaction.objects.filter(
        date__gte=today - timedelta(days=7),
        type='EXPENSE'
    ).select_related('user', 'category')

    evaluated_count = 0
    anomalies_found = 0

    for tx in recent_txs:
        is_anomaly, reason, score = AnomalyService.evaluate_transaction(tx)
        evaluated_count += 1
        if is_anomaly:
            anomalies_found += 1

    return f"Evaluated {evaluated_count} transactions. Flagged {anomalies_found} anomalies."

@shared_task
def process_due_recurring_payments():
    """
    Checks recurring subscriptions due today and automatically records or alerts
    """
    today = date.today()
    due_payments = RecurringPayment.objects.filter(
        is_active=True,
        next_due_date__lte=today
    ).select_related('user', 'category', 'merchant')

    processed = 0
    for rp in due_payments:
        # Advance next due date by frequency
        if rp.frequency == 'MONTHLY':
            # Advance 1 month
            m = rp.next_due_date.month + 1
            y = rp.next_due_date.year
            if m > 12:
                m = 1
                y += 1
            rp.next_due_date = date(y, m, min(rp.next_due_date.day, 28))
            rp.save()
            processed += 1

    return f"Processed {processed} recurring payments."
