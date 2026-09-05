import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/haptics.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../../shared/widgets/health_score_gauge.dart';
import '../../shared/widgets/transaction_tile.dart';
import '../../shared/widgets/empty_state_view.dart';
import '../search/search_sheet.dart';
import '../settings/settings_screen.dart';
import '../transactions/quick_entry_sheet.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _obscureBalance = false;
  final _impulseAmtCtrl = TextEditingController();
  String _impulseCategory = 'Shopping';
  bool _isEvaluatingImpulse = false;
  Map<String, dynamic>? _impulseResult;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchDashboard();
    });
  }

  @override
  void dispose() {
    _impulseAmtCtrl.dispose();
    super.dispose();
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
              AppHaptics.light();
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const SearchSheet(),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.textSecondary),
            onPressed: () {
              AppHaptics.light();
              Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textSecondary),
            onPressed: () {
              AppHaptics.selection();
              context.read<DashboardProvider>().fetchDashboard();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () {
          AppHaptics.medium();
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => const QuickEntrySheet(),
          );
        },
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

                    // Net Balance & Cashflow Card with Privacy Toggle
                    MonvexCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                                icon: Icon(
                                  _obscureBalance ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  size: 18,
                                  color: AppColors.textMuted,
                                ),
                                onPressed: () {
                                  AppHaptics.selection();
                                  setState(() => _obscureBalance = !_obscureBalance);
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _obscureBalance ? '••••••••' : Formatters.currency(dashboard.netWorth),
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

                    // Impulse Buy / Affordability Simulator Card
                    _buildImpulseBuySimulator(),
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

  Widget _buildImpulseBuySimulator() {
    return MonvexCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.bolt, color: AppColors.warning, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Instant Affordability Check',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.warningBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'PRE-SPEND AI',
                  style: TextStyle(color: AppColors.warning, fontSize: 9, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Test purchase impact against your runway & monthly budget before you buy.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _impulseAmtCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    hintText: 'Amount (\$)',
                    prefixIcon: Icon(Icons.attach_money, size: 18),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 4,
                child: DropdownButtonFormField<String>(
                  value: _impulseCategory,
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  dropdownColor: AppColors.surfaceElevated,
                  items: const [
                    DropdownMenuItem(value: 'Shopping', child: Text('Shopping', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: 'Electronics', child: Text('Electronics', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: 'Dining', child: Text('Dining', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: 'Entertainment', child: Text('Fun', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: 'Travel', child: Text('Travel', style: TextStyle(fontSize: 12))),
                  ],
                  onChanged: (v) => setState(() => _impulseCategory = v ?? 'Shopping'),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                onPressed: _isEvaluatingImpulse
                    ? null
                    : () async {
                        final amt = double.tryParse(_impulseAmtCtrl.text);
                        if (amt == null || amt <= 0) return;

                        setState(() => _isEvaluatingImpulse = true);
                        AppHaptics.medium();

                        final res = await context.read<DashboardProvider>().checkImpulseBuy(
                              amount: amt,
                              category: _impulseCategory,
                            );

                        if (mounted) {
                          setState(() {
                            _impulseResult = res;
                            _isEvaluatingImpulse = false;
                          });
                          AppHaptics.success();
                        }
                      },
                child: _isEvaluatingImpulse
                    ? const SizedBox(
                        height: 14,
                        width: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check, size: 18),
              ),
            ],
          ),
          if (_impulseResult != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _impulseResult!['can_afford'] == true ? AppColors.incomeBg : AppColors.expenseBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _impulseResult!['can_afford'] == true
                      ? AppColors.income.withOpacity(0.3)
                      : AppColors.expense.withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _impulseResult!['can_afford'] == true ? Icons.check_circle : Icons.warning_amber_rounded,
                        color: _impulseResult!['can_afford'] == true ? AppColors.income : AppColors.expense,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _impulseResult!['can_afford'] == true ? 'Affordable Purchase' : 'Caution / High Risk',
                        style: TextStyle(
                          color: _impulseResult!['can_afford'] == true ? AppColors.income : AppColors.expense,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _impulseResult!['recommendation'] ??
                        _impulseResult!['advice'] ??
                        'Solvency simulation indicates purchase fits within planned liquid reserve.',
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
