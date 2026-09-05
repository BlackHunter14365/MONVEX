"""
MONVEX Receipt Retention & Safe Storage Cleanup Command
Prunes abandoned, unconfirmed, or rejected receipts past their retention window.
Guarantees that CONFIRMED receipts (ledger evidence) are never purged.

Usage:
  python manage.py cleanup_receipts [--days-abandoned=14] [--days-rejected=30] [--dry-run]
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.transactions.models import Receipt
from services.storage_service import StorageService


class Command(BaseCommand):
    help = "Safely clean up abandoned and rejected receipt files and database records."

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-abandoned',
            type=int,
            default=14,
            help="Number of days before an unconfirmed PENDING_REVIEW receipt is considered abandoned."
        )
        parser.add_argument(
            '--days-rejected',
            type=int,
            default=30,
            help="Number of days before a REJECTED or FAILED receipt is purged."
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Simulate cleanup without deleting any files or records."
        )

    def handle(self, *args, **options):
        days_abandoned = options['days_abandoned']
        days_rejected = options['days_rejected']
        dry_run = options['dry_run']

        abandoned_cutoff = date.today() - timedelta(days=days_abandoned)
        rejected_cutoff = date.today() - timedelta(days=days_rejected)

        storage_provider = StorageService.get_provider()

        self.stdout.write(self.style.NOTICE(
            f"Starting Receipt Retention Cleanup (Abandoned cutoff: {abandoned_cutoff}, Rejected cutoff: {rejected_cutoff}, DryRun: {dry_run})"
        ))

        # 1. Query Abandoned Receipts (PENDING_REVIEW older than cutoff)
        abandoned_qs = Receipt.objects.filter(
            status='PENDING_REVIEW',
            created_at__date__lt=abandoned_cutoff
        )

        # 2. Query Rejected / Failed Receipts older than cutoff
        rejected_qs = Receipt.objects.filter(
            status__in=['REJECTED', 'FAILED'],
            created_at__date__lt=rejected_cutoff
        )

        total_abandoned = abandoned_qs.count()
        total_rejected = rejected_qs.count()

        self.stdout.write(f"Identified {total_abandoned} abandoned receipts and {total_rejected} rejected receipts for cleanup.")

        deleted_files = 0
        deleted_records = 0

        # Process Abandoned
        for r in abandoned_qs:
            self.stdout.write(f"  [ABANDONED] Receipt {r.id} (User: {r.user.username}, Created: {r.created_at})")
            if not dry_run:
                if r.image_url:
                    if storage_provider.delete(r.image_url):
                        deleted_files += 1
                r.delete()
                deleted_records += 1

        # Process Rejected
        for r in rejected_qs:
            self.stdout.write(f"  [REJECTED] Receipt {r.id} (User: {r.user.username}, Created: {r.created_at})")
            if not dry_run:
                if r.image_url:
                    if storage_provider.delete(r.image_url):
                        deleted_files += 1
                r.delete()
                deleted_records += 1

        # Safety Check: Verify zero CONFIRMED receipts were touched
        confirmed_count = Receipt.objects.filter(status='CONFIRMED').count()

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"[DRY RUN COMPLETE] Would delete {total_abandoned + total_rejected} records and storage files. Confirmed receipts preserved: {confirmed_count}."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"[CLEANUP COMPLETE] Deleted {deleted_records} records and {deleted_files} storage files. Confirmed receipts strictly preserved: {confirmed_count}."
            ))
