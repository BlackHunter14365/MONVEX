"""
Unit & Integration Tests for NLP Entity Extractor & AI Copilot Reasoning
"""
from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import date, timedelta
from services.nlp_parser import NLPFinancialParser
from services.ai_copilot_service import AICopilotService
from apps.transactions.models import Transaction, Category
from apps.budgets.models import Budget

class NLPExtractorTestCase(TestCase):

    def test_hinglish_swiggy_parsing(self):
        text = "Aaj Swiggy pe 620 rupaye kharch kiye"
        res = NLPFinancialParser.parse(text)
        self.assertEqual(res['amount'], 620.0)
        self.assertEqual(res['type'], 'EXPENSE')
        self.assertEqual(res['merchant'], 'Swiggy')
        self.assertEqual(res['category'], 'Food & Dining')

    def test_airtel_broadband_parsing(self):
        text = "Paid 1499 for Airtel broadband"
        res = NLPFinancialParser.parse(text)
        self.assertEqual(res['amount'], 1499.0)
        self.assertEqual(res['type'], 'EXPENSE')
        self.assertEqual(res['merchant'], 'Airtel')
        self.assertEqual(res['category'], 'Bills & Utilities')

    def test_uber_commute_parsing(self):
        text = "Uber to office 250"
        res = NLPFinancialParser.parse(text)
        self.assertEqual(res['amount'], 250.0)
        self.assertEqual(res['type'], 'EXPENSE')
        self.assertEqual(res['merchant'], 'Uber')
        self.assertEqual(res['category'], 'Transportation')

    def test_salary_credit_parsing(self):
        text = "Monthly Salary credited 75000"
        res = NLPFinancialParser.parse(text)
        self.assertEqual(res['amount'], 75000.0)
        self.assertEqual(res['type'], 'INCOME')
        self.assertEqual(res['category'], 'Salary & Income')

    def test_petrol_fuel_parsing(self):
        text = "1200 ka petrol bharwaya"
        res = NLPFinancialParser.parse(text)
        self.assertEqual(res['amount'], 1200.0)
        self.assertEqual(res['type'], 'EXPENSE')
        self.assertEqual(res['category'], 'Transportation')

    def test_zara_shopping_parsing(self):
        text = "Bought 2 shirts for 3500 from Zara"
        res = NLPFinancialParser.parse(text)
        self.assertEqual(res['amount'], 3500.0)
        self.assertEqual(res['type'], 'EXPENSE')
        self.assertEqual(res['merchant'], 'Zara')
        self.assertEqual(res['category'], 'Shopping')


class AICopilotReasoningTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='alex_test', password='Password123!')
        self.cat_food = Category.objects.create(name='Food & Dining', type='EXPENSE', user=self.user)
        Transaction.objects.create(user=self.user, amount=Decimal('500.00'), type='EXPENSE', category=self.cat_food, date=date.today())
        Transaction.objects.create(user=self.user, amount=Decimal('75000.00'), type='INCOME', date=date.today())
        Budget.objects.create(user=self.user, category=self.cat_food, limit_amount=Decimal('8000.00'))

    def test_affordability_query(self):
        res = AICopilotService.ask_copilot(self.user, "Can I afford to buy an iPhone for 80000?")
        self.assertTrue("Purchase Target:" in res['response'] or "Affordability" in res['response'] or "Target" in res['response'])
        self.assertTrue(any(t in res['tools_used'] for t in ['simulate_purchase', 'tool_evaluate_affordability']))

    def test_food_spending_breakdown(self):
        res = AICopilotService.ask_copilot(self.user, "How much did I spend on Food & Dining?")
        self.assertTrue("Spending Report" in res['response'] or "Spending Breakdown" in res['response'] or "Food & Dining" in res['response'])
        self.assertIn("Food & Dining", res['response'])

    def test_what_if_scenario(self):
        res = AICopilotService.ask_copilot(self.user, "What if I reduce food spending by 20%?")
        self.assertTrue("What-If" in res['response'] or "Simulation" in res['response'] or "Scenario" in res['response'])
        self.assertTrue(any(t in res['tools_used'] for t in ['simulate_spending_reduction', 'tool_calculate_what_if']))
