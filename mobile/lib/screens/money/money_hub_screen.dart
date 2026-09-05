import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/haptics.dart';
import '../../models/transaction.dart';
import '../../providers/money_hub_provider.dart';
import '../../providers/transaction_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/empty_state_view.dart';
import '../../shared/widgets/transaction_tile.dart';
import '../transactions/add_transaction_sheet.dart';

class MoneyHubScreen extends StatefulWidget {
  const MoneyHubScreen({super.key});

  @override
  State<MoneyHubScreen> createState() => _MoneyHubScreenState();
}

class _MoneyHubScreenState extends State<MoneyHubScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        AppHaptics.selection();
        context.read<MoneyHubProvider>().setSelectedTab(_tabController.index);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MoneyHubProvider>().fetchAll();
      context.read<TransactionProvider>().fetchTransactions();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showAddDialog() {
    AppHaptics.medium();
    final tabIndex = _tabController.index;
    if (tabIndex == 0) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const AddTransactionSheet(),
      );
    } else if (tabIndex == 1) {
      _showAddAccountDialog();
    } else if (tabIndex == 2) {
      _showAddAssetDialog();
    } else if (tabIndex == 3) {
      _showAddLiabilityDialog();
    } else if (tabIndex == 4) {
      _showAddSubscriptionDialog();
    }
  }

  void _showAddAccountDialog() {
    final nameCtrl = TextEditingController();
    final balanceCtrl = TextEditingController();
    String type = 'CHECKING';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surfaceElevated,
          title: const Text('Add Financial Account'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Account Name (e.g. Chase Checking)'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: balanceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Starting Balance'),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: type,
                dropdownColor: AppColors.surfaceElevated,
                items: const [
                  DropdownMenuItem(value: 'CHECKING', child: Text('Checking')),
                  DropdownMenuItem(value: 'SAVINGS', child: Text('Savings')),
                  DropdownMenuItem(value: 'INVESTMENT', child: Text('Investment')),
                  DropdownMenuItem(value: 'CREDIT', child: Text('Credit Card')),
                  DropdownMenuItem(value: 'CASH', child: Text('Cash Wallet')),
                ],
                onChanged: (v) => setDialogState(() => type = v ?? 'CHECKING'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                if (nameCtrl.text.trim().isNotEmpty) {
                  await context.read<MoneyHubProvider>().addAccount({
                    'name': nameCtrl.text.trim(),
                    'balance': bal,
                    'type': type,
                  });
                  if (ctx.mounted) Navigator.pop(ctx);
                }
              },
              child: const Text('Save Account'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAssetDialog() {
    final nameCtrl = TextEditingController();
    final valCtrl = TextEditingController();
    String cat = 'INVESTMENT';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surfaceElevated,
          title: const Text('Add Capital Asset'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Asset Name (e.g. Index Fund, Real Estate)'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: valCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Current Value'),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: cat,
                dropdownColor: AppColors.surfaceElevated,
                items: const [
                  DropdownMenuItem(value: 'INVESTMENT', child: Text('Investments / Stocks')),
                  DropdownMenuItem(value: 'REAL_ESTATE', child: Text('Real Estate')),
                  DropdownMenuItem(value: 'VEHICLE', child: Text('Vehicle')),
                  DropdownMenuItem(value: 'CRYPTO', child: Text('Cryptocurrency')),
                  DropdownMenuItem(value: 'COLLECTIBLE', child: Text('Valuable / Collectible')),
                ],
                onChanged: (v) => setDialogState(() => cat = v ?? 'INVESTMENT'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final val = double.tryParse(valCtrl.text) ?? 0.0;
                if (nameCtrl.text.trim().isNotEmpty) {
                  await context.read<MoneyHubProvider>().addAsset({
                    'name': nameCtrl.text.trim(),
                    'current_value': val,
                    'category': cat,
                  });
                  if (ctx.mounted) Navigator.pop(ctx);
                }
              },
              child: const Text('Save Asset'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddLiabilityDialog() {
    final nameCtrl = TextEditingController();
    final balCtrl = TextEditingController();
    final rateCtrl = TextEditingController(text: '5.0');
    final minPayCtrl = TextEditingController(text: '100');

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surfaceElevated,
          title: const Text('Add Debt / Liability'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Liability Name (e.g. Auto Loan)'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: balCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Total Balance Owed'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: rateCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Interest Rate % (APR)'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: minPayCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Minimum Monthly Payment'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final bal = double.tryParse(balCtrl.text) ?? 0.0;
                final rate = double.tryParse(rateCtrl.text) ?? 0.0;
                final minPay = double.tryParse(minPayCtrl.text) ?? 0.0;
                if (nameCtrl.text.trim().isNotEmpty) {
                  await context.read<MoneyHubProvider>().addLiability({
                    'name': nameCtrl.text.trim(),
                    'current_balance': bal,
                    'interest_rate': rate,
                    'minimum_payment': minPay,
                  });
                  if (ctx.mounted) Navigator.pop(ctx);
                }
              },
              child: const Text('Save Liability'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddSubscriptionDialog() {
    final nameCtrl = TextEditingController();
    final costCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        title: const Text('Add Recurring Subscription'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Service Name (e.g. Spotify, Cloud Host)'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: costCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Monthly Cost'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final cost = double.tryParse(costCtrl.text) ?? 0.0;
              if (nameCtrl.text.trim().isNotEmpty) {
                await context.read<MoneyHubProvider>().addSubscription({
                  'name': nameCtrl.text.trim(),
                  'amount': cost,
                  'billing_cycle': 'MONTHLY',
                });
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Save Subscription'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hub = context.watch<MoneyHubProvider>();
    final txProvider = context.watch<TransactionProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Money Hub & Balance Sheet'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.textPrimary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          tabs: const [
            Tab(text: 'Transactions'),
            Tab(text: 'Accounts'),
            Tab(text: 'Assets'),
            Tab(text: 'Liabilities'),
            Tab(text: 'Subscriptions'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        onPressed: _showAddDialog,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(
          _tabController.index == 0
              ? 'Add Transaction'
              : _tabController.index == 1
                  ? 'Add Account'
                  : _tabController.index == 2
                      ? 'Add Asset'
                      : _tabController.index == 3
                          ? 'Add Liability'
                          : 'Add Subscription',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTransactionsTab(txProvider),
          _buildAccountsTab(hub),
          _buildAssetsTab(hub),
          _buildLiabilitiesTab(hub),
          _buildSubscriptionsTab(hub),
        ],
      ),
    );
  }

  Widget _buildTransactionsTab(TransactionProvider tx) {
    return Column(
      children: [
        // Search & Filter bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (v) => tx.setSearchQuery(v),
                  decoration: InputDecoration(
                    hintText: 'Search merchant, note, category...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    suffixIcon: tx.searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 16),
                            onPressed: () => tx.setSearchQuery(''),
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              PopupMenuButton<String>(
                icon: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(Icons.filter_list, size: 20, color: AppColors.textSecondary),
                ),
                initialValue: tx.filterType,
                onSelected: (v) {
                  AppHaptics.selection();
                  tx.setFilterType(v);
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'ALL', child: Text('All Transactions')),
                  PopupMenuItem(value: 'EXPENSE', child: Text('Expenses Only')),
                  PopupMenuItem(value: 'INCOME', child: Text('Income Only')),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: tx.isLoading && tx.transactions.isEmpty
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : tx.transactions.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.receipt_long_outlined,
                      title: 'No transactions found',
                      description: 'Record manual expenses or scan a receipt.',
                    )
                  : RefreshIndicator(
                      onRefresh: () => tx.fetchTransactions(),
                      color: AppColors.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        itemCount: tx.transactions.length,
                        itemBuilder: (context, index) {
                          final item = tx.transactions[index];
                          return TransactionTile(
                            transaction: item,
                            onTap: () {
                              AppHaptics.light();
                              _showTransactionDetail(item);
                            },
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  void _showTransactionDetail(TransactionModel tx) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  tx.type == 'INCOME' ? 'Income Transaction' : 'Expense Transaction',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                Text(
                  Formatters.currency(tx.amount),
                  style: TextStyle(
                    color: tx.type == 'INCOME' ? AppColors.income : AppColors.expense,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              tx.merchantName ?? tx.categoryName,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w800),
            ),
            if (tx.description != null && tx.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(tx.description!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ],
            const SizedBox(height: 16),
            const Divider(color: AppColors.borderSubtle),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Date', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                Text(tx.date, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Category', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                Text(tx.categoryName, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.expense),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                onPressed: () async {
                  await context.read<TransactionProvider>().deleteTransaction(tx.id);
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                icon: const Icon(Icons.delete_outline, color: AppColors.expense, size: 18),
                label: const Text('Delete Transaction', style: TextStyle(color: AppColors.expense)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountsTab(MoneyHubProvider hub) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        MonvexCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('TOTAL LIQUID BALANCES', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                Formatters.currency(hub.totalLiquidBalance),
                style: const TextStyle(color: AppColors.income, fontSize: 26, fontWeight: FontWeight.w900),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (hub.accounts.isEmpty)
          const EmptyStateView(icon: Icons.account_balance, title: 'No accounts added', description: 'Add your checking, savings, or investment accounts.')
        else
          ...hub.accounts.map((a) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: ListTile(
                  leading: const Icon(Icons.account_balance_wallet, color: AppColors.primaryLight),
                  title: Text(a.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  subtitle: Text(a.type, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  trailing: Text(
                    Formatters.currency(a.balance),
                    style: TextStyle(
                      color: a.balance >= 0 ? AppColors.textPrimary : AppColors.expense,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildAssetsTab(MoneyHubProvider hub) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        MonvexCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('TOTAL ASSET VALUATION', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                Formatters.currency(hub.totalAssetValue),
                style: const TextStyle(color: AppColors.primaryLight, fontSize: 26, fontWeight: FontWeight.w900),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (hub.assets.isEmpty)
          const EmptyStateView(icon: Icons.pie_chart_outline, title: 'No capital assets tracked', description: 'Add real estate, equities, vehicles, or cryptocurrency.')
        else
          ...hub.assets.map((asset) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: ListTile(
                  leading: const Icon(Icons.trending_up, color: AppColors.income),
                  title: Text(asset.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  subtitle: Text(asset.category, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  trailing: Text(
                    Formatters.currency(asset.currentValue),
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildLiabilitiesTab(MoneyHubProvider hub) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        MonvexCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('TOTAL LIABILITIES / DEBT', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                Formatters.currency(hub.totalLiabilityBalance),
                style: const TextStyle(color: AppColors.expense, fontSize: 26, fontWeight: FontWeight.w900),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (hub.liabilities.isEmpty)
          const EmptyStateView(icon: Icons.money_off_csred_outlined, title: 'No liabilities recorded', description: 'Track loans, mortgages, and credit balances.')
        else
          ...hub.liabilities.map((l) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: ListTile(
                  leading: const Icon(Icons.credit_card, color: AppColors.expense),
                  title: Text(l.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  subtitle: Text('APR: ${l.interestRate}% • Min: ${Formatters.currency(l.minimumPayment)}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  trailing: Text(
                    Formatters.currency(l.currentBalance),
                    style: const TextStyle(color: AppColors.expense, fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildSubscriptionsTab(MoneyHubProvider hub) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        MonvexCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('MONTHLY RECURRING BURN', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                Formatters.currency(hub.totalMonthlySubscriptions),
                style: const TextStyle(color: AppColors.warning, fontSize: 26, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                'Annual recurring commitment: ${Formatters.currency(hub.totalMonthlySubscriptions * 12)}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (hub.subscriptions.isEmpty)
          const EmptyStateView(icon: Icons.repeat, title: 'No subscriptions active', description: 'Keep tabs on recurring SaaS, streaming, and memberships.')
        else
          ...hub.subscriptions.map((s) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: ListTile(
                  leading: const Icon(Icons.autorenew, color: AppColors.warning),
                  title: Text(s.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  subtitle: Text('${s.billingCycle} • Next: ${s.nextRenewalDate.isNotEmpty ? s.nextRenewalDate : "Scheduled"}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  trailing: Text(
                    Formatters.currency(s.amount),
                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ),
              )),
      ],
    );
  }
}
