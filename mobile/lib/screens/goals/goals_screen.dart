import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/goal.dart';
import '../../providers/goal_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/empty_state_view.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GoalProvider>().fetchGoals();
    });
  }

  void _openAddGoalDialog() {
    final titleController = TextEditingController();
    final targetController = TextEditingController();
    final currentController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('New Savings Goal', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(labelText: 'Goal Title (e.g. Emergency Fund, New Laptop)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: targetController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(labelText: 'Target Amount (₹)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: currentController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(labelText: 'Starting Saved Amount (₹)'),
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
              final target = double.tryParse(targetController.text) ?? 0.0;
              final current = double.tryParse(currentController.text) ?? 0.0;
              final title = titleController.text.trim();
              if (title.isEmpty || target <= 0) return;

              final success = await context.read<GoalProvider>().createGoal({
                'title': title,
                'target_amount': target,
                'current_amount': current,
              });

              if (success && mounted) {
                Navigator.pop(ctx);
              }
            },
            child: const Text('Save Goal'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final goalProvider = context.watch<GoalProvider>();
    final goals = goalProvider.goals;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Savings Goals & Milestones'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => goalProvider.fetchGoals(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openAddGoalDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      body: goalProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: () => goalProvider.fetchGoals(),
              color: AppColors.primary,
              child: goals.isEmpty
                  ? EmptyStateView(
                      icon: Icons.track_changes,
                      title: 'No savings goals set yet',
                      description: 'Set emergency fund and asset milestones with automated completion forecasting.',
                      actionLabel: 'Create First Goal',
                      onAction: _openAddGoalDialog,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: goals.length,
                      itemBuilder: (context, index) {
                        final g = goals[index];
                        return _buildGoalCard(g);
                      },
                    ),
            ),
    );
  }

  Widget _buildGoalCard(GoalModel g) {
    final progress = (g.progressPercentage / 100.0).clamp(0.0, 1.0);

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
                g.title,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.incomeBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.income.withOpacity(0.3)),
                ),
                child: Text(
                  '${g.progressPercentage.round()}%',
                  style: const TextStyle(color: AppColors.income, fontSize: 11, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.08),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.income),
            ),
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Saved / Target', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(
                    '${Formatters.currency(g.currentAmount)} / ${Formatters.currency(g.targetAmount)}',
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Remaining', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(
                    Formatters.currency(g.remainingAmount),
                    style: const TextStyle(color: AppColors.warning, fontSize: 13, fontWeight: FontWeight.w800),
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
