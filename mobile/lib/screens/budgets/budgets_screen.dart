import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/budget.dart';
import '../../providers/budget_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/empty_state_view.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BudgetProvider>().fetchBudgets();
    });
  }

  void _openAddBudgetDialog() {
    final categoryController = TextEditingController();
    final amountController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('New Category Budget', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: categoryController,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(labelText: 'Category (e.g. Dining, Fuel, Groceries)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(labelText: 'Monthly Limit (₹)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final amount = double.tryParse(amountController.text) ?? 0.0;
              final cat = categoryController.text.trim();
              if (cat.isEmpty || amount <= 0) return;

              final success = await context.read<BudgetProvider>().createBudget({
                'category_name': cat,
                'limit_amount': amount,
                'period': 'MONTHLY',
              });

              if (success && mounted) {
                Navigator.pop(ctx);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final budgetProvider = context.watch<BudgetProvider>();
    final budgets = budgetProvider.budgets;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Budgets & Spending Velocity'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => budgetProvider.fetchBudgets(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAddBudgetDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: budgetProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: () => budgetProvider.fetchBudgets(),
              color: AppColors.primary,
              child: budgets.isEmpty
                  ? EmptyStateView(
                      icon: Icons.pie_chart_outline,
                      title: 'No budgets created yet',
                      description: 'Set spending caps on your dining, shopping, and entertainment to maintain financial discipline.',
                      actionLabel: 'Create First Budget',
                      onAction: _openAddBudgetDialog,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: budgets.length,
                      itemBuilder: (context, index) {
                        final b = budgets[index];
                        return _buildBudgetCard(b);
                      },
                    ),
            ),
    );
  }

  Widget _buildBudgetCard(BudgetModel b) {
    Color barColor = AppColors.income;
    Color badgeColor = AppColors.income;
    String badgeText = 'ON TRACK';

    if (b.isExceeded) {
      barColor = AppColors.expense;
      badgeColor = AppColors.expense;
      badgeText = 'EXCEEDED';
    } else if (b.isWarning) {
      barColor = AppColors.warning;
      badgeColor = AppColors.warning;
      badgeText = 'WARNING';
    }

    final pct = (b.usagePercentage / 100.0).clamp(0.0, 1.0);

    return MonvexCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                b.categoryName,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: badgeColor.withOpacity(0.3)),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
          const SizedBox(height: 12),

          // Details Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Spent / Limit', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(
                    '${Formatters.currency(b.spentAmount)} / ${Formatters.currency(b.limitAmount)}',
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Usage', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(
                    '${b.usagePercentage.toStringAsFixed(1)}%',
                    style: TextStyle(color: barColor, fontSize: 13, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
