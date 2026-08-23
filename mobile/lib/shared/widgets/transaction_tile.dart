import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/transaction.dart';

class TransactionTile extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  const TransactionTile({
    super.key,
    required this.transaction,
    this.onTap,
    this.onDelete,
  });

  IconData _getCategoryIcon(String category) {
    final cat = category.toLowerCase();
    if (cat.contains('food') || cat.contains('dining') || cat.contains('restaurant')) {
      return Icons.restaurant;
    }
    if (cat.contains('shopping') || cat.contains('retail')) {
      return Icons.shopping_bag_outlined;
    }
    if (cat.contains('transport') || cat.contains('travel') || cat.contains('fuel')) {
      return Icons.directions_car_outlined;
    }
    if (cat.contains('bill') || cat.contains('utility') || cat.contains('rent')) {
      return Icons.receipt_long_outlined;
    }
    if (cat.contains('salary') || cat.contains('income')) {
      return Icons.account_balance_wallet_outlined;
    }
    if (cat.contains('entertainment') || cat.contains('movie')) {
      return Icons.movie_outlined;
    }
    return Icons.category_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.isIncome;
    final amountColor = isIncome ? AppColors.income : AppColors.textPrimary;
    final prefix = isIncome ? '+' : '-';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: isIncome ? AppColors.incomeBg : AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _getCategoryIcon(transaction.categoryName),
              size: 20,
              color: isIncome ? AppColors.income : AppColors.primaryLight,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.merchantName ?? transaction.categoryName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      transaction.categoryName,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Text(' • ', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    Text(
                      Formatters.relativeDate(transaction.date),
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$prefix${Formatters.currency(transaction.amount)}',
                style: TextStyle(
                  color: amountColor,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (transaction.accountName != null) ...[
                const SizedBox(height: 2),
                Text(
                  transaction.accountName!,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 10,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
