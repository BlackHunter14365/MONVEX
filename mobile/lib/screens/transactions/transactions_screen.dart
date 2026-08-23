import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/transaction_provider.dart';
import '../../shared/widgets/transaction_tile.dart';
import '../../shared/widgets/empty_state_view.dart';
import 'add_transaction_sheet.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TransactionProvider>().fetchTransactions();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openAddTransactionSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddTransactionSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final txProvider = context.watch<TransactionProvider>();
    final transactions = txProvider.transactions;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Transactions Ledger'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => txProvider.fetchTransactions(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAddTransactionSheet,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          // Filter & Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  onChanged: (val) => txProvider.setSearchQuery(val),
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search merchant, description, category...',
                    prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.textMuted),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 16, color: AppColors.textMuted),
                            onPressed: () {
                              _searchController.clear();
                              txProvider.setSearchQuery('');
                            },
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildFilterChip('ALL', 'All', txProvider),
                    const SizedBox(width: 8),
                    _buildFilterChip('EXPENSE', 'Expenses', txProvider),
                    const SizedBox(width: 8),
                    _buildFilterChip('INCOME', 'Income', txProvider),
                  ],
                ),
              ],
            ),
          ),

          // Transactions List
          Expanded(
            child: txProvider.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : transactions.isEmpty
                    ? const EmptyStateView(
                        icon: Icons.receipt_long_outlined,
                        title: 'No transactions found',
                        description: 'Try adjusting your filters or search term.',
                      )
                    : RefreshIndicator(
                        onRefresh: () => txProvider.fetchTransactions(),
                        color: AppColors.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: transactions.length,
                          itemBuilder: (context, index) {
                            return TransactionTile(
                              transaction: transactions[index],
                              onDelete: () => txProvider.deleteTransaction(transactions[index].id),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String type, String label, TransactionProvider provider) {
    final isSelected = provider.filterType == type;
    return GestureDetector(
      onTap: () => provider.setFilterType(type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
