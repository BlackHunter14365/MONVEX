import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/config/env_config.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../analytics/analytics_screen.dart';
import '../budgets/budgets_screen.dart';
import '../goals/goals_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings & Financial Hub'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Profile Card
            MonvexCard(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      user?.displayName.substring(0, 1).toUpperCase() ?? 'M',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.displayName ?? 'MONVEX User',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? '',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.incomeBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Monthly Base: ${Formatters.currency(user?.monthlyIncome ?? 0)}',
                            style: const TextStyle(color: AppColors.income, fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Financial Workspace Navigation
            const Text(
              'Financial Planning',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),

            _buildNavTile(
              context,
              icon: Icons.pie_chart_outline,
              title: 'Budgets & Spending Velocity',
              subtitle: 'Category caps and threshold alerts',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BudgetsScreen())),
            ),
            _buildNavTile(
              context,
              icon: Icons.track_changes,
              title: 'Savings Targets & Milestones',
              subtitle: 'Emergency fund and asset horizons',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GoalsScreen())),
            ),
            _buildNavTile(
              context,
              icon: Icons.analytics_outlined,
              title: 'Analytics & Health Diagnostic',
              subtitle: '10-vector solvency breakdown and burn rate',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen())),
            ),

            const SizedBox(height: 20),

            // Security & Environment
            const Text(
              'Perimeter Security',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),

            MonvexCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Row(
                    children: [
                      Icon(Icons.shield_outlined, color: AppColors.income, size: 20),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Vault Encryption Active',
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Android Keystore hardware-isolated credentials',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Active Backend Host',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                      Text(
                        EnvConfig.baseUrl,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sign Out Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.expense),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: AppColors.surfaceElevated,
                      title: const Text('Sign out of MONVEX?'),
                      content: const Text('Your secure session tokens will be removed from this device.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.expense),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Sign Out'),
                        ),
                      ],
                    ),
                  );

                  if (confirm == true) {
                    await auth.logout();
                  }
                },
                icon: const Icon(Icons.logout, color: AppColors.expense, size: 18),
                label: const Text('Sign Out of MONVEX', style: TextStyle(color: AppColors.expense, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.surfaceElevated,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primaryLight, size: 20),
        ),
        title: Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        onTap: onTap,
      ),
    );
  }
}
