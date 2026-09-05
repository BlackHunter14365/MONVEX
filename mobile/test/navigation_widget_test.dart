import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:monvex_mobile/main.dart';
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Widget createTestWidget() {
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
      child: const MaterialApp(
        home: MainNavigationWrapper(),
      ),
    );
  }

  testWidgets('MainNavigationWrapper renders 5 bottom navigation destinations', (tester) async {
    await tester.pumpWidget(createTestWidget());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Verify all 5 native destinations exist in bottom bar
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Money'), findsOneWidget);
    expect(find.text('Budgets'), findsOneWidget);
    expect(find.text('Receipts'), findsOneWidget);
    expect(find.text('Copilot'), findsOneWidget);

    // Verify floating action button exists on Home
    expect(find.byType(FloatingActionButton), findsWidgets);
  });

  testWidgets('Tapping bottom navigation changes active destination', (tester) async {
    await tester.pumpWidget(createTestWidget());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Tap on Money tab
    await tester.tap(find.text('Money'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Tap on Budgets tab
    await tester.tap(find.text('Budgets'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Tap on Receipts tab
    await tester.tap(find.text('Receipts'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Tap on Copilot tab
    await tester.tap(find.text('Copilot'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    // Tap back to Home
    await tester.tap(find.text('Home'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('Home'), findsOneWidget);
  });
}
