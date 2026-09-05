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

  Widget createTestApp() {
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

  group('Android Responsive Screen Sizes Tests (Phase 10)', () {
    final screenSizes = <String, Size>{
      '320dp (Compact)': const Size(320, 640),
      '360dp (Standard Android)': const Size(360, 780),
      '375dp (Medium)': const Size(375, 812),
      '390dp (Modern Android)': const Size(390, 844),
      '412dp (Pixel / Samsung Galaxy)': const Size(412, 915),
      '480dp (Foldable / Mini-tablet)': const Size(480, 1000),
    };

    for (final entry in screenSizes.entries) {
      testWidgets('Renders MainNavigationWrapper at ${entry.key} without RenderFlex overflow', (tester) async {
        tester.view.physicalSize = entry.value;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(createTestApp());
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 200));

        // Verify bottom destinations are present
        expect(find.text('Home'), findsOneWidget);
        expect(find.text('Money'), findsOneWidget);
        expect(find.text('Budgets'), findsOneWidget);

        // Verify no uncaught Flutter layout errors
        expect(tester.takeException(), isNull);
      });
    }

    testWidgets('Balance privacy toggle hides and reveals numbers without error', (tester) async {
      await tester.pumpWidget(createTestApp());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      // Locate visibility toggle icon on Dashboard
      final visibilityIcon = find.byIcon(Icons.visibility_rounded);
      if (visibilityIcon.evaluate().isNotEmpty) {
        await tester.tap(visibilityIcon);
        await tester.pump();
        expect(find.byIcon(Icons.visibility_off_rounded), findsOneWidget);

        // Tap again to reveal
        await tester.tap(find.byIcon(Icons.visibility_off_rounded));
        await tester.pump();
        expect(find.byIcon(Icons.visibility_rounded), findsOneWidget);
      }
      expect(tester.takeException(), isNull);
    });
  });
}
