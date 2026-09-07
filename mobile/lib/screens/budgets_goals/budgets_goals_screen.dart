import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/haptics.dart';
import '../../models/goal.dart';
import '../../providers/budget_provider.dart';
import '../../providers/goal_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/empty_state_view.dart';

class BudgetsGoalsScreen extends StatefulWidget {
  const BudgetsGoalsScreen({super.key});

  @override
  State<BudgetsGoalsScreen> createState() => _BudgetsGoalsScreenState();
}

class _BudgetsGoalsScreenState extends State<BudgetsGoalsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        AppHaptics.selection();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BudgetProvider>().fetchBudgets();
      context.read<GoalProvider>().fetchGoals();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showAddBudgetDialog() {
    AppHaptics.medium();
    final catCtrl = TextEditingController(text: 'Food & Dining');
    final amountCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        title: const Text('Add Monthly Budget Cap'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: catCtrl,
              decoration: const InputDecoration(labelText: 'Category Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Monthly Limit Amount'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(amountCtrl.text) ?? 0.0;
              if (amt > 0) {
                await context.read<BudgetProvider>().createBudget({
                  'category_name': catCtrl.text.trim(),
                  'amount': amt,
                  'period': 'MONTHLY',
                });
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Save Budget'),
          ),
        ],
      ),
    );
  }

  void _showAddGoalDialog() {
    AppHaptics.medium();
    final nameCtrl = TextEditingController();
    final targetCtrl = TextEditingController();
    final dateCtrl = TextEditingController(
      text: DateTime.now().add(const Duration(days: 90)).toIso8601String().split('T').first,
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        title: const Text('Add Financial Milestone / Goal'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Goal Name (e.g. Emergency Fund)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: targetCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Target Savings Amount'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: dateCtrl,
              decoration: const InputDecoration(labelText: 'Target Date (YYYY-MM-DD)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final target = double.tryParse(targetCtrl.text) ?? 0.0;
              if (nameCtrl.text.trim().isNotEmpty && target > 0) {
                await context.read<GoalProvider>().createGoal({
                  'name': nameCtrl.text.trim(),
                  'target_amount': target,
                  'target_date': dateCtrl.text.trim(),
                });
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Create Goal'),
          ),
        ],
      ),
    );
  }

  void _showContributeDialog(GoalModel goal) {
    AppHaptics.medium();
    final amtCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        title: Text('Contribute to ${goal.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Current: ${Formatters.currency(goal.currentAmount)} of ${Formatters.currency(goal.targetAmount)}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: amtCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Contribution Amount',
                prefixIcon: Icon(Icons.attach_money),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.income),
            onPressed: () async {
              final amt = double.tryParse(amtCtrl.text) ?? 0.0;
              if (amt > 0) {
                final success = await context.read<GoalProvider>().contributeToGoal(goal.id, amt);
                if (success) {
                  AppHaptics.success();
                }
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Contribute Funds'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final budgetProvider = context.watch<BudgetProvider>();
    final goalProvider = context.watch<GoalProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Budgets & Financial Goals'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: AppColors.primaryLight),
            tooltip: 'Add item',
            onPressed: () {
              AppHaptics.light();
              if (_tabController.index == 0) {
                _showAddBudgetDialog();
              } else {
                _showAddGoalDialog();
              }
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.textPrimary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
          tabs: const [
            Tab(text: 'Monthly Pacing & Budgets'),
            Tab(text: 'Milestones & Targets'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBudgetsList(budgetProvider),
          _buildGoalsList(goalProvider),
        ],
      ),
    );
  }

  Widget _buildBudgetsList(BudgetProvider provider) {
    if (provider.isLoading && provider.budgets.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (provider.budgets.isEmpty) {
      return const EmptyStateView(
        icon: Icons.pie_chart_outline,
        title: 'No budgets created',
        description: 'Set spending caps across food, transit, or shopping to monitor real-time pace.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.fetchBudgets(),
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: provider.budgets.length,
        itemBuilder: (context, index) {
          final budget = provider.budgets[index];
          final progress = (budget.spent / (budget.amount > 0 ? budget.amount : 1.0)).clamp(0.0, 1.0);
          final isOver = budget.spent > budget.amount;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: MonvexCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        budget.categoryName,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isOver ? AppColors.expenseBg : AppColors.incomeBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              budget.paceInsight,
                              style: TextStyle(
                                color: isOver ? AppColors.expense : AppColors.income,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.textMuted),
                            tooltip: 'Delete Budget',
                            onPressed: () async {
                              AppHaptics.warning();
                              await provider.deleteBudget(budget.id);
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: AppColors.surfaceElevated,
                      color: isOver ? AppColors.expense : (progress > 0.8 ? AppColors.warning : AppColors.income),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Spent: ${Formatters.currency(budget.spent)}',
                        style: TextStyle(
                          color: isOver ? AppColors.expense : AppColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Limit: ${Formatters.currency(budget.amount)}',
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGoalsList(GoalProvider provider) {
    if (provider.isLoading && provider.goals.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (provider.goals.isEmpty) {
      return const EmptyStateView(
        icon: Icons.track_changes,
        title: 'No savings milestones yet',
        description: 'Create an emergency fund or milestone target to track savings progress.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.fetchGoals(),
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: provider.goals.length,
        itemBuilder: (context, index) {
          final goal = provider.goals[index];
          final progress = (goal.currentAmount / (goal.targetAmount > 0 ? goal.targetAmount : 1.0)).clamp(0.0, 1.0);

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: MonvexCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          goal.name,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      Text(
                        '${(progress * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(
                          color: AppColors.primaryLight,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Target: ${Formatters.currency(goal.targetAmount)} • ${goal.daysRemaining} days left',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: AppColors.surfaceElevated,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Saved: ${Formatters.currency(goal.currentAmount)}',
                        style: const TextStyle(
                          color: AppColors.income,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.surfaceElevated,
                              foregroundColor: AppColors.primaryLight,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: const BorderSide(color: AppColors.border),
                              ),
                            ),
                            onPressed: () => _showContributeDialog(goal),
                            icon: const Icon(Icons.add_circle_outline, size: 14),
                            label: const Text('Contribute', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.textMuted),
                            tooltip: 'Delete Goal',
                            onPressed: () async {
                              AppHaptics.warning();
                              await provider.deleteGoal(goal.id);
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
