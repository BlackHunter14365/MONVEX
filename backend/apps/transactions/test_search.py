"""
Universal Search & Multi-Tenant User Isolation Tests
Ensures zero data leakage between tenants across all searchable entities.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date

from apps.transactions.models import Transaction, Asset, Category, Merchant
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from apps.ai_copilot.models import ConversationSession


class UniversalSearchSecurityTests(TestCase):
    def setUp(self):
        # 1. Create User Alpha
        self.user_alpha = User.objects.create_user(
            username='alpha_user',
            email='alpha@monvex.io',
            password='SecurePassword123!'
        )

        # 2. Create User Bravo
        self.user_bravo = User.objects.create_user(
            username='bravo_user',
            email='bravo@monvex.io',
            password='SecurePassword123!'
        )

        # 3. Create Categories
        self.cat_alpha = Category.objects.create(
            user=self.user_alpha,
            name='AlphaDining',
            icon='coffee',
            color='#FF0000'
        )
        self.cat_bravo = Category.objects.create(
            user=self.user_bravo,
            name='BravoSecretCategory',
            icon='lock',
            color='#00FF00'
        )

        # 4. Create Merchants
        self.merchant_alpha = Merchant.objects.create(
            name='Blue Tokai Coffee',
            normalized_name='blue tokai coffee'
        )
        self.merchant_bravo = Merchant.objects.create(
            name='Bravo Confidential Offshore',
            normalized_name='bravo confidential offshore'
        )

        # 5. Create Assets (Accounts / Balances)
        self.acc_alpha = Asset.objects.create(
            user=self.user_alpha,
            name='Alpha HDFC Premium',
            asset_type='BANK',
            institution='HDFC Bank',
            value=Decimal('50000.00')
        )
        self.acc_bravo = Asset.objects.create(
            user=self.user_bravo,
            name='Bravo Swiss Vault',
            asset_type='BANK',
            institution='UBS',
            value=Decimal('999999.00')
        )

        # 6. Create Transactions
        self.tx_alpha = Transaction.objects.create(
            user=self.user_alpha,
            category=self.cat_alpha,
            merchant=self.merchant_alpha,
            type='EXPENSE',
            amount=Decimal('450.00'),
            description='Morning espresso roast',
            date=date.today()
        )
        self.tx_bravo = Transaction.objects.create(
            user=self.user_bravo,
            category=self.cat_bravo,
            merchant=self.merchant_bravo,
            type='EXPENSE',
            amount=Decimal('125000.00'),
            description='Top secret investment transfer',
            date=date.today()
        )

        # 7. Create Budgets
        self.budget_alpha = Budget.objects.create(
            user=self.user_alpha,
            category=self.cat_alpha,
            limit_amount=Decimal('8000.00'),
            period='MONTHLY'
        )
        self.budget_bravo = Budget.objects.create(
            user=self.user_bravo,
            category=self.cat_bravo,
            limit_amount=Decimal('500000.00'),
            period='MONTHLY'
        )

        # 8. Create Savings Goals
        self.goal_alpha = SavingsGoal.objects.create(
            user=self.user_alpha,
            title='Alpha Emergency Fund',
            target_amount=Decimal('200000.00'),
            current_amount=Decimal('80000.00')
        )
        self.goal_bravo = SavingsGoal.objects.create(
            user=self.user_bravo,
            title='Bravo Supercar Fund',
            target_amount=Decimal('15000000.00'),
            current_amount=Decimal('5000000.00')
        )

        # 9. Create AI Conversation Sessions
        self.conv_alpha = ConversationSession.objects.create(
            user=self.user_alpha,
            title='Alpha Tax Strategy 2026'
        )
        self.conv_bravo = ConversationSession.objects.create(
            user=self.user_bravo,
            title='Bravo Offshore Acquisition'
        )

        # API Clients
        self.client_anon = APIClient()
        
        self.client_alpha = APIClient()
        self.client_alpha.force_authenticate(user=self.user_alpha)

        self.client_bravo = APIClient()
        self.client_bravo.force_authenticate(user=self.user_bravo)

    def test_unauthenticated_search_rejected(self):
        """Unauthenticated requests must receive 401 Unauthorized."""
        res = self.client_anon.get('/api/v1/search/?q=coffee')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_query_returns_default_navigation_and_items(self):
        """Empty query returns default navigation suggestions and recent items."""
        res = self.client_alpha.get('/api/v1/search/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('navigation', data['results'])
        self.assertIn('transactions', data['results'])
        self.assertGreater(len(data['results']['navigation']), 0)

    def test_search_user_alpha_entities(self):
        """User Alpha searching 'coffee' gets their own transaction."""
        res = self.client_alpha.get('/api/v1/search/?q=coffee')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(len(data['results']['transactions']), 1)
        self.assertEqual(data['results']['transactions'][0]['title'], 'Blue Tokai Coffee')
        self.assertEqual(data['results']['transactions'][0]['amount'], 450.0)

    def test_search_navigation_commands(self):
        """Searching 'analytics' returns the Navigation command."""
        res = self.client_alpha.get('/api/v1/search/?q=analytics')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        nav_results = data['results']['navigation']
        self.assertGreater(len(nav_results), 0)
        self.assertEqual(nav_results[0]['destination'], '/analytics')

    def test_strict_multi_tenant_user_isolation(self):
        """
        CRITICAL SECURITY TEST:
        User Alpha MUST NEVER see User Bravo's confidential records (and vice versa).
        """
        # Alpha searches for Bravo's confidential terms
        res_alpha_search_bravo = self.client_alpha.get('/api/v1/search/?q=Bravo')
        self.assertEqual(res_alpha_search_bravo.status_code, status.HTTP_200_OK)
        alpha_data = res_alpha_search_bravo.json()
        
        # User Alpha must receive ZERO results for Bravo's items
        self.assertEqual(len(alpha_data['results']['transactions']), 0)
        self.assertEqual(len(alpha_data['results']['accounts']), 0)
        self.assertEqual(len(alpha_data['results']['budgets']), 0)
        self.assertEqual(len(alpha_data['results']['goals']), 0)
        self.assertEqual(len(alpha_data['results']['conversations']), 0)

        # Alpha searches for "Offshore"
        res_alpha_offshore = self.client_alpha.get('/api/v1/search/?q=Offshore')
        self.assertEqual(len(res_alpha_offshore.json()['results']['transactions']), 0)
        self.assertEqual(len(res_alpha_offshore.json()['results']['conversations']), 0)

        # But User Bravo searching for "Offshore" MUST see their own records
        res_bravo = self.client_bravo.get('/api/v1/search/?q=Offshore')
        self.assertEqual(res_bravo.status_code, status.HTTP_200_OK)
        bravo_data = res_bravo.json()
        self.assertEqual(len(bravo_data['results']['transactions']), 1)
        self.assertEqual(bravo_data['results']['transactions'][0]['title'], 'Bravo Confidential Offshore')
        self.assertEqual(len(bravo_data['results']['conversations']), 1)
        self.assertEqual(bravo_data['results']['conversations'][0]['title'], 'Bravo Offshore Acquisition')

        # Bravo searches for Alpha's "Blue Tokai" -> Must receive 0 results
        res_bravo_search_alpha = self.client_bravo.get('/api/v1/search/?q=Tokai')
        self.assertEqual(len(res_bravo_search_alpha.json()['results']['transactions']), 0)

    def test_search_limit_and_bounding(self):
        """Limit parameter is safely bounded and respected."""
        res = self.client_alpha.get('/api/v1/search/?q=&limit=2')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertLessEqual(len(data['results']['navigation']), 2)
