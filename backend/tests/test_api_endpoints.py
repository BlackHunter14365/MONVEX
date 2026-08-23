"""
MONVEX REST API & User Data Isolation Tests
"""
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from apps.transactions.models import Transaction, Category, RecurringPayment
from apps.budgets.models import Budget
from apps.goals.models import SavingsGoal
from django.test import override_settings

@override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=False, OTP_PROVIDER='console', DEBUG=True)
class APITestCaseSuite(APITestCase):

    def setUp(self):
        # User 1 (Alice)
        self.user1 = User.objects.create_user(
            username='alice',
            email='alice@example.com',
            password='Password123!'
        )
        self.user1.profile.monthly_income = Decimal('80000.00')
        self.user1.profile.save()

        # User 2 (Bob) - for tenant isolation checks
        self.user2 = User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='Password123!'
        )
        self.user2.profile.monthly_income = Decimal('50000.00')
        self.user2.profile.save()

        # Categories
        self.food_cat = Category.objects.create(name='Food & Dining', type='EXPENSE', is_system_default=True)

        # Authenticate as User 1 by default
        self.client.force_authenticate(user=self.user1)

    def test_user_registration_and_jwt_login(self):
        """Test simplified direct registration and login"""
        self.client.force_authenticate(user=None)

        # 1. Register
        reg_payload = {
            "username": "charlie",
            "email": "charlie@example.com",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
            "currency": "USD",
            "monthly_income": "90000.00"
        }
        res = self.client.post('/api/v1/auth/register/', reg_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

        # 2. Login
        login_payload = {
            "identifier": "charlie",
            "password": "StrongPassword123!"
        }
        login_res = self.client.post('/api/v1/auth/login/', login_payload)
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)

    def test_create_and_list_transactions(self):
        """Test transaction creation and listing"""
        payload = {
            "amount": "1250.50",
            "type": "EXPENSE",
            "description": "Starbucks Coffee",
            "category_name": "Food & Dining",
            "merchant_name": "Starbucks",
            "source": "MANUAL"
        }
        res = self.client.post('/api/v1/transactions/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['amount'], '1250.50')
        self.assertEqual(res.data['merchant_name'], 'Starbucks')

        list_res = self.client.get('/api/v1/transactions/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data['count'], 1)

    def test_strict_multi_tenant_isolation_transactions(self):
        """Verify that User 1 cannot access User 2's financial transactions"""
        # Create transaction belonging to User 2 (Bob)
        bob_tx = Transaction.objects.create(
            user=self.user2,
            amount=Decimal('5000.00'),
            type='EXPENSE',
            date='2026-08-20',
            description='Secret Bob Transaction'
        )

        # Alice tries to list transactions - must not see Bob's transaction
        alice_list = self.client.get('/api/v1/transactions/')
        self.assertEqual(alice_list.data['count'], 0)

        # Alice tries to directly GET Bob's transaction ID
        direct_get = self.client.get(f'/api/v1/transactions/{bob_tx.id}/')
        self.assertEqual(direct_get.status_code, status.HTTP_404_NOT_FOUND)

        # Alice tries to DELETE Bob's transaction
        direct_delete = self.client.delete(f'/api/v1/transactions/{bob_tx.id}/')
        self.assertEqual(direct_delete.status_code, status.HTTP_404_NOT_FOUND)

    def test_strict_multi_tenant_isolation_budgets(self):
        """Verify that User 1 cannot access or modify User 2's budgets"""
        bob_budget = Budget.objects.create(
            user=self.user2,
            category=self.food_cat,
            limit_amount=Decimal('10000.00'),
            period='MONTHLY'
        )

        # Alice listing budgets - count 0
        alice_list = self.client.get('/api/v1/budgets/')
        self.assertEqual(len(alice_list.data), 0)

        # Alice directly accessing Bob's budget
        direct_get = self.client.get(f'/api/v1/budgets/{bob_budget.id}/')
        self.assertEqual(direct_get.status_code, status.HTTP_404_NOT_FOUND)

        # Alice trying to delete Bob's budget
        direct_delete = self.client.delete(f'/api/v1/budgets/{bob_budget.id}/')
        self.assertEqual(direct_delete.status_code, status.HTTP_404_NOT_FOUND)

    def test_strict_multi_tenant_isolation_goals(self):
        """Verify that User 1 cannot access or contribute to User 2's savings goals"""
        bob_goal = SavingsGoal.objects.create(
            user=self.user2,
            title="Bob's Secret Vacation",
            target_amount=Decimal('150000.00')
        )

        # Alice listing goals - count 0
        alice_list = self.client.get('/api/v1/goals/')
        self.assertEqual(len(alice_list.data), 0)

        # Alice directly getting Bob's goal
        direct_get = self.client.get(f'/api/v1/goals/{bob_goal.id}/')
        self.assertEqual(direct_get.status_code, status.HTTP_404_NOT_FOUND)

        # Alice trying to contribute to Bob's goal
        contrib_res = self.client.post(f'/api/v1/goals/{bob_goal.id}/contribute/', {
            "amount": "5000.00"
        })
        self.assertEqual(contrib_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_strict_multi_tenant_isolation_recurring_payments(self):
        """Verify that User 1 cannot access User 2's recurring payments"""
        bob_bill = RecurringPayment.objects.create(
            user=self.user2,
            name="Bob's Netflix",
            amount=Decimal('649.00'),
            frequency='MONTHLY',
            next_due_date='2026-09-01'
        )

        alice_list = self.client.get('/api/v1/transactions/recurring/')
        self.assertEqual(alice_list.data['count'], 0)

        direct_get = self.client.get(f'/api/v1/transactions/recurring/{bob_bill.id}/')
        self.assertEqual(direct_get.status_code, status.HTTP_404_NOT_FOUND)

    def test_fresh_user_workspace_empty_state(self):
        """Verify that a brand new user registers with 0 balance, 0 transactions, and clean state"""
        self.client.force_authenticate(user=None)
        reg_res = self.client.post('/api/v1/auth/register/', {
            "username": "fresh_user",
            "email": "fresh@example.com",
            "password": "FreshPassword123!",
            "currency": "INR",
            "monthly_income": "0.00"
        })
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        token = reg_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Transactions empty
        tx_res = self.client.get('/api/v1/transactions/')
        self.assertEqual(tx_res.data['count'], 0)

        # Budgets empty
        b_res = self.client.get('/api/v1/budgets/')
        self.assertEqual(len(b_res.data), 0)

        # Goals empty
        g_res = self.client.get('/api/v1/goals/')
        self.assertEqual(len(g_res.data), 0)

        # Dashboard metrics at 0
        dash_res = self.client.get('/api/v1/analytics/dashboard/')
        self.assertEqual(dash_res.status_code, status.HTTP_200_OK)
        self.assertEqual(dash_res.data['net_balance'], 0.0)
        self.assertEqual(len(dash_res.data['recent_transactions']), 0)

    def test_budget_overview_api(self):
        """Test budget creation and overview endpoint"""
        b_res = self.client.post('/api/v1/budgets/', {
            "category": str(self.food_cat.id),
            "limit_amount": "8000.00",
            "period": "MONTHLY"
        })
        self.assertEqual(b_res.status_code, status.HTTP_201_CREATED)

        overview_res = self.client.get('/api/v1/budgets/overview/')
        self.assertEqual(overview_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(overview_res.data), 1)
        self.assertEqual(overview_res.data[0]['limit_amount'], 8000.00)

    def test_goals_and_contributions_api(self):
        """Test savings goals creation and contribution"""
        goal_res = self.client.post('/api/v1/goals/', {
            "title": "MacBook Pro Fund",
            "target_amount": "200000.00",
            "deadline": "2026-12-31"
        })
        self.assertEqual(goal_res.status_code, status.HTTP_201_CREATED)
        goal_id = goal_res.data['id']

        # Contribute
        contrib_res = self.client.post(f'/api/v1/goals/{goal_id}/contribute/', {
            "amount": "25000.00",
            "notes": "First savings deposit"
        })
        self.assertEqual(contrib_res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(contrib_res.data['current_amount']), 25000.00)
        self.assertEqual(contrib_res.data['progress_percentage'], 12.5)

    def test_analytics_dashboard_api(self):
        """Test analytics dashboard endpoint"""
        res = self.client.get('/api/v1/analytics/dashboard/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('monthly_income', res.data)
        self.assertIn('monthly_expense', res.data)
        self.assertIn('health_score', res.data)
        self.assertIn('recent_transactions', res.data)

    def test_ai_copilot_chat_api(self):
        """Test AI Copilot chat query endpoint"""
        res = self.client.post('/api/v1/ai/chat/', {
            "question": "Can I save 50,000 in six months?"
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('response', res.data)
        self.assertIn('tools_used', res.data)
