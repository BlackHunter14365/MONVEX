import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/colors.dart';
import '../../core/networking/api_client.dart';
import '../../core/networking/api_endpoints.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/haptics.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/monvex_card.dart';
import '../analytics/analytics_screen.dart';
import '../budgets_goals/budgets_goals_screen.dart';
import 'edit_profile_sheet.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isDownloadingPdf = false;
  String? _lastDownloadedPdfPath;
  final String _selectedMonth = DateTime.now().toIso8601String().substring(0, 7);

  Future<void> _downloadPdfStatement() async {
    setState(() {
      _isDownloadingPdf = true;
      _lastDownloadedPdfPath = null;
    });
    AppHaptics.medium();

    try {
      final endpoint = '${ApiEndpoints.pdfReport}?month=$_selectedMonth';
      final pdfBytes = await ApiClient.getBytes(endpoint);

      final dir = await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/MONVEX_Statement_$_selectedMonth.pdf';
      final file = File(filePath);
      await file.writeAsBytes(pdfBytes);

      _lastDownloadedPdfPath = filePath;
      AppHaptics.success();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Statement generated successfully (${(pdfBytes.length / 1024).toStringAsFixed(1)} KB)'),
            backgroundColor: AppColors.income,
            action: SnackBarAction(
              label: 'Open',
              textColor: Colors.white,
              onPressed: () {
                OpenFilex.open(filePath);
              },
            ),
          ),
        );
      }
    } catch (_) {
      AppHaptics.warning();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text("Couldn't generate your statement."),
            backgroundColor: AppColors.expense,
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: _downloadPdfStatement,
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloadingPdf = false);
    }
  }

  void _openEditProfileSheet() {
    AppHaptics.selection();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const EditProfileSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Settings & Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Profile Card with Edit Button
            MonvexCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppColors.primary,
                        child: Text(
                          user?.displayName.substring(0, 1).toUpperCase() ?? 'M',
                          style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.displayName ?? 'MONVEX User',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
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
                                user?.monthlyIncome != null && user!.monthlyIncome > 0
                                    ? 'Monthly Base: ${Formatters.currency(user.monthlyIncome)}'
                                    : 'Monthly Base: Not configured',
                                style: const TextStyle(color: AppColors.income, fontSize: 10.5, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  const SizedBox(height: 10),
                  InkWell(
                    onTap: _openEditProfileSheet,
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.edit_outlined, size: 16, color: AppColors.accent),
                          SizedBox(width: 6),
                          Text(
                            'Edit Profile & Financial Parameters',
                            style: TextStyle(color: AppColors.accent, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Financial Intelligence Tools
            const Text(
              'Intelligence & Reporting',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),

            _buildNavTile(
              context,
              icon: Icons.pie_chart_outline,
              title: 'Budgets & Goals Hub',
              subtitle: 'Spend pacing vs month days and milestone targets',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BudgetsGoalsScreen())),
            ),
            _buildNavTile(
              context,
              icon: Icons.analytics_outlined,
              title: 'Analytics & Diagnostic',
              subtitle: '10-vector solvency breakdown and burn rate',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen())),
            ),

            const SizedBox(height: 20),

            // PDF Statement Download Card
            const Text(
              'Official Financial Statements',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),

            MonvexCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.picture_as_pdf, color: AppColors.accent, size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Monthly PDF Statement',
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Cryptographically formatted executive ledger statement',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceElevated,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Month:', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                              Text(_selectedMonth, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                        onPressed: _isDownloadingPdf ? null : _downloadPdfStatement,
                        icon: _isDownloadingPdf
                            ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.download, size: 16),
                        label: Text(_isDownloadingPdf ? 'Generating...' : 'Generate PDF'),
                      ),
                    ],
                  ),
                  if (_lastDownloadedPdfPath != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.accent),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            icon: const Icon(Icons.visibility_outlined, size: 16, color: AppColors.accent),
                            label: const Text('Open Statement', style: TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
                            onPressed: () {
                              OpenFilex.open(_lastDownloadedPdfPath!);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.border),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            icon: const Icon(Icons.share_outlined, size: 16, color: AppColors.textSecondary),
                            label: const Text('Share PDF', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                            onPressed: () {
                              Share.shareXFiles([XFile(_lastDownloadedPdfPath!)], text: 'MONVEX Statement for $_selectedMonth');
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Security & Hardware Vault
            const Text(
              'Perimeter Security & Keystore',
              style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),

            MonvexCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.fingerprint, color: AppColors.income, size: 24),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Biometric Device Lock',
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Require fingerprint or face ID when opening app',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: auth.biometricsEnabled,
                        activeColor: AppColors.income,
                        onChanged: (val) async {
                          AppHaptics.selection();
                          if (val) {
                            final ok = await auth.authenticateWithBiometrics();
                            if (ok) {
                              await auth.toggleBiometrics(true);
                            }
                          } else {
                            await auth.toggleBiometrics(false);
                          }
                        },
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
                        'Cloud Connection',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.income,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'MONVEX Cloud • Connected',
                            style: TextStyle(color: AppColors.income, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
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
                  AppHaptics.warning();
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: AppColors.surfaceElevated,
                      title: const Text('Sign out of MONVEX?'),
                      content: const Text('All session tokens and cached user data will be purged completely to prevent multi-tenant data leakage.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.expense),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Purge & Sign Out'),
                        ),
                      ],
                    ),
                  );

                  if (confirm == true) {
                    AppHaptics.medium();
                    await auth.logout();
                  }
                },
                icon: const Icon(Icons.logout, color: AppColors.expense, size: 18),
                label: const Text('Sign Out & Purge Cache', style: TextStyle(color: AppColors.expense, fontWeight: FontWeight.w700)),
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
        onTap: () {
          AppHaptics.light();
          onTap();
        },
      ),
    );
  }
}
