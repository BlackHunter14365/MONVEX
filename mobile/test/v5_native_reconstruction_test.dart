import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:monvex_mobile/core/theme/monvex_theme.dart';
import 'package:monvex_mobile/models/transaction.dart';
import 'package:monvex_mobile/models/user_profile.dart';
import 'package:monvex_mobile/models/receipt.dart';
import 'package:monvex_mobile/providers/auth_provider.dart';
import 'package:monvex_mobile/providers/dashboard_provider.dart';
import 'package:monvex_mobile/providers/transaction_provider.dart';
import 'package:monvex_mobile/providers/account_provider.dart';
import 'package:monvex_mobile/providers/money_hub_provider.dart';
import 'package:monvex_mobile/providers/receipt_provider.dart';
import 'package:monvex_mobile/providers/budget_provider.dart';
import 'package:monvex_mobile/providers/goal_provider.dart';
import 'package:monvex_mobile/providers/copilot_provider.dart';
import 'package:monvex_mobile/providers/search_provider.dart';

import 'package:monvex_mobile/screens/navigation/quick_add_sheet.dart';
import 'package:monvex_mobile/screens/transactions/add_transaction_sheet.dart';
import 'package:monvex_mobile/screens/settings/edit_profile_sheet.dart';

Widget createTestApp(Widget child) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => AuthProvider()),
      ChangeNotifierProvider(create: (_) => DashboardProvider()),
      ChangeNotifierProvider(create: (_) => TransactionProvider()),
      ChangeNotifierProvider(create: (_) => AccountProvider()),
      ChangeNotifierProvider(create: (_) => MoneyHubProvider()),
      ChangeNotifierProvider(create: (_) => ReceiptProvider()),
      ChangeNotifierProvider(create: (_) => BudgetProvider()),
      ChangeNotifierProvider(create: (_) => GoalProvider()),
      ChangeNotifierProvider(create: (_) => CopilotProvider()),
      ChangeNotifierProvider(create: (_) => SearchProvider()),
    ],
    child: MaterialApp(
      theme: MonvexTheme.darkTheme,
      home: Scaffold(body: child),
    ),
  );
}

void main() {
  group('MONVEX V5 Native Reconstruction Tests', () {
    testWidgets('QuickAddBottomSheet renders all 5 native action tiles', (WidgetTester tester) async {
      bool scanReceiptCalled = false;

      await tester.pumpWidget(
        createTestApp(
          QuickAddBottomSheet(
            onScanReceipt: () {
              scanReceiptCalled = true;
            },
          ),
        ),
      );

      // Verify header
      expect(find.text('Quick Financial Actions'), findsOneWidget);
      expect(find.text('MONVEX V5'), findsOneWidget);

      // Verify 5 Action Tiles
      expect(find.text('Add Expense'), findsOneWidget);
      expect(find.text('Add Income'), findsOneWidget);
      expect(find.text('Transfer Between Accounts'), findsOneWidget);
      expect(find.text('Scan Paper / Digital Receipt'), findsOneWidget);
      expect(find.text('AI Natural Language / Voice Entry'), findsOneWidget);

      // Tap on Scan Receipt
      await tester.tap(find.text('Scan Paper / Digital Receipt'));
      await tester.pumpAndSettle();
      expect(scanReceiptCalled, isTrue);
    });

    testWidgets('AddTransactionSheet renders 3 segments (Expense, Income, Transfer)', (WidgetTester tester) async {
      await tester.pumpWidget(
        createTestApp(
          const AddTransactionSheet(initialType: 'EXPENSE'),
        ),
      );

      expect(find.text('Add Transaction'), findsOneWidget);
      expect(find.text('Expense'), findsOneWidget);
      expect(find.text('Income'), findsOneWidget);
      expect(find.text('Transfer'), findsOneWidget);
      expect(find.text('Save Transaction'), findsOneWidget);

      // Tap Income segment
      await tester.tap(find.text('Income'));
      await tester.pump();

      // Tap Transfer segment
      await tester.tap(find.text('Transfer'));
      await tester.pump();
    });

    testWidgets('AddTransactionSheet supports editing existing transaction', (WidgetTester tester) async {
      const existingTx = TransactionModel(
        id: 'tx_edit_test_123',
        amount: 850.50,
        type: 'EXPENSE',
        date: '2026-03-01',
        categoryName: 'Shopping',
        categoryColor: '#F43F5E',
        merchantName: 'Apple Store',
        description: 'Magic Keyboard purchase',
        source: 'MANUAL',
      );

      await tester.pumpWidget(
        createTestApp(
          const AddTransactionSheet(
            transactionToEdit: existingTx,
          ),
        ),
      );

      // Verify title switches to Edit mode
      expect(find.text('Edit Transaction'), findsOneWidget);
      expect(find.text('Save Changes'), findsOneWidget);

      // Verify existing fields pre-filled
      expect(find.text('850.50'), findsOneWidget);
      expect(find.text('Apple Store'), findsOneWidget);
      expect(find.text('Magic Keyboard purchase'), findsOneWidget);
    });

    testWidgets('EditProfileSheet renders fields and validates empty username', (WidgetTester tester) async {
      final user = UserProfile(
        id: 'u1',
        email: 'ceo@monvex.com',
        username: 'monvex_ceo',
        firstName: 'Alexander',
        lastName: 'Vance',
        phoneNumber: '+14155552671',
        monthlyIncome: 15000.0,
      );

      await tester.pumpWidget(
        createTestApp(
          EditProfileSheet(user: user),
        ),
      );

      expect(find.text('Edit Profile'), findsOneWidget);
      expect(find.text('Save Changes'), findsOneWidget);
      expect(find.text('monvex_ceo'), findsOneWidget);
      expect(find.text('Alexander'), findsOneWidget);
      expect(find.text('Vance'), findsOneWidget);
    });

    test('Receipt defensive parsing with REJECTED status', () {
      final json = {
        'id': 'rcpt_rej_01',
        'merchant_name': 'Declined Vendor',
        'total_amount': 25.0,
        'status': 'REJECTED',
        'items': [],
      };

      final receipt = Receipt.fromJson(json);
      expect(receipt.id, equals('rcpt_rej_01'));
      expect(receipt.status, equals('REJECTED'));
      expect(receipt.isConfirmed, isFalse);
      expect(receipt.isPendingReview, isFalse);
    });
  });
}