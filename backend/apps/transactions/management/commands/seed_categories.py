"""
Management command to seed default categories
"""
from django.core.management.base import BaseCommand
from apps.transactions.models import Category

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "type": "EXPENSE", "icon": "utensils", "color": "#F59E0B"},
    {"name": "Groceries", "type": "EXPENSE", "icon": "shopping-cart", "color": "#10B981"},
    {"name": "Transportation", "type": "EXPENSE", "icon": "car", "color": "#3B82F6"},
    {"name": "Shopping", "type": "EXPENSE", "icon": "shopping-bag", "color": "#EC4899"},
    {"name": "Bills & Utilities", "type": "EXPENSE", "icon": "zap", "color": "#8B5CF6"},
    {"name": "Housing & Rent", "type": "EXPENSE", "icon": "home", "color": "#EF4444"},
    {"name": "Entertainment", "type": "EXPENSE", "icon": "film", "color": "#6366F1"},
    {"name": "Health & Medical", "type": "EXPENSE", "icon": "heart", "color": "#14B8A6"},
    {"name": "Salary & Income", "type": "INCOME", "icon": "briefcase", "color": "#10B981"},
    {"name": "Investments & Returns", "type": "INCOME", "icon": "trending-up", "color": "#06B6D4"},
    {"name": "Other Expense", "type": "EXPENSE", "icon": "more-horizontal", "color": "#6B7280"},
    {"name": "Other Income", "type": "INCOME", "icon": "plus-circle", "color": "#34D399"},
]

class Command(BaseCommand):
    help = 'Seeds standard default system categories'

    def handle(self, *args, **options):
        count = 0
        for item in DEFAULT_CATEGORIES:
            cat, created = Category.objects.get_or_create(
                name=item['name'],
                defaults={
                    'type': item['type'],
                    'icon': item['icon'],
                    'color': item['color'],
                    'is_system_default': True
                }
            )
            if created:
                count += 1
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} default categories."))
