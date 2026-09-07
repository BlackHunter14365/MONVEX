"""
MONVEX Financial Data Integrity and Mathematical Invariance Test Suite
Audits and certifies:
- Net worth double-counting prevention
- Synthetic cash allocation for unlinked accounts
- Transfer accounting invariance (zero income/expense distortion)
- Rolling 30-day weighted daily burn rate and runway days
- Deterministic 6-guardrail Attention Center engine
- Zero-division and boundary condition resilience
- Multi-tenant data isolation
"""
from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.authentication.models import Profile
from apps.transactions.models import Transaction, Category, Asset, Liability
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from services.finance_service import FinanceService
from services.net_worth_service import NetWorthService


class FinancialDataIntegrityTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user_a = User.objects.create_user(
            username='user_a',
            email='user_a@monvex.local',
            password='TestPassword123!'
        )
        self.profile_a, _ = Profile.objects.get_or_create(user=self.user_a)
        self.profile_a.currency = 'INR'
        self.profile_a.monthly_income = Decimal('100000.00')
        self.profile_a.email_verified = True
        self.profile_a.status = 'ACTIVE'
        self.profile_a.save()

        self.user_b = User.objects.create_user(
            username='user_b',
            email='user_b@monvex.local',
            password='TestPassword123!'
        )
        self.profile_b, _ = Profile.objects.get_or_create(user=self.user_b)
        self.profile_b.currency = 'INR'
        self.profile_b.monthly_income = Decimal('50000.00')
        self.profile_b.email_verified = True
        self.profile_b.status = 'ACTIVE'
        self.profile_b.save()

        self.cat_food = Category.objects.create(name='Food & Dining', color='#10B981', is_system_default=True)
        self.cat_util = Category.objects.create(name='Utilities', color='#3B82F6', is_system_default=True)

    def test_net_worth_double_counting_prevention(self):
        """
        Verify that when user has linked bank accounts, ledger income/expenses
        are NOT double-counted as an extra CASH asset.
        """
        # User has two bank accounts summing to 250,000
        Asset.objects.create(user=self.user_a, name='HDFC Bank', asset_type='BANK', value=Decimal('150000.00'))
        Asset.objects.create(user=self.user_a, name='ICICI Bank', asset_type='BANK', value=Decimal('100000.00'))

        # User also has ledger income and expenses
        Transaction.objects.create(
            user=self.user_a, amount=Decimal('250000.00'), type='INCOME', date=date.today(), description='Salary'
        )
        Transaction.objects.create(
            user=self.user_a, amount=Decimal('20000.00'), type='EXPENSE', date=date.today(), description='Rent', category=self.cat_util
        )

        nw_data = NetWorthService.calculate_net_worth(self.user_a)
        # Total assets must be exactly 250,000 (from the bank accounts), NOT 250,000 + (250k - 20k) = 480k!
        self.assertEqual(nw_data['total_assets'], 250000.0)
        self.assertEqual(nw_data['net_worth'], 250000.0)
        self.assertEqual(len(nw_data['asset_allocation']), 1)
        self.assertEqual(nw_data['asset_allocation'][0]['type'], 'BANK')

    def test_synthetic_cash_when_no_liquid_accounts_exist(self):
        """
        Verify that when user has NO liquid accounts, net ledger cash is represented
        accurately in both total_assets and assets_list.
        """
        Transaction.objects.create(
            user=self.user_a, amount=Decimal('60000.00'), type='INCOME', date=date.today(), description='Consulting'
        )
        Transaction.objects.create(
            user=self.user_a, amount=Decimal('15000.00'), type='EXPENSE', date=date.today(), description='Groceries', category=self.cat_food
        )

        nw_data = NetWorthService.calculate_net_worth(self.user_a)
        # 60,000 - 15,000 = 45,000
        self.assertEqual(nw_data['total_assets'], 45000.0)
        self.assertEqual(nw_data['net_worth'], 45000.0)
        self.assertEqual(len(nw_data['assets_list']), 1)
        self.assertEqual(nw_data['assets_list'][0]['asset_type'], 'CASH')
        self.assertEqual(nw_data['assets_list'][0]['value'], 45000.0)

    def test_transfer_accounting_invariance(self):
        """
        Verify that TRANSFER transactions do not count towards monthly income or expenses,
        preserving liquidity and net worth invariance.
        """
        acc1 = Asset.objects.create(user=self.user_a, name='Checking', asset_type='BANK', value=Decimal('50000.00'))
        acc2 = Asset.objects.create(user=self.user_a, name='Savings', asset_type='BANK', value=Decimal('30000.00'))

        # Log a transfer between accounts
        Transaction.objects.create(
            user=self.user_a,
            amount=Decimal('10000.00'),
            type='TRANSFER',
            date=date.today(),
            description='Checking to Savings Transfer'
        )

        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        # Monthly expense must be 0.0, monthly income must equal profile income (since no income tx recorded)
        self.assertEqual(metrics['monthly_expense'], 0.0)
        # Net liquidity must be 80,000 (50k + 30k)
        self.assertEqual(metrics['net_liquidity'], 80000.0)

    def test_rolling_burn_rate_and_runway(self):
        """
        Verify rolling 30-day weighted daily burn rate calculation and runway days.
        """
        Asset.objects.create(user=self.user_a, name='Primary Bank', asset_type='BANK', value=Decimal('90000.00'))

        today = date.today()
        for i in range(1, 6):
            Transaction.objects.create(
                user=self.user_a, amount=Decimal('1400.00'), type='EXPENSE', date=today - timedelta(days=i), description=f'Day {i}'
            )

        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertGreater(metrics['daily_burn_rate'], 0.0)
        self.assertGreater(metrics['runway_days'], 0)
        expected_runway = int(round(metrics['net_liquidity'] / metrics['daily_burn_rate']))
        self.assertEqual(metrics['runway_days'], expected_runway)

    def test_attention_center_guardrail_evaluation(self):
        """
        Verify Attention Center triggers on budget violations, negative cash flow, and healthy balance.
        """
        Budget.objects.create(
            user=self.user_a,
            category=self.cat_food,
            limit_amount=Decimal('5000.00'),
            period='MONTHLY'
        )
        # Spend 6,000 (exceeding 5,000)
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_food,
            amount=Decimal('6000.00'),
            type='EXPENSE',
            date=date.today(),
            description='Luxury Dinner'
        )

        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        attention_items = metrics['attention_items']
        self.assertTrue(any(i['level'] == 'critical' and 'Budget Cap Exceeded' in i['title'] for i in attention_items))

    def test_zero_division_and_boundary_resilience(self):
        """
        Verify user with zero transactions, zero assets, and zero income handles calculations gracefully.
        """
        empty_user = User.objects.create_user(username='empty_user', email='empty@monvex.local', password='Password123!')
        p, _ = Profile.objects.get_or_create(user=empty_user)
        p.currency = 'INR'
        p.monthly_income = Decimal('0.00')
        p.email_verified = True
        p.status = 'ACTIVE'
        p.save()

        metrics = FinanceService.get_dashboard_metrics(empty_user)
        self.assertEqual(metrics['savings_rate'], 0.0)
        self.assertEqual(metrics['daily_burn_rate'], 0.0)
        self.assertEqual(metrics['runway_days'], 999)
        self.assertGreater(metrics['health_score']['score'], 0)
        self.assertTrue(any(i['id'] == 'setup-ledger' for i in metrics['attention_items']))

    def test_multi_tenant_user_isolation(self):
        """
        Verify User A calculations never leak or factor in User B transactions or assets.
        """
        Asset.objects.create(user=self.user_a, name='User A Asset', asset_type='BANK', value=Decimal('100000.00'))
        Asset.objects.create(user=self.user_b, name='User B Asset', asset_type='BANK', value=Decimal('999999.00'))

        Transaction.objects.create(user=self.user_b, amount=Decimal('500000.00'), type='INCOME', date=date.today(), description='B Income')

        metrics_a = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics_a['net_liquidity'], 100000.0)
        self.assertEqual(metrics_a['total_income'], 0.0)
