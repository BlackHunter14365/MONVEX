import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/haptics.dart';
import '../transactions/add_transaction_sheet.dart';
import '../transactions/quick_entry_sheet.dart';

class QuickAddBottomSheet extends StatelessWidget {
  final VoidCallback? onScanReceipt;

  const QuickAddBottomSheet({
    super.key,
    this.onScanReceipt,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              height: 4,
              width: 40,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Quick Financial Actions',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'MONVEX V5',
                  style: TextStyle(
                    color: AppColors.primaryLight,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          _buildActionTile(
            context: context,
            icon: Icons.trending_down,
            iconColor: AppColors.expense,
            bgColor: AppColors.expenseBg,
            title: 'Add Expense',
            subtitle: 'Log money spent on dining, shopping, transit, bills',
            onTap: () {
              Navigator.pop(context);
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const AddTransactionSheet(initialType: 'EXPENSE'),
              );
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context: context,
            icon: Icons.trending_up,
            iconColor: AppColors.income,
            bgColor: AppColors.incomeBg,
            title: 'Add Income',
            subtitle: 'Record salary, dividends, freelance, or transfers',
            onTap: () {
              Navigator.pop(context);
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const AddTransactionSheet(initialType: 'INCOME'),
              );
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context: context,
            icon: Icons.swap_horiz,
            iconColor: AppColors.info,
            bgColor: AppColors.infoBg,
            title: 'Transfer Between Accounts',
            subtitle: 'Shift capital between bank accounts, wallets, or investments',
            onTap: () {
              Navigator.pop(context);
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const AddTransactionSheet(initialType: 'TRANSFER'),
              );
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context: context,
            icon: Icons.document_scanner_outlined,
            iconColor: AppColors.primaryLight,
            bgColor: AppColors.primary.withOpacity(0.12),
            title: 'Scan Paper / Digital Receipt',
            subtitle: 'Multimodal AI extracts items and merchant with review',
            onTap: () {
              Navigator.pop(context);
              if (onScanReceipt != null) {
                onScanReceipt!();
              }
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context: context,
            icon: Icons.auto_awesome,
            iconColor: AppColors.warning,
            bgColor: AppColors.warningBg,
            title: 'AI Natural Language / Voice Entry',
            subtitle: 'Type "Spent \$45 at Blue Bottle" and AI parses it instantly',
            onTap: () {
              Navigator.pop(context);
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => QuickEntrySheet(
                  onSwitchToReceiptScanner: onScanReceipt,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: () {
        AppHaptics.light();
        onTap();
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: AppColors.textMuted,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}