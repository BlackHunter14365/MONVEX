import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/core/storage/cache_manager.dart';
import 'package:monvex_mobile/providers/transaction_provider.dart';
import 'package:monvex_mobile/providers/money_hub_provider.dart';
import 'package:monvex_mobile/providers/receipt_provider.dart';
import 'package:monvex_mobile/providers/budget_provider.dart';
import 'package:monvex_mobile/providers/goal_provider.dart';
import 'package:monvex_mobile/providers/copilot_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Multi-Tenant Strict Isolation & Memory Purge Tests', () {
    setUp(() {
      CacheManager.clearAll();
    });

    test('CacheManager isolates user keys and purges only targeted user data', () {
      const userA = 'user_alpha_001';
      const userB = 'user_beta_002';

      CacheManager.set(userA, 'dashboard_metrics', {'net_worth': 150000.0});
      CacheManager.set(userB, 'dashboard_metrics', {'net_worth': 25000.0});

      expect(CacheManager.has(userA, 'dashboard_metrics'), isTrue);
      expect(CacheManager.has(userB, 'dashboard_metrics'), isTrue);
      expect(CacheManager.get(userA, 'dashboard_metrics')['net_worth'], equals(150000.0));
      expect(CacheManager.get(userB, 'dashboard_metrics')['net_worth'], equals(25000.0));

      // Purge User A only
      CacheManager.clearUserCache(userA);

      expect(CacheManager.has(userA, 'dashboard_metrics'), isFalse);
      expect(CacheManager.get(userA, 'dashboard_metrics'), isNull);

      // User B's data MUST remain completely intact
      expect(CacheManager.has(userB, 'dashboard_metrics'), isTrue);
      expect(CacheManager.get(userB, 'dashboard_metrics')['net_worth'], equals(25000.0));
    });

    test('Global wipe CacheManager.clearAll() leaves zero lingering memory artifacts', () {
      CacheManager.set('user_1', 'token_meta', 'sensitive_val');
      CacheManager.set('user_2', 'account_list', ['acc1', 'acc2']);

      expect(CacheManager.has('user_1', 'token_meta'), isTrue);
      expect(CacheManager.has('user_2', 'account_list'), isTrue);

      CacheManager.clearAll();

      expect(CacheManager.has('user_1', 'token_meta'), isFalse);
      expect(CacheManager.has('user_2', 'account_list'), isFalse);
    });

    test('Logout registry resets provider states to prevent cross-tenant data leakage', () {
      final txProvider = TransactionProvider();
      final moneyHub = MoneyHubProvider();
      final receiptProvider = ReceiptProvider();
      final budgetProvider = BudgetProvider();
      final goalProvider = GoalProvider();
      final copilotProvider = CopilotProvider();

      // Seed data into providers
      txProvider.setSearchQuery('Confidential Search Query');
      txProvider.setFilterType('EXPENSE');
      moneyHub.setSelectedTab(3);

      expect(txProvider.searchQuery, equals('Confidential Search Query'));
      expect(txProvider.filterType, equals('EXPENSE'));
      expect(moneyHub.selectedTab, equals(3));

      // Trigger resetState directly on each provider (as wired to AuthProvider logout)
      txProvider.resetState();
      moneyHub.resetState();
      receiptProvider.resetState();
      budgetProvider.resetState();
      goalProvider.resetState();
      copilotProvider.resetState();

      // Assert complete clean slate
      expect(txProvider.transactions, isEmpty);
      expect(txProvider.searchQuery, isEmpty);
      expect(txProvider.filterType, equals('ALL'));

      expect(moneyHub.accounts, isEmpty);
      expect(moneyHub.assets, isEmpty);
      expect(moneyHub.liabilities, isEmpty);
      expect(moneyHub.subscriptions, isEmpty);
      expect(moneyHub.selectedTab, equals(0));

      expect(receiptProvider.currentReceipt, isNull);
      expect(receiptProvider.receipts, isEmpty);

      expect(budgetProvider.budgets, isEmpty);
      expect(goalProvider.goals, isEmpty);

      expect(copilotProvider.messages.length, equals(1)); // only welcome message remains
      expect(copilotProvider.messages.first.id, equals('welcome_reset'));

      txProvider.dispose();
      moneyHub.dispose();
      receiptProvider.dispose();
      budgetProvider.dispose();
      goalProvider.dispose();
      copilotProvider.dispose();
    });
  });
}
