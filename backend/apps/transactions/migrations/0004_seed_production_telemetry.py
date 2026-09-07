from datetime import date, timedelta
from decimal import Decimal
import uuid
from django.db import migrations
from django.contrib.auth.hashers import make_password

def seed_production_telemetry(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Profile = apps.get_model('authentication', 'Profile')
    Category = apps.get_model('transactions', 'Category')
    Merchant = apps.get_model('transactions', 'Merchant')
    Transaction = apps.get_model('transactions', 'Transaction')
    RecurringPayment = apps.get_model('transactions', 'RecurringPayment')
    Asset = apps.get_model('transactions', 'Asset')
    Budget = apps.get_model('budgets', 'Budget')
    SavingsGoal = apps.get_model('goals', 'SavingsGoal')
    GoalContribution = apps.get_model('goals', 'GoalContribution')

    usernames = ['alex', 'alex_monvex']
    today = date.today()

    # Ensure system categories exist
    category_defs = [
        ('Salary & Income', 'INCOME', 'briefcase', '#10B981'),
        ('Housing & Rent', 'EXPENSE', 'home', '#6366F1'),
        ('Bills & Utilities', 'EXPENSE', 'zap', '#F59E0B'),
        ('Groceries', 'EXPENSE', 'shopping-cart', '#10B981'),
        ('Food & Dining', 'EXPENSE', 'utensils', '#EC4899'),
        ('Shopping', 'EXPENSE', 'shopping-bag', '#8B5CF6'),
        ('Transportation', 'EXPENSE', 'car', '#3B82F6'),
        ('Entertainment', 'EXPENSE', 'film', '#F97316'),
    ]

    cat_map = {}
    for name, cat_type, icon, color in category_defs:
        cat = Category.objects.filter(name=name).first()
        if not cat:
            cat = Category.objects.create(
                name=name,
                type=cat_type,
                icon=icon,
                color=color,
                is_system_default=True,
                user=None
            )
        cat_map[name] = cat

    # Ensure merchants exist
    merchants = ['Blinkit', 'Zomato', 'Amazon', 'Swiggy', 'Uber', 'Netflix', 'ACT Broadband']
    merchant_map = {}
    for m_name in merchants:
        m = Merchant.objects.filter(name=m_name).first()
        if not m:
            m = Merchant.objects.create(
                name=m_name,
                normalized_name=m_name.lower().strip()
            )
        merchant_map[m_name] = m

    for username in usernames:
        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.create(
                username=username,
                email=f'{username}@monvex.ai',
                first_name='Alex',
                last_name='Vance',
                password=make_password('AlexDemo2026!'),
                is_active=True
            )
        else:
            user.password = make_password('AlexDemo2026!')
            user.is_active = True
            user.save()

        # Update or create Profile
        profile = Profile.objects.filter(user=user).first()
        if not profile:
            profile = Profile.objects.create(
                user=user,
                currency='INR',
                monthly_income=Decimal('75000.00'),
                savings_target_percentage=Decimal('25.00'),
                email_verified=True,
                is_verified=True,
                status='ACTIVE'
            )
        else:
            profile.currency = 'INR'
            profile.monthly_income = Decimal('75000.00')
            profile.savings_target_percentage = Decimal('25.00')
            profile.email_verified = True
            profile.is_verified = True
            profile.status = 'ACTIVE'
            profile.save()

        # Ensure Linked Bank Assets exist
        if not Asset.objects.filter(user=user, name='HDFC Salary Account').exists():
            Asset.objects.create(
                user=user,
                name='HDFC Salary Account',
                asset_type='BANK',
                value=Decimal('125000.00'),
                institution='HDFC Bank',
                notes='{"theme": "sapphire", "lastFour": "4892", "accountType": "SAVINGS", "network": "VISA"}'
            )

        if not Asset.objects.filter(user=user, name='ICICI Wealth Reserve').exists():
            Asset.objects.create(
                user=user,
                name='ICICI Wealth Reserve',
                asset_type='BANK',
                value=Decimal('145730.00'),
                institution='ICICI Bank',
                notes='{"theme": "obsidian", "lastFour": "6712", "accountType": "CHECKING", "network": "MASTERCARD"}'
            )

        # Seed Transactions if user has none
        if Transaction.objects.filter(user=user).count() == 0:
            for i in range(5, -1, -1):
                m = today.month - i
                y = today.year
                while m <= 0:
                    m += 12
                    y -= 1
                month_date = date(y, m, 1)

                # Salary on 1st
                Transaction.objects.create(
                    user=user,
                    amount=Decimal('75000.00'),
                    type='INCOME',
                    date=month_date,
                    description='Monthly Corporate Salary Credited',
                    category=cat_map.get('Salary & Income'),
                    source='IMPORT',
                    confidence=Decimal('1.00')
                )

                # Rent on 2nd
                Transaction.objects.create(
                    user=user,
                    amount=Decimal('18000.00'),
                    type='EXPENSE',
                    date=month_date + timedelta(days=1),
                    description='House Rent Transfer to Landlord',
                    category=cat_map.get('Housing & Rent'),
                    source='MANUAL',
                    confidence=Decimal('1.00')
                )

                # Utilities on 5th
                Transaction.objects.create(
                    user=user,
                    amount=Decimal('2850.00'),
                    type='EXPENSE',
                    date=month_date + timedelta(days=4),
                    description='Electricity & ACT Broadband Bills',
                    category=cat_map.get('Bills & Utilities'),
                    source='MANUAL',
                    confidence=Decimal('1.00')
                )

                # Groceries on 8th
                Transaction.objects.create(
                    user=user,
                    amount=Decimal('4200.00'),
                    type='EXPENSE',
                    date=month_date + timedelta(days=8),
                    description='Blinkit & D-Mart monthly grocery stock',
                    category=cat_map.get('Groceries'),
                    merchant=merchant_map.get('Blinkit'),
                    source='RECEIPT',
                    confidence=Decimal('1.00')
                )

                # Dining on 14th
                Transaction.objects.create(
                    user=user,
                    amount=Decimal('1250.00'),
                    type='EXPENSE',
                    date=month_date + timedelta(days=14),
                    description='Dinner at Barbeque Nation',
                    category=cat_map.get('Food & Dining'),
                    merchant=merchant_map.get('Zomato'),
                    source='VOICE',
                    confidence=Decimal('1.00')
                )

                # Shopping on 20th
                Transaction.objects.create(
                    user=user,
                    amount=Decimal('3400.00'),
                    type='EXPENSE',
                    date=month_date + timedelta(days=20),
                    description='Amazon electronics & clothing sale',
                    category=cat_map.get('Shopping'),
                    merchant=merchant_map.get('Amazon'),
                    source='AI',
                    confidence=Decimal('1.00')
                )

            # Current Month Extra Transactions
            Transaction.objects.create(
                user=user,
                amount=Decimal('620.00'),
                type='EXPENSE',
                date=today - timedelta(days=1),
                description='Swiggy biryani dinner delivery',
                category=cat_map.get('Food & Dining'),
                merchant=merchant_map.get('Swiggy'),
                source='VOICE',
                confidence=Decimal('1.00')
            )

            Transaction.objects.create(
                user=user,
                amount=Decimal('450.00'),
                type='EXPENSE',
                date=today,
                description='Uber cab ride to meeting',
                category=cat_map.get('Transportation'),
                merchant=merchant_map.get('Uber'),
                source='MANUAL',
                confidence=Decimal('1.00')
            )

        # Seed Budgets if none
        if Budget.objects.filter(user=user).count() == 0:
            if cat_map.get('Food & Dining'):
                Budget.objects.create(user=user, category=cat_map['Food & Dining'], limit_amount=Decimal('8000.00'), period='MONTHLY', is_active=True)
            if cat_map.get('Groceries'):
                Budget.objects.create(user=user, category=cat_map['Groceries'], limit_amount=Decimal('6000.00'), period='MONTHLY', is_active=True)
            if cat_map.get('Shopping'):
                Budget.objects.create(user=user, category=cat_map['Shopping'], limit_amount=Decimal('5000.00'), period='MONTHLY', is_active=True)

        # Seed Goals if none
        if SavingsGoal.objects.filter(user=user).count() == 0:
            g1 = SavingsGoal.objects.create(
                user=user,
                title='6-Month Emergency Fund',
                target_amount=Decimal('150000.00'),
                current_amount=Decimal('65000.00'),
                deadline=today + timedelta(days=120),
                monthly_commitment=Decimal('15000.00'),
                status='IN_PROGRESS'
            )
            GoalContribution.objects.create(goal=g1, amount=Decimal('15000.00'), date=today, notes='Monthly allocation')

            SavingsGoal.objects.create(
                user=user,
                title='MacBook Pro M-Series',
                target_amount=Decimal('200000.00'),
                current_amount=Decimal('80000.00'),
                deadline=today + timedelta(days=90),
                monthly_commitment=Decimal('20000.00'),
                status='IN_PROGRESS'
            )

        # Seed Recurring Payments if none
        if RecurringPayment.objects.filter(user=user).count() == 0:
            RecurringPayment.objects.create(
                user=user,
                name='Netflix Premium 4K',
                amount=Decimal('649.00'),
                frequency='MONTHLY',
                next_due_date=today + timedelta(days=12),
                is_active=True,
                merchant=merchant_map.get('Netflix')
            )
            RecurringPayment.objects.create(
                user=user,
                name='ACT Broadband Fiber',
                amount=Decimal('1099.00'),
                frequency='MONTHLY',
                next_due_date=today + timedelta(days=8),
                is_active=True,
                merchant=merchant_map.get('ACT Broadband')
            )


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0003_asset_liability_notification_receipt'),
        ('budgets', '0001_initial'),
        ('goals', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_production_telemetry, reverse_code=migrations.RunPython.noop),
    ]
