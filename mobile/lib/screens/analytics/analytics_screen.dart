import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../providers/dashboard_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/health_score_gauge.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final dashboard = context.watch<DashboardProvider>();
    final healthScore = dashboard.healthScore;
    final income = dashboard.monthlyIncome;
    final expense = dashboard.monthlyExpense;
    final savings = (income - expense).clamp(0.0, double.infinity);
    final savingsRate = income > 0 ? (savings / income) * 100 : 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Financial Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => dashboard.fetchDashboard(),
          ),
        ],
      ),
      body: dashboard.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: () => dashboard.fetchDashboard(),
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Savings Rate Spotlight Card
                    MonvexCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'MONTHLY SAVINGS RATE',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Text(
                                '${savingsRate.toStringAsFixed(1)}%',
                                style: const TextStyle(
                                  color: AppColors.income,
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -1.0,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.incomeBg,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  savingsRate >= 20 ? 'Optimal (>=20%)' : 'Needs Pacing',
                                  style: const TextStyle(color: AppColors.income, fontSize: 10, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: (savingsRate / 100.0).clamp(0.0, 1.0),
                              minHeight: 8,
                              backgroundColor: Colors.white.withOpacity(0.08),
                              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.income),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Health Score Breakdown
                    if (healthScore != null) ...[
                      const Text(
                        '10-Vector Health Diagnostic',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 12),
                      MonvexCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                HealthScoreGauge(score: healthScore.score, grade: healthScore.grade, size: 70),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Grade ${healthScore.grade} - ${healthScore.status}',
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      const Text(
                                        'Calculated via deterministic cash runway and budget solvency algorithms.',
                                        style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.3),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),

                    // Cash Burn Analysis
                    const Text(
                      'Cash Flow Breakdown',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: MonvexCard(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Total Income', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                const SizedBox(height: 4),
                                Text(
                                  Formatters.currency(income),
                                  style: const TextStyle(color: AppColors.income, fontSize: 16, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: MonvexCard(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Total Expense', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                const SizedBox(height: 4),
                                Text(
                                  Formatters.currency(expense),
                                  style: const TextStyle(color: AppColors.expense, fontSize: 16, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
