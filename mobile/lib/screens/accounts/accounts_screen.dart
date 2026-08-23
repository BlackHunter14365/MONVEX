import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/account.dart';
import '../../providers/account_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/empty_state_view.dart';

class AccountsScreen extends StatefulWidget {
  const AccountsScreen({super.key});

  @override
  State<AccountsScreen> createState() => _AccountsScreenState();
}

class _AccountsScreenState extends State<AccountsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AccountProvider>().fetchAccounts();
    });
  }

  void _openAddAccountDialog() {
    final nameController = TextEditingController();
    final balanceController = TextEditingController();
    final institutionController = TextEditingController();
    String type = 'CHECKING';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surfaceElevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Add Account', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 18)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                  decoration: const InputDecoration(labelText: 'Account Nickname (e.g. Salary A/c)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: institutionController,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                  decoration: const InputDecoration(labelText: 'Bank / Institution (e.g. HDFC, Chase)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: balanceController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                  decoration: const InputDecoration(labelText: 'Initial Balance (₹)'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: type,
                  dropdownColor: AppColors.surfaceElevated,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                  decoration: const InputDecoration(labelText: 'Account Type'),
                  items: const [
                    DropdownMenuItem(value: 'CHECKING', child: Text('Checking')),
                    DropdownMenuItem(value: 'SAVINGS', child: Text('Savings')),
                    DropdownMenuItem(value: 'CREDIT', child: Text('Credit Card')),
                    DropdownMenuItem(value: 'INVESTMENT', child: Text('Investment')),
                    DropdownMenuItem(value: 'CASH', child: Text('Cash Wallet')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => type = val);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                final balance = double.tryParse(balanceController.text) ?? 0.0;
                final name = nameController.text.trim();
                if (name.isEmpty) return;

                final success = await context.read<AccountProvider>().addAccount({
                  'name': name,
                  'institution': institutionController.text.trim(),
                  'balance': balance,
                  'type': type,
                  'currency': 'INR',
                });

                if (success && mounted) {
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getAccountIcon(String type) {
    switch (type.toUpperCase()) {
      case 'CREDIT':
        return Icons.credit_card;
      case 'SAVINGS':
        return Icons.savings_outlined;
      case 'INVESTMENT':
        return Icons.trending_up;
      case 'CASH':
        return Icons.money;
      case 'CHECKING':
      default:
        return Icons.account_balance;
    }
  }

  @override
  Widget build(BuildContext context) {
    final accProvider = context.watch<AccountProvider>();
    final accounts = accProvider.accounts;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Financial Accounts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => accProvider.fetchAccounts(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAddAccountDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: accProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: () => accProvider.fetchAccounts(),
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Total Liquid Balance Card
                    MonvexCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TOTAL LIQUID ASSETS',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            Formatters.currency(accProvider.totalLiquidBalance),
                            style: const TextStyle(
                              color: AppColors.income,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Across ${accounts.length} connected financial accounts',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    const Text(
                      'Connected Accounts',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (accounts.isEmpty)
                      EmptyStateView(
                        icon: Icons.account_balance_wallet_outlined,
                        title: 'No accounts connected',
                        description: 'Add your bank, credit card, or wallet accounts to track balances.',
                        actionLabel: 'Add First Account',
                        onAction: _openAddAccountDialog,
                      )
                    else
                      ...accounts.map((acc) => _buildAccountCard(acc, accProvider)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildAccountCard(AccountModel acc, AccountProvider provider) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getAccountIcon(acc.type),
              color: AppColors.primaryLight,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  acc.name,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  acc.institution,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Formatters.currency(acc.balance),
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  acc.type,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 9, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
