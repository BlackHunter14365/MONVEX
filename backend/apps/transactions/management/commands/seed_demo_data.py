"""
Management command to seed realistic demo financial telemetry for testing
"""
from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.transactions.models import Category, Merchant, Transaction, RecurringPayment
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal, GoalContribution
from services.transaction_service import TransactionService

class Command(BaseCommand):
    help = 'Seeds demo user accounts with realistic financial history, budgets, and goals'

    def handle(self, *args, **options):
        usernames = ['alex', 'alex_monvex']
        passwords = ['AlexDemo2026!', 'Password123!']

        today = date.today()

        cat_food = Category.objects.filter(name='Food & Dining').first()
        cat_groceries = Category.objects.filter(name='Groceries').first()
        cat_transport = Category.objects.filter(name='Transportation').first()
        cat_shopping = Category.objects.filter(name='Shopping').first()
        cat_bills = Category.objects.filter(name='Bills & Utilities').first()
        cat_housing = Category.objects.filter(name='Housing & Rent').first()
        cat_ent = Category.objects.filter(name='Entertainment').first()
        cat_salary = Category.objects.filter(name='Salary & Income').first()

        for username in usernames:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@monvex.ai',
                    'first_name': 'Alex',
                    'last_name': 'Vance',
                    'is_active': True,
                }
            )
            user.set_password('AlexDemo2026!')
            user.is_active = True
            user.save()

            profile = user.profile
            profile.currency = 'INR'
            profile.monthly_income = Decimal('75000.00')
            profile.savings_target_percentage = Decimal('25.00')
            profile.email_verified = True
            profile.status = 'ACTIVE'
            profile.save()

            # Clear old transactions
            Transaction.objects.filter(user=user).delete()
            Budget.objects.filter(user=user).delete()
            SavingsGoal.objects.filter(user=user).delete()
            RecurringPayment.objects.filter(user=user).delete()

            # Seed 6 months of historical salaries & expenses
            for i in range(5, -1, -1):
                m = today.month - i
                y = today.year
                while m <= 0:
                    m += 12
                    y -= 1
                month_date = date(y, m, 1)

                # Salary on 1st
                TransactionService.create_transaction(
                    user=user,
                    amount=Decimal('75000.00'),
                    type='INCOME',
                    date_val=month_date,
                    description='Monthly Corporate Salary Credited',
                    category_name='Salary & Income',
                    source='IMPORT'
                )

                # Rent on 2nd
                TransactionService.create_transaction(
                    user=user,
                    amount=Decimal('18000.00'),
                    type='EXPENSE',
                    date_val=month_date + timedelta(days=1),
                    description='House Rent Transfer to Landlord',
                    category_name='Housing & Rent',
                    source='MANUAL'
                )

                # Utilities on 5th
                TransactionService.create_transaction(
                    user=user,
                    amount=Decimal('2850.00'),
                    type='EXPENSE',
                    date_val=month_date + timedelta(days=4),
                    description='Electricity & ACT Broadband Bills',
                    category_name='Bills & Utilities',
                    source='MANUAL'
                )

                # Groceries on 8th
                TransactionService.create_transaction(
                    user=user,
                    amount=Decimal('4200.00'),
                    type='EXPENSE',
                    date_val=month_date + timedelta(days=8),
                    description='Blinkit & D-Mart monthly grocery stock',
                    category_name='Groceries',
                    merchant_name='Blinkit',
                    source='RECEIPT'
                )

                # Dining on 14th
                TransactionService.create_transaction(
                    user=user,
                    amount=Decimal('1250.00'),
                    type='EXPENSE',
                    date_val=month_date + timedelta(days=14),
                    description='Dinner at Barbeque Nation',
                    category_name='Food & Dining',
                    merchant_name='Zomato',
                    source='VOICE'
                )

                # Shopping on 20th
                TransactionService.create_transaction(
                    user=user,
                    amount=Decimal('3400.00'),
                    type='EXPENSE',
                    date_val=month_date + timedelta(days=20),
                    description='Amazon electronics & clothing sale',
                    category_name='Shopping',
                    merchant_name='Amazon',
                    source='AI'
                )

            # Current Month Extra Transactions
            TransactionService.create_transaction(
                user=user,
                amount=Decimal('620.00'),
                type='EXPENSE',
                date_val=today - timedelta(days=1),
                description='Swiggy biryani dinner delivery',
                category_name='Food & Dining',
                merchant_name='Swiggy',
                source='VOICE'
            )

            TransactionService.create_transaction(
                user=user,
                amount=Decimal('450.00'),
                type='EXPENSE',
                date_val=today,
                description='Uber cab ride to meeting',
                category_name='Transportation',
                merchant_name='Uber',
                source='MANUAL'
            )

            # Create Budgets
            if cat_food:
                Budget.objects.create(user=user, category=cat_food, limit_amount=Decimal('8000.00'), period='MONTHLY')
            if cat_groceries:
                Budget.objects.create(user=user, category=cat_groceries, limit_amount=Decimal('6000.00'), period='MONTHLY')
            if cat_shopping:
                Budget.objects.create(user=user, category=cat_shopping, limit_amount=Decimal('5000.00'), period='MONTHLY')

            # Create Goals
            g1 = SavingsGoal.objects.create(
                user=user,
                title='6-Month Emergency Fund',
                target_amount=Decimal('150000.00'),
                current_amount=Decimal('65000.00'),
                deadline=today + timedelta(days=120),
                monthly_commitment=Decimal('15000.00')
            )
            GoalContribution.objects.create(goal=g1, amount=Decimal('15000.00'), notes='Monthly allocation')

            g2 = SavingsGoal.objects.create(
                user=user,
                title='MacBook Pro M-Series',
                target_amount=Decimal('200000.00'),
                current_amount=Decimal('80000.00'),
                deadline=today + timedelta(days=90),
                monthly_commitment=Decimal('20000.00')
            )

            # Create Recurring Payments
            RecurringPayment.objects.create(
                user=user,
                name='Netflix Premium 4K',
                amount=Decimal('649.00'),
                frequency='MONTHLY',
                next_due_date=today + timedelta(days=12),
                is_active=True
            )
            RecurringPayment.objects.create(
                user=user,
                name='ACT Broadband Fiber',
                amount=Decimal('1099.00'),
                frequency='MONTHLY',
                next_due_date=today + timedelta(days=8),
                is_active=True
            )

            self.stdout.write(self.style.SUCCESS(f"Successfully seeded demo user '{username}' (Password: AlexDemo2026!)"))
