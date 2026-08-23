"""
MONVEX Service Layer & ML Categorizer Unit Tests
"""
from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from apps.transactions.models import Transaction, Category, Merchant
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from services.transaction_service import TransactionService
from services.budget_service import BudgetService
from services.finance_service import FinanceService
from services.forecast_service import ForecastService
from services.ai_copilot_service import AICopilotService
from ml.categorizer import categorizer

class CoreServicesTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='alex_monvex',
            email='alex@example.com',
            password='Password123!'
        )
        self.user.profile.monthly_income = Decimal('75000.00')
        self.user.profile.save()

    def test_ml_categorizer_accuracy(self):
        """Test ML categorizer on common financial phrases"""
        pred_food = categorizer.predict("Swiggy food order biryani", "Swiggy")
        self.assertEqual(pred_food['category'], "Food & Dining")
        self.assertGreaterEqual(pred_food['confidence'], 0.60)

        pred_uber = categorizer.predict("Uber cab ride to airport", "Uber")
        self.assertEqual(pred_uber['category'], "Transportation")

        pred_netflix = categorizer.predict("Netflix subscription monthly plan", "Netflix")
        self.assertEqual(pred_netflix['category'], "Entertainment")

    def test_merchant_normalization(self):
        """Test merchant name normalization logic"""
        self.assertEqual(TransactionService.normalize_merchant_name("AMZN Mktp IN"), "Amazon")
        self.assertEqual(TransactionService.normalize_merchant_name("swiggy order"), "Swiggy")
        self.assertEqual(TransactionService.normalize_merchant_name("uber india"), "Uber")

    def test_natural_language_parsing(self):
        """Test natural language transaction parsing"""
        parsed = TransactionService.parse_natural_language_transaction("Aaj Swiggy pe 620 rupaye kharch kiye")
        self.assertEqual(parsed['amount'], 620.00)
        self.assertEqual(parsed['merchant'], "Swiggy")
        self.assertEqual(parsed['category'], "Food & Dining")
        self.assertEqual(parsed['type'], "EXPENSE")

    def test_transaction_creation_and_analytics(self):
        """Test transaction creation and dashboard calculation"""
        # Create income
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('75000.00'),
            type='INCOME',
            description='Monthly Salary',
            category_name='Salary & Income'
        )

        # Create food expense
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('1500.00'),
            type='EXPENSE',
            description='Dinner with team',
            merchant_name='Swiggy'
        )

        metrics = FinanceService.get_dashboard_metrics(self.user)
        self.assertEqual(metrics['monthly_income'], 75000.00)
        self.assertEqual(metrics['monthly_expense'], 1500.00)
        self.assertEqual(metrics['net_savings'], 73500.00)
        self.assertGreater(metrics['savings_rate'], 90.0)

    def test_budget_spending_velocity(self):
        """Test budget spending velocity and month-end projection"""
        food_cat = Category.objects.create(name='Food & Dining', type='EXPENSE')
        budget = Budget.objects.create(
            user=self.user,
            category=food_cat,
            limit_amount=Decimal('10000.00')
        )

        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('2000.00'),
            type='EXPENSE',
            category_id=str(food_cat.id),
            description='Groceries & food'
        )

        overview = BudgetService.get_budget_overview(self.user)
        self.assertEqual(len(overview), 1)
        self.assertEqual(overview[0]['limit_amount'], 10000.00)
        self.assertEqual(overview[0]['spent_amount'], 2000.00)
        self.assertEqual(overview[0]['remaining_amount'], 8000.00)
        self.assertIn(overview[0]['status'], ['ON_TRACK', 'WARNING', 'EXCEEDED'])

    def test_financial_health_score(self):
        """Test Financial Health Score calculation"""
        # High savings rate test
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('100000.00'),
            type='INCOME',
            description='Consulting Income'
        )
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('20000.00'),
            type='EXPENSE',
            description='General expenses'
        )

        score_data = FinanceService.calculate_financial_health_score(self.user)
        self.assertGreaterEqual(score_data['score'], 60)
        self.assertIn(score_data['tier'], ['GOOD', 'EXCELLENT'])
        self.assertIn('savings_rate', score_data['breakdown'])

    def test_forecast_service(self):
        """Test Cash Flow forecast calculations"""
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('50000.00'),
            type='INCOME',
            description='Salary'
        )
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('1000.00'),
            type='EXPENSE',
            description='Daily expenses'
        )

        forecast = ForecastService.forecast_cash_flow(self.user, days=30)
        self.assertEqual(forecast['forecast_days'], 30)
        self.assertEqual(len(forecast['daily_trajectory']), 30)
        self.assertLess(forecast['projected_end_balance'], forecast['starting_balance'])

    def test_ai_copilot_controlled_tools(self):
        """Test AI Copilot deterministic response generation"""
        TransactionService.create_transaction(
            user=self.user,
            amount=Decimal('3500.00'),
            type='EXPENSE',
            category_name='Food & Dining',
            description='Zomato & Dine out'
        )

        res = AICopilotService.ask_copilot(self.user, "Where did I spend my money this month?")
        self.assertIn("Food & Dining", res['response'])
        self.assertTrue(any(t in res['tools_used'] for t in ['get_transaction_summary', 'tool_get_spending_summary']))
