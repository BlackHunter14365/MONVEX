import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/monvex_theme.dart';
import 'core/constants/colors.dart';
import 'core/utils/haptics.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/transaction_provider.dart';
import 'providers/account_provider.dart';
import 'providers/money_hub_provider.dart';
import 'providers/receipt_provider.dart';
import 'providers/budget_provider.dart';
import 'providers/goal_provider.dart';
import 'providers/copilot_provider.dart';
import 'providers/search_provider.dart';

import 'screens/auth/login_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/money/money_hub_screen.dart';
import 'screens/budgets_goals/budgets_goals_screen.dart';
import 'screens/receipts/receipts_screen.dart';
import 'screens/copilot/copilot_screen.dart';
import 'screens/navigation/quick_add_sheet.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('[MONVEX] FlutterError: ${details.exceptionAsString()}');
  };
  runApp(const MonvexApp());
}

class MonvexApp extends StatelessWidget {
  const MonvexApp({super.key});

  @override
  Widget build(BuildContext context) {
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
        title: 'MONVEX',
        debugShowCheckedModeBanner: false,
        theme: MonvexTheme.darkTheme,
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                height: 48,
                width: 48,
                child: Center(
                  child: Text('M', style: TextStyle(color: AppColors.primary, fontSize: 32, fontWeight: FontWeight.w900)),
                ),
              ),
              SizedBox(height: 16),
              CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
            ],
          ),
        ),
      );
    }

    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    if (auth.isAppLocked) {
      return const BiometricLockScreen();
    }

    return const MainNavigationWrapper();
  }
}

class BiometricLockScreen extends StatelessWidget {
  const BiometricLockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.fingerprint, size: 54, color: AppColors.primaryLight),
              ),
              const SizedBox(height: 20),
              const Text(
                'MONVEX Vault Locked',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              const Text(
                'Biometric authentication enabled. Tap below to verify your identity with Android Keystore.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 28),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                ),
                onPressed: () {
                  AppHaptics.success();
                  auth.unlockApp();
                },
                icon: const Icon(Icons.lock_open, size: 18),
                label: const Text('Unlock Vault', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _currentIndex = 0;

  late final List<Widget> _screens = [
    const DashboardScreen(),
    const MoneyHubScreen(),
    const BudgetsGoalsScreen(),
    const ReceiptsScreen(),
    const CopilotScreen(),
  ];

  void _openQuickAddSheet() {
    AppHaptics.medium();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => QuickAddBottomSheet(
        onScanReceipt: () {
          setState(() => _currentIndex = 3);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _currentIndex != 0) {
          setState(() => _currentIndex = 0);
        }
      },
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
        floatingActionButton: _currentIndex != 3
            ? FloatingActionButton(
                backgroundColor: AppColors.primary,
                onPressed: _openQuickAddSheet,
                child: const Icon(Icons.add, color: Colors.white),
              )
            : null,
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) {
            AppHaptics.selection();
            setState(() => _currentIndex = idx);
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet),
              label: 'Money',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.pie_chart_outline),
              activeIcon: Icon(Icons.pie_chart),
              label: 'Budgets',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.document_scanner_outlined),
              activeIcon: Icon(Icons.document_scanner),
              label: 'Receipts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_outlined),
              activeIcon: Icon(Icons.auto_awesome),
              label: 'Copilot',
            ),
          ],
        ),
      ),
    );
  }
}
