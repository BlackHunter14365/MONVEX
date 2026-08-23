import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/health_score_gauge.dart';
import '../../shared/widgets/transaction_tile.dart';
import '../../shared/widgets/empty_state_view.dart';
import '../search/search_sheet.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchDashboard();
    });
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dashboard = context.watch<DashboardProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('M', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 13)),
            ),
            const SizedBox(width: 8),
            const Text('MONVEX', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.textSecondary),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const SearchSheet(),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () => context.read<DashboardProvider>().fetchDashboard(),
          ),
        ],
      ),
      body: dashboard.isLoading && dashboard.rawMetrics == null
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: () => context.read<DashboardProvider>().fetchDashboard(),
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting & Live Telemetry Banner
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_getGreeting()}, ${user?.displayName ?? "there"}',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Real-time financial intelligence telemetry',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.incomeBg,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.income.withOpacity(0.3)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(radius: 3, backgroundColor: AppColors.income),
                              SizedBox(width: 5),
                              Text('LIVE', style: TextStyle(color: AppColors.income, fontSize: 9, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Net Balance & Cashflow Card
                    MonvexCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'NET FINANCIAL POSITION',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            Formatters.currency(dashboard.netWorth),
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -1.0,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Divider(color: AppColors.borderSubtle, height: 1),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _buildMetricColumn('Monthly Income', dashboard.monthlyIncome, AppColors.income),
                              _buildMetricColumn('Monthly Spent', dashboard.monthlyExpense, AppColors.expense),
                              _buildMetricColumn('Cash Flow', dashboard.cashFlow, dashboard.cashFlow >= 0 ? AppColors.income : AppColors.expense),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Health Score Card
                    if (dashboard.healthScore != null)
                      MonvexCard(
                        padding: const EdgeInsets.all(18),
                        child: Row(
                          children: [
                            HealthScoreGauge(
                              score: dashboard.healthScore!.score,
                              grade: dashboard.healthScore!.grade,
                            ),
                            const SizedBox(width: 18),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text(
                                        'Financial Health',
                                        style: TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.incomeBg,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          dashboard.healthScore!.status,
                                          style: const TextStyle(
                                            color: AppColors.income,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    '10-vector algorithmic solvency and savings adherence score.',
                                    style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.3),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 20),

                    // Recent Activity Header
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Recent Transactions',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Recent Transactions List
                    if (dashboard.recentTransactions.isEmpty)
                      const EmptyStateView(
                        icon: Icons.receipt_long_outlined,
                        title: 'No transactions yet',
                        description: 'Your recent transactions will appear here once recorded.',
                      )
                    else
                      ...dashboard.recentTransactions.map(
                        (tx) => TransactionTile(transaction: tx),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetricColumn(String title, double amount, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        const SizedBox(height: 2),
        Text(
          Formatters.compactCurrency(amount),
          style: TextStyle(
            color: color,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
