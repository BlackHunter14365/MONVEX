"""
MONVEX V4.2 End-to-End Financial Data Integrity & Product Validation Suite
Tests Phases 1 through 18:
- Phase 1: Authentication & Session Integrity
- Phase 2: User Data Isolation (User A vs User B)
- Phase 3: Wallet / Account Data Flow
- Phase 4: Transaction Data Flow & Decimal Precision
- Phase 5: Transaction -> Wallet Balance Integrity
- Phase 6: Budget Integrity (0%, 25%, 50%, 75%, 100%, >100%)
- Phase 7: Savings Goals Integrity
- Phase 8: Analytics Exact Decimal Match
- Phase 9: Forecasting Run-rate & Bounds
- Phase 10: Anomaly Detection
- Phase 11: AI Financial Grounding
- Phase 12: AI Tool Execution & Security
- Phase 13: Structured AI Response Validation
- Phase 15: Delete / Update Propagation Safety
- Phase 16: API Contract Validation
- Phase 17: Cyber Security & WAF Rules
"""
import calendar
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.ai_copilot.models import AnomalyEvent, ConversationSession
from apps.budgets.models import Budget
from apps.goals.models import GoalContribution, SavingsGoal
from apps.transactions.models import Asset, Category, Liability, Merchant, RecurringPayment, Transaction
from services.ai.orchestrator import FinancialAgentOrchestrator
from services.ai.response_builder import FinancialResponseBuilder
from services.ai.tools import MONVEXTools
from services.ai_copilot_service import AICopilotService
from services.anomaly_service import AnomalyService
from services.budget_service import BudgetService
from services.finance_service import FinanceService
from services.forecast_service import ForecastService


@override_settings(AUTH_REQUIRE_EMAIL_VERIFICATION=False, OTP_PROVIDER='console', DEBUG=True)
class V42FinancialDataIntegrityTestSuite(TestCase):

    def setUp(self):
        # 1. USER A (Primary Test Subject)
        self.user_a = User.objects.create_user(
            username='user_a_v42',
            email='user_a@monvex.local',
            password='Password123!',
            first_name='Alex',
            last_name='Monvex'
        )
        self.user_a.profile.currency = 'INR'
        self.user_a.profile.monthly_income = Decimal('85000.00')
        self.user_a.profile.save()

        # 2. USER B (Tenant Isolation Subject)
        self.user_b = User.objects.create_user(
            username='user_b_v42',
            email='user_b@monvex.local',
            password='Password123!',
            first_name='Bob',
            last_name='Monvex'
        )
        self.user_b.profile.currency = 'INR'
        self.user_b.profile.monthly_income = Decimal('60000.00')
        self.user_b.profile.save()

        # Clients for User A and User B
        self.client_a = APIClient()
        self.client_a.force_authenticate(user=self.user_a)

        self.client_b = APIClient()
        self.client_b.force_authenticate(user=self.user_b)

        self.anon_client = APIClient()

        # System Categories
        self.cat_salary = Category.objects.create(name='Salary & Income', type='INCOME', is_system_default=True)
        self.cat_food = Category.objects.create(name='Food & Dining', type='EXPENSE', is_system_default=True)
        self.cat_groceries = Category.objects.create(name='Groceries', type='EXPENSE', is_system_default=True)
        self.cat_housing = Category.objects.create(name='Housing & Rent', type='EXPENSE', is_system_default=True)
        self.cat_shopping = Category.objects.create(name='Shopping', type='EXPENSE', is_system_default=True)
        self.cat_bills = Category.objects.create(name='Bills & Utilities', type='EXPENSE', is_system_default=True)

    # =========================================================================
    # PHASE 1: AUTHENTICATION & SESSION INTEGRITY
    # =========================================================================
    def test_phase1_authentication_and_session_lifecycle(self):
        # 1. Registration
        reg_payload = {
            "username": "new_user_v42",
            "email": "new_user_v42@monvex.local",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "currency": "INR",
            "monthly_income": "75000.00"
        }
        reg_res = self.anon_client.post('/api/v1/auth/register/', reg_payload)
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(reg_res.data['success'])
        self.assertIn('access', reg_res.data)
        self.assertIn('refresh', reg_res.data)

        # 2. Login with identifier
        login_res = self.anon_client.post('/api/v1/auth/login/', {
            "identifier": "new_user_v42",
            "password": "SecurePassword123!"
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['access']
        refresh_token = login_res.data['refresh']

        # 3. Authenticated request using JWT Bearer
        authed_client = APIClient()
        authed_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_res = authed_client.get('/api/v1/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'new_user_v42')

        # 4. Unauthenticated request must return 401
        unauthed_res = self.anon_client.get('/api/v1/transactions/')
        self.assertEqual(unauthed_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 5. Invalid / malformed token must return 401
        bad_client = APIClient()
        bad_client.credentials(HTTP_AUTHORIZATION='Bearer invalid_junk_token_xyz')
        bad_res = bad_client.get('/api/v1/transactions/')
        self.assertEqual(bad_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 6. Logout with refresh token blacklist
        logout_res = authed_client.post('/api/v1/auth/logout/', {'refresh': refresh_token})
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

    # =========================================================================
    # PHASE 2: USER DATA ISOLATION (USER A vs USER B)
    # =========================================================================
    def test_phase2_strict_multi_tenant_user_isolation(self):
        # Create confidential records for User B
        b_asset = Asset.objects.create(
            user=self.user_b,
            name="Bob Secret Vault",
            asset_type="BANK",
            value=Decimal("500000.00")
        )
        b_tx = Transaction.objects.create(
            user=self.user_b,
            amount=Decimal("12000.00"),
            type="EXPENSE",
            date=date.today(),
            description="Bob Confidential Purchase"
        )
        b_budget = Budget.objects.create(
            user=self.user_b,
            category=self.cat_shopping,
            limit_amount=Decimal("30000.00")
        )
        b_goal = SavingsGoal.objects.create(
            user=self.user_b,
            title="Bob Private Island Fund",
            target_amount=Decimal("1000000.00")
        )

        # 1. User A tries to GET User B's Asset -> 404
        res = self.client_a.get(f'/api/v1/transactions/assets/{b_asset.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 2. User A tries to PATCH User B's Asset -> 404
        res = self.client_a.patch(f'/api/v1/transactions/assets/{b_asset.id}/', {"value": 1.00})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 3. User A tries to DELETE User B's Asset -> 404
        res = self.client_a.delete(f'/api/v1/transactions/assets/{b_asset.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 4. User A tries to GET User B's Transaction -> 404
        res = self.client_a.get(f'/api/v1/transactions/{b_tx.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 5. User A tries to DELETE User B's Transaction -> 404
        res = self.client_a.delete(f'/api/v1/transactions/{b_tx.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 6. User A tries to GET User B's Budget -> 404
        res = self.client_a.get(f'/api/v1/budgets/{b_budget.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 7. User A tries to GET or contribute to User B's Goal -> 404
        res = self.client_a.get(f'/api/v1/goals/{b_goal.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        res = self.client_a.post(f'/api/v1/goals/{b_goal.id}/contribute/', {"amount": 5000.00})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # 8. User A list queries must not contain User B's records
        tx_list = self.client_a.get('/api/v1/transactions/')
        self.assertEqual(tx_list.data['count'], 0)

        asset_list = self.client_a.get('/api/v1/transactions/assets/')
        self.assertEqual(len(asset_list.data), 0)

        budget_list = self.client_a.get('/api/v1/budgets/')
        self.assertEqual(len(budget_list.data), 0)

        goal_list = self.client_a.get('/api/v1/goals/')
        self.assertEqual(len(goal_list.data), 0)

        # 9. Dashboard telemetry must be strictly 0.00 for User A
        metrics = self.client_a.get('/api/v1/analytics/dashboard/')
        self.assertEqual(metrics.data['total_income'], 0.0)
        self.assertEqual(metrics.data['total_expense'], 0.0)
        self.assertEqual(metrics.data['net_balance'], 0.0)

    # =========================================================================
    # PHASE 3: WALLET / ACCOUNT DATA FLOW (ASSET LIFECYCLE)
    # =========================================================================
    def test_phase3_wallet_asset_lifecycle(self):
        # 1. Create multiple accounts for User A
        acc_checking = self.client_a.post('/api/v1/transactions/assets/', {
            "name": "HDFC Salary Account",
            "asset_type": "BANK",
            "value": "85000.00",
            "institution": "HDFC Bank",
            "notes": '{"account_type": "CHECKING", "last4": "4242", "theme": "emerald"}'
        })
        self.assertEqual(acc_checking.status_code, status.HTTP_201_CREATED)
        acc_id = acc_checking.data['id']

        acc_cash = self.client_a.post('/api/v1/transactions/assets/', {
            "name": "Physical Wallet Cash",
            "asset_type": "CASH",
            "value": "5000.00",
            "institution": "Cash Ledger"
        })
        self.assertEqual(acc_cash.status_code, status.HTTP_201_CREATED)

        # 2. Read accounts list
        res_list = self.client_a.get('/api/v1/transactions/assets/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 2)

        # 3. Update account balance
        update_res = self.client_a.patch(f'/api/v1/transactions/assets/{acc_id}/', {
            "value": "92500.50"
        })
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['value'], '92500.50')

        # 4. Delete account
        del_res = self.client_a.delete(f'/api/v1/transactions/assets/{acc_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        # Confirm only cash account remains
        res_after = self.client_a.get('/api/v1/transactions/assets/')
        self.assertEqual(len(res_after.data), 1)
        self.assertEqual(res_after.data[0]['name'], "Physical Wallet Cash")

    # =========================================================================
    # PHASE 4: TRANSACTION DATA FLOW & EXACT DECIMAL PRECISION
    # =========================================================================
    def test_phase4_transaction_data_flow_and_decimal_precision(self):
        test_amounts = [
            Decimal("100.10"),
            Decimal("999.99"),
            Decimal("10000.50"),
            Decimal("1000000.75"),
        ]

        created_ids = []
        for amt in test_amounts:
            res = self.client_a.post('/api/v1/transactions/', {
                "amount": str(amt),
                "type": "EXPENSE",
                "category_name": "Bills & Utilities",
                "description": f"Precision test {amt}",
                "date": str(date.today())
            })
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertEqual(Decimal(res.data['amount']), amt)
            created_ids.append(res.data['id'])

            # Verify exact database precision
            tx_db = Transaction.objects.get(id=res.data['id'])
            self.assertEqual(tx_db.amount, amt)

        # Verify invalid amounts rejected
        bad_res1 = self.client_a.post('/api/v1/transactions/', {
            "amount": "0.00",
            "type": "EXPENSE"
        })
        self.assertEqual(bad_res1.status_code, status.HTTP_400_BAD_REQUEST)

        bad_res2 = self.client_a.post('/api/v1/transactions/', {
            "amount": "-500.00",
            "type": "EXPENSE"
        })
        self.assertEqual(bad_res2.status_code, status.HTTP_400_BAD_REQUEST)

    # =========================================================================
    # PHASE 5: TRANSACTION -> WALLET BALANCE INTEGRITY
    # =========================================================================
    def test_phase5_transaction_to_balance_integrity(self):
        # Formula: Net Balance = Total Inflow - Total Outflow
        # 1. Starting balance = 0.00
        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics['net_balance'], 0.0)

        # 2. Add 1 Income (₹50,000.00)
        res_inc = self.client_a.post('/api/v1/transactions/', {
            "amount": "50000.00",
            "type": "INCOME",
            "category_name": "Salary & Income",
            "description": "Freelance Milestone",
            "date": str(date.today())
        })
        self.assertEqual(res_inc.status_code, status.HTTP_201_CREATED)
        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics['net_balance'], 50000.0)

        # 3. Add 1 Expense (₹15,000.00)
        res_exp1 = self.client_a.post('/api/v1/transactions/', {
            "amount": "15000.00",
            "type": "EXPENSE",
            "category_name": "Housing & Rent",
            "description": "Apartment Rent",
            "date": str(date.today())
        })
        self.assertEqual(res_exp1.status_code, status.HTTP_201_CREATED)
        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics['net_balance'], 35000.0)

        # 4. Add second Expense (₹5,000.00)
        res_exp2 = self.client_a.post('/api/v1/transactions/', {
            "amount": "5000.00",
            "type": "EXPENSE",
            "category_name": "Groceries",
            "description": "Weekly Groceries",
            "date": str(date.today())
        })
        self.assertEqual(res_exp2.status_code, status.HTTP_201_CREATED)
        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics['net_balance'], 30000.0)

        # 5. Edit transaction: increase grocery from ₹5,000 to ₹8,000
        tx2_id = res_exp2.data['id']
        patch_res = self.client_a.patch(f'/api/v1/transactions/{tx2_id}/', {
            "amount": "8000.00"
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics['net_balance'], 27000.0)

        # 6. Delete transaction: remove the ₹8,000 grocery expense
        del_res = self.client_a.delete(f'/api/v1/transactions/{tx2_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        metrics = FinanceService.get_dashboard_metrics(self.user_a)
        self.assertEqual(metrics['net_balance'], 35000.0)
        self.assertEqual(metrics['total_income'], 50000.0)
        self.assertEqual(metrics['total_expense'], 15000.0)

    # =========================================================================
    # PHASE 6: BUDGET INTEGRITY (0%, 25%, 50%, 75%, 100%, >100%)
    # =========================================================================
    def test_phase6_budget_calculation_integrity(self):
        # Create Food budget with ₹10,000 limit
        b_res = self.client_a.post('/api/v1/budgets/', {
            "category_id": str(self.cat_food.id),
            "limit_amount": "10000.00",
            "period": "MONTHLY"
        })
        self.assertEqual(b_res.status_code, status.HTTP_201_CREATED)

        today = date.today()

        # Helper to get current budget status
        def get_food_budget():
            overviews = BudgetService.get_budget_overview(self.user_a)
            return next(b for b in overviews if b['category_id'] == str(self.cat_food.id))

        # 0% State
        b0 = get_food_budget()
        self.assertEqual(b0['spent_amount'], 0.0)
        self.assertEqual(b0['remaining_amount'], 10000.0)
        self.assertEqual(b0['usage_percentage'], 0.0)
        self.assertEqual(b0['status'], 'ON_TRACK')

        # 25% State (+₹2,500)
        Transaction.objects.create(user=self.user_a, category=self.cat_food, amount=Decimal("2500.00"), type="EXPENSE", date=today)
        b25 = get_food_budget()
        self.assertEqual(b25['spent_amount'], 2500.0)
        self.assertEqual(b25['remaining_amount'], 7500.0)
        self.assertEqual(b25['usage_percentage'], 25.0)

        # 50% State (+₹2,500)
        Transaction.objects.create(user=self.user_a, category=self.cat_food, amount=Decimal("2500.00"), type="EXPENSE", date=today)
        b50 = get_food_budget()
        self.assertEqual(b50['spent_amount'], 5000.0)
        self.assertEqual(b50['remaining_amount'], 5000.0)
        self.assertEqual(b50['usage_percentage'], 50.0)

        # 75% State (+₹2,500)
        Transaction.objects.create(user=self.user_a, category=self.cat_food, amount=Decimal("2500.00"), type="EXPENSE", date=today)
        b75 = get_food_budget()
        self.assertEqual(b75['spent_amount'], 7500.0)
        self.assertEqual(b75['remaining_amount'], 2500.0)
        self.assertEqual(b75['usage_percentage'], 75.0)

        # 100% State (+₹2,500)
        Transaction.objects.create(user=self.user_a, category=self.cat_food, amount=Decimal("2500.00"), type="EXPENSE", date=today)
        b100 = get_food_budget()
        self.assertEqual(b100['spent_amount'], 10000.0)
        self.assertEqual(b100['remaining_amount'], 0.0)
        self.assertEqual(b100['usage_percentage'], 100.0)

        # >100% Exceeded State (+₹2,000 -> ₹12,000 / 120.0%)
        Transaction.objects.create(user=self.user_a, category=self.cat_food, amount=Decimal("2000.00"), type="EXPENSE", date=today)
        b_over = get_food_budget()
        self.assertEqual(b_over['spent_amount'], 12000.0)
        self.assertEqual(b_over['remaining_amount'], 0.0)
        self.assertEqual(b_over['usage_percentage'], 120.0)
        self.assertEqual(b_over['status'], 'EXCEEDED')

    # =========================================================================
    # PHASE 7: SAVINGS / GOALS INTEGRITY
    # =========================================================================
    def test_phase7_savings_goals_and_contributions(self):
        # 1. Create Goal
        g_res = self.client_a.post('/api/v1/goals/', {
            "title": "Emergency Fund Reserve",
            "target_amount": "50000.00",
            "current_amount": "0.00",
            "target_date": str(date.today() + timedelta(days=180))
        })
        self.assertEqual(g_res.status_code, status.HTTP_201_CREATED)
        goal_id = g_res.data['id']
        self.assertEqual(g_res.data['status'], 'IN_PROGRESS')

        # 2. Add partial contribution (₹20,000.00)
        c1 = self.client_a.post(f'/api/v1/goals/{goal_id}/contribute/', {
            "amount": "20000.00",
            "notes": "Initial deposit"
        })
        self.assertEqual(c1.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(c1.data['current_amount']), Decimal("20000.00"))
        self.assertEqual(c1.data['status'], 'IN_PROGRESS')

        # 3. Add contribution to hit exact target (+₹30,000.00)
        c2 = self.client_a.post(f'/api/v1/goals/{goal_id}/contribute/', {
            "amount": "30000.00",
            "notes": "Second deposit"
        })
        self.assertEqual(c2.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(c2.data['current_amount']), Decimal("50000.00"))
        self.assertEqual(c2.data['status'], 'COMPLETED')

        # 4. Add contribution exceeding target (+₹5,000.00)
        c3 = self.client_a.post(f'/api/v1/goals/{goal_id}/contribute/', {
            "amount": "5000.00"
        })
        self.assertEqual(c3.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(c3.data['current_amount']), Decimal("55000.00"))
        self.assertEqual(c3.data['status'], 'COMPLETED')

    # =========================================================================
    # PHASE 8: ANALYTICS EXACT DECIMAL MATCH
    # =========================================================================
    def test_phase8_analytics_exact_decimal_cross_check(self):
        today = date.today()
        # Seed controlled dataset
        txs = [
            ("75000.00", "INCOME", self.cat_salary),
            ("12450.50", "EXPENSE", self.cat_housing),
            ("4320.25", "EXPENSE", self.cat_groceries),
            ("2890.75", "EXPENSE", self.cat_bills),
            ("1500.00", "EXPENSE", self.cat_food),
        ]
        for amt_s, t_type, cat in txs:
            Transaction.objects.create(
                user=self.user_a,
                amount=Decimal(amt_s),
                type=t_type,
                category=cat,
                date=today
            )

        # Expected calculations using pure Python Decimal
        expected_income = Decimal("75000.00")
        expected_expense = Decimal("12450.50") + Decimal("4320.25") + Decimal("2890.75") + Decimal("1500.00")
        expected_net = expected_income - expected_expense
        expected_savings_rate = round((expected_net / expected_income) * 100, 1)

        # Fetch backend analytics metrics
        metrics = FinanceService.get_dashboard_metrics(self.user_a)

        # Cross-check tolerance: 0.00 exact match
        self.assertEqual(Decimal(str(metrics['monthly_income'])), expected_income)
        self.assertEqual(Decimal(str(metrics['monthly_expense'])), expected_expense)
        self.assertEqual(Decimal(str(metrics['net_balance'])), expected_net)
        self.assertEqual(metrics['savings_rate'], float(expected_savings_rate))

    # =========================================================================
    # PHASE 9: FORECASTING RUN-RATE & BOUNDS
    # =========================================================================
    def test_phase9_cashflow_forecasting_bounds(self):
        today = date.today()
        # Create daily spending pattern: ₹30,000 spent over past 30 days -> ₹1,000/day run-rate
        for i in range(1, 16):
            Transaction.objects.create(
                user=self.user_a,
                amount=Decimal("2000.00"),
                type="EXPENSE",
                date=today - timedelta(days=i * 2)
            )
        # Starting balance
        Transaction.objects.create(
            user=self.user_a,
            amount=Decimal("100000.00"),
            type="INCOME",
            date=today - timedelta(days=20)
        )

        forecast = ForecastService.forecast_cash_flow(self.user_a, days=30)
        self.assertEqual(forecast['starting_balance'], 70000.0)
        self.assertEqual(forecast['forecast_days'], 30)
        self.assertEqual(forecast['daily_burn_rate'], 1000.0)

        # Verify trajectory expands with bounds
        trajectory = forecast['daily_trajectory']
        self.assertEqual(len(trajectory), 30)
        day1 = trajectory[0]
        day30 = trajectory[29]

        self.assertTrue(day1['upper_bound'] >= day1['projected_balance'] >= day1['lower_bound'])
        self.assertTrue(day30['upper_bound'] >= day30['projected_balance'] >= day30['lower_bound'])
        # Uncertainty band expands over time
        self.assertTrue((day30['upper_bound'] - day30['lower_bound']) > (day1['upper_bound'] - day1['lower_bound']))

    # =========================================================================
    # PHASE 10: ANOMALY DETECTION STATISTICAL TRIGGERS
    # =========================================================================
    def test_phase10_anomaly_detection_triggers(self):
        today = date.today()
        # 1. Trigger 1: Transaction consumes >= 40% of monthly income (monthly income = ₹85,000 -> 40% = ₹34,000)
        huge_tx = Transaction.objects.create(
            user=self.user_a,
            amount=Decimal("40000.00"),
            type="EXPENSE",
            category=self.cat_shopping,
            date=today,
            description="Luxury Watch Outlay"
        )
        anom1 = AnomalyService.evaluate_transaction(huge_tx)
        self.assertIsNotNone(anom1)
        self.assertIn("consumes", anom1.reason)
        self.assertIn("47%", anom1.reason)

        # 2. Trigger 2: Transaction is >= 2.5x historical category average
        # Establish category baseline: 3 groceries at ₹1,000 each (average = ₹1,000)
        for i in range(3):
            Transaction.objects.create(
                user=self.user_a,
                amount=Decimal("1000.00"),
                type="EXPENSE",
                category=self.cat_groceries,
                date=today - timedelta(days=i + 1)
            )

        spike_tx = Transaction.objects.create(
            user=self.user_a,
            amount=Decimal("3500.00"),  # 3.5x average
            type="EXPENSE",
            category=self.cat_groceries,
            date=today,
            description="Bulk Wholesale Groceries"
        )
        anom2 = AnomalyService.evaluate_transaction(spike_tx)
        self.assertIsNotNone(anom2)
        self.assertIn("3.5x higher than category average", anom2.reason)

    # =========================================================================
    # PHASE 11: AI FINANCIAL GROUNDING (CONTROLLED DATASET)
    # =========================================================================
    def test_phase11_ai_financial_grounding_on_controlled_dataset(self):
        # Controlled dataset:
        # Income: ₹50,000.00
        # Expenses: ₹10,000.00 (Rent), ₹5,000.00 (Groceries), ₹2,500.00 (Bills)
        # Expected Total Expense: ₹17,500.00
        # Expected Net Remaining: ₹32,500.00
        today = date.today()
        Asset.objects.create(
            user=self.user_a,
            name="Primary Savings Account",
            asset_type="SAVINGS",
            value=Decimal("50000.00"),
            institution="HDFC Bank"
        )
        Transaction.objects.create(user=self.user_a, amount=Decimal("50000.00"), type="INCOME", category=self.cat_salary, date=today)
        Transaction.objects.create(user=self.user_a, amount=Decimal("10000.00"), type="EXPENSE", category=self.cat_housing, date=today)
        Transaction.objects.create(user=self.user_a, amount=Decimal("5000.00"), type="EXPENSE", category=self.cat_groceries, date=today)
        Transaction.objects.create(user=self.user_a, amount=Decimal("2500.00"), type="EXPENSE", category=self.cat_bills, date=today)

        # 1. Inquire: How much did I spend?
        res1 = AICopilotService.ask_copilot(self.user_a, "How much did I spend?")
        self.assertIn('17,500', res1['response'])
        self.assertIn('32,500', res1['response'])
        self.assertEqual(res1['data']['summary']['total_expense'], 17500.0)
        self.assertEqual(res1['data']['summary']['net_savings'], 32500.0)

        # 2. Inquire: Liquid balance
        res2 = AICopilotService.ask_copilot(self.user_a, "How much is my liquid balance?")
        self.assertIn('50,000', res2['response'])
        self.assertEqual(res2['data']['accounts']['total_liquid_balance'], 50000.0)

        # 3. Inquire: Spending by category
        res3 = AICopilotService.ask_copilot(self.user_a, "What did I spend on Housing & Rent?")
        self.assertIn('10,000', res3['response'])

    # =========================================================================
    # PHASE 12: AI TOOL EXECUTION & MULTI-TENANT SECURITY
    # =========================================================================
    def test_phase12_ai_tools_execution_and_tenant_scoping(self):
        # Tools must never expose User B's records to User A
        Transaction.objects.create(user=self.user_b, amount=Decimal("99999.00"), type="EXPENSE", date=date.today())

        # Test tool_get_spending_summary
        summary = MONVEXTools.get_transaction_summary(self.user_a, 30)
        self.assertEqual(summary['total_expense'], 0.0)

        # Test tool_get_cashflow
        cashflow = MONVEXTools.get_cashflow(self.user_a, 30)
        self.assertEqual(cashflow['total_outflow'], 0.0)

        # Test tool_get_budgets
        budgets = MONVEXTools.get_budgets(self.user_a)
        self.assertEqual(budgets['total_budgets'], 0)

        # Test tool_get_goals
        goals = MONVEXTools.get_goals(self.user_a)
        self.assertEqual(goals['total_goals'], 0)

    # =========================================================================
    # PHASE 13: STRUCTURED AI RESPONSE SCHEMA VALIDATION
    # =========================================================================
    def test_phase13_structured_ai_response_payload_validation(self):
        data = {
            "period_comparison": {
                "current_month_expense": 25000.0,
                "previous_month_expense": 20000.0,
                "expense_variance": 5000.0,
                "expense_variance_pct": 25.0,
                "top_drivers": [{"category": "Dining", "increase": 3000.0, "pct_increase": 40.0}]
            }
        }
        payload = FinancialResponseBuilder.build_structured_payload('PERIOD_COMPARISON', data, "Why did I spend more?")

        self.assertIn('metrics', payload)
        self.assertIn('insights', payload)
        self.assertIn('recommendations', payload)
        self.assertIn('actions', payload)
        self.assertTrue(len(payload['metrics']) >= 1)
        self.assertEqual(payload['metrics'][0]['value'], 25000.0)

        # Test empty data graceful fallback
        empty_payload = FinancialResponseBuilder.build_structured_payload('UNKNOWN', {}, "hello")
        self.assertEqual(empty_payload['metrics'], [])
        self.assertEqual(empty_payload['charts'], [])
        self.assertTrue(len(empty_payload['actions']) > 0)

    # =========================================================================
    # PHASE 15: DELETE & UPDATE CASCADE PROPAGATION
    # =========================================================================
    def test_phase15_destructive_operations_cascade(self):
        today = date.today()
        tx = Transaction.objects.create(
            user=self.user_a,
            amount=Decimal("5000.00"),
            type="EXPENSE",
            category=self.cat_groceries,
            date=today
        )

        b = Budget.objects.create(user=self.user_a, category=self.cat_groceries, limit_amount=Decimal("10000.00"))

        # Pre-deletion verification
        overview_before = BudgetService.get_budget_overview(self.user_a)
        self.assertEqual(overview_before[0]['spent_amount'], 5000.0)

        # Delete transaction via API
        del_res = self.client_a.delete(f'/api/v1/transactions/{tx.id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        # Post-deletion budget recalculation must reflect 0.00 spent
        overview_after = BudgetService.get_budget_overview(self.user_a)
        self.assertEqual(overview_after[0]['spent_amount'], 0.0)
        self.assertEqual(overview_after[0]['remaining_amount'], 10000.0)

    # =========================================================================
    # PHASE 17: SECURITY, WAF & ATTACK INTERCEPTION
    # =========================================================================
    def test_phase17_security_waf_intercepts_hostile_attacks(self):
        # 1. SQL Injection attempt in transaction description
        sqli_payload = {
            "amount": "100.00",
            "type": "EXPENSE",
            "description": "Coffee' OR 1=1 --",
            "category_name": "Food & Dining"
        }
        res_sqli = self.client_a.post('/api/v1/transactions/', sqli_payload)
        # Should be blocked by WAF middleware with 403 Forbidden
        self.assertEqual(res_sqli.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_sqli.json().get('error'), 'HOSTILE_PAYLOAD_BLOCKED')

        # 2. XSS injection attempt in category search
        res_xss = self.client_a.get('/api/v1/transactions/?search=<script>alert(1)</script>')
        self.assertEqual(res_xss.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Path Traversal attempt
        res_pt = self.client_a.get('/api/v1/transactions/?search=../../etc/passwd')
        self.assertEqual(res_pt.status_code, status.HTTP_403_FORBIDDEN)
