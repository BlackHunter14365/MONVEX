from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta

from apps.transactions.models import (
    Transaction, Category, Merchant, Asset, Liability, Receipt, Notification, RecurringPayment
)
from apps.goals.models import SavingsGoal
from apps.budgets.models import Budget
from services.simulator_service import SimulatorService
from services.debt_service import DebtService
from services.net_worth_service import NetWorthService
from services.receipt_service import ReceiptService
from services.why_explainer_service import WhyExplainerService


class FinancialEnginesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            username='investor_a',
            email='investor_a@monvex.local',
            password='HardenedPassword123!@#'
        )
        self.user_b = User.objects.create_user(
            username='investor_b',
            email='investor_b@monvex.local',
            password='HardenedPassword123!@#'
        )
        self.client.force_authenticate(user=self.user_a)

        # Seed categories
        self.cat_food = Category.objects.create(name='Food & Dining', type='EXPENSE', color='#F59E0B')
        self.cat_shop = Category.objects.create(name='Shopping', type='EXPENSE', color='#EC4899')
        self.cat_sal = Category.objects.create(name='Salary', type='INCOME', color='#10B981')

        # Seed transactions for User A
        Transaction.objects.create(
            user=self.user_a,
            amount=Decimal('80000.00'),
            type='INCOME',
            date=date.today().replace(day=1),
            category=self.cat_sal
        )
        Transaction.objects.create(
            user=self.user_a,
            amount=Decimal('8000.00'),
            type='EXPENSE',
            date=date.today(),
            category=self.cat_food
        )
        Transaction.objects.create(
            user=self.user_a,
            amount=Decimal('4000.00'),
            type='EXPENSE',
            date=date.today(),
            category=self.cat_shop
        )

        # Seed Savings Goal
        self.goal = SavingsGoal.objects.create(
            user=self.user_a,
            title='Emergency Runway Fund',
            target_amount=Decimal('200000.00'),
            current_amount=Decimal('50000.00'),
            monthly_commitment=Decimal('15000.00')
        )

    def test_simulator_engine_deterministic_calculations(self):
        """Test What-If simulator computes exact category cuts, goal acceleration, and SIP growth"""
        res = SimulatorService.run_simulation(
            user=self.user_a,
            income_delta=10000.0,
            category_cuts={"Food & Dining": 20.0},
            extra_monthly_savings=5000.0,
            timeframe_months=12
        )
        self.assertIn("baseline", res)
        self.assertIn("simulated", res)
        self.assertGreater(res['simulated']['monthly_surplus'], res['baseline']['monthly_surplus'])
        self.assertGreater(res['compounded_growth']['five_year_horizon']['simulated_corpus'], 0)

        # Verify goal acceleration
        self.assertGreater(len(res['goal_impacts']), 0)
        self.assertEqual(res['goal_impacts'][0]['status'], 'ACCELERATED')

    def test_debt_service_emi_and_prepayment_simulation(self):
        """Test standard EMI formula and extra payment savings"""
        emi = DebtService.calculate_emi(500000.0, 10.5, 60)
        self.assertAlmostEqual(emi, 10747.0, delta=15.0)

        sim = DebtService.simulate_extra_payment(500000.0, 10.5, emi, extra_monthly_payment=3000.0)
        self.assertGreater(sim['months_saved'], 5)
        self.assertGreater(sim['interest_saved'], 10000.0)

    def test_net_worth_service_asset_and_liability_aggregation(self):
        """Test Net Worth = Total Assets - Total Liabilities calculation"""
        Asset.objects.create(user=self.user_a, name='HDFC Wealth', asset_type='BANK', value=Decimal('250000.00'))
        Asset.objects.create(user=self.user_a, name='Nifty 50 Index', asset_type='INVESTMENT', value=Decimal('400000.00'))
        Liability.objects.create(user=self.user_a, name='Car Loan', liability_type='AUTO_LOAN', principal_amount=Decimal('300000.00'), remaining_balance=Decimal('200000.00'), monthly_emi=Decimal('8500.00'))

        data = NetWorthService.calculate_net_worth(self.user_a)
        self.assertGreaterEqual(data['total_assets'], 650000.0)
        self.assertEqual(data['total_liabilities'], 200000.0)
        self.assertGreaterEqual(data['net_worth'], 450000.0)
        self.assertEqual(data['solvency_status'], 'STRONG')

    def test_receipt_processing_and_confirmation_lifecycle(self):
        """Test receipt is initially PENDING, and creates Transaction ONLY when confirmed"""
        receipt = ReceiptService.process_receipt_upload(
            user=self.user_a,
            merchant_name='Nature Basket',
            total_amount=2450.0,
            category_suggestion='Groceries'
        )
        self.assertEqual(receipt.status, 'PENDING_REVIEW')
        self.assertIsNone(receipt.confirmed_transaction)

        # Confirm receipt
        tx = ReceiptService.confirm_receipt(self.user_a, str(receipt.id), category_name='Groceries')
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, 'CONFIRMED')
        self.assertEqual(receipt.confirmed_transaction, tx)
        self.assertEqual(tx.amount, Decimal('2450.00'))
        self.assertEqual(tx.source, 'RECEIPT')

    def test_why_explainer_variance_attribution(self):
        """Test 'Why?' engine identifies spending deltas and top category contributors"""
        why = WhyExplainerService.explain_spending_variance(self.user_a)
        self.assertIn("current_month_total", why)
        self.assertIn("summary", why)
        self.assertIn("top_category_drivers", why)

    def test_user_data_isolation_on_net_worth_and_receipts(self):
        """Ensure User B cannot view or access User A assets or receipts"""
        asset_a = Asset.objects.create(user=self.user_a, name='Private Gold Reserve', asset_type='GOLD', value=Decimal('500000.00'))
        receipt_a = ReceiptService.process_receipt_upload(user=self.user_a, merchant_name='Apple Store', total_amount=89900.0)

        # Authenticate as User B
        self.client.force_authenticate(user=self.user_b)

        # Attempt to access User A's asset
        response = self.client.get(f'/api/v1/transactions/assets/{asset_a.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Attempt to confirm User A's receipt
        response = self.client.post(f'/api/v1/transactions/receipts/{receipt_a.id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
