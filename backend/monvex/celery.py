"""
Celery Configuration for MONVEX Background Tasks & Scheduled Beats
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'monvex.settings')

app = Celery('monvex')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Periodic Schedules
app.conf.beat_schedule = {
    'nightly-anomaly-detection': {
        'task': 'apps.transactions.tasks.scan_all_anomalies',
        'schedule': crontab(hour=2, minute=0), # 2:00 AM daily
    },
    'daily-recurring-payment-check': {
        'task': 'apps.transactions.tasks.process_due_recurring_payments',
        'schedule': crontab(hour=6, minute=0), # 6:00 AM daily
    },
}
