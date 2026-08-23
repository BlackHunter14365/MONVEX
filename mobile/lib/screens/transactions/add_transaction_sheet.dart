import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/dashboard_provider.dart';

class AddTransactionSheet extends StatefulWidget {
  const AddTransactionSheet({super.key});

  @override
  State<AddTransactionSheet> createState() => _AddTransactionSheetState();
}

class _AddTransactionSheetState extends State<AddTransactionSheet> {
  final _amountController = TextEditingController();
  final _merchantController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _type = 'EXPENSE';
  String _category = 'Food & Dining';
  final DateTime _date = DateTime.now();
  bool _isSubmitting = false;

  final List<String> _categories = [
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Salary & Income',
    'Health & Medical',
    'General',
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _merchantController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final payload = {
      'amount': amount,
      'type': _type,
      'category_name': _category,
      'merchant_name': _merchantController.text.trim().isNotEmpty ? _merchantController.text.trim() : null,
      'description': _descriptionController.text.trim().isNotEmpty ? _descriptionController.text.trim() : null,
      'date': _date.toIso8601String().split('T').first,
    };

    final txProvider = context.read<TransactionProvider>();
    final success = await txProvider.addTransaction(payload);

    if (success && mounted) {
      context.read<DashboardProvider>().fetchDashboard();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Transaction recorded successfully.'),
          backgroundColor: AppColors.income,
        ),
      );
    } else if (mounted) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(txProvider.errorMessage ?? 'Failed to add transaction.'),
          backgroundColor: AppColors.expense,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle indicator
            Center(
              child: Container(
                height: 4,
                width: 36,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              'Add Transaction',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),

            // Type Segment
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _type = 'EXPENSE'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _type == 'EXPENSE' ? AppColors.expenseBg : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _type == 'EXPENSE' ? AppColors.expense : AppColors.border,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Expense',
                          style: TextStyle(
                            color: _type == 'EXPENSE' ? AppColors.expense : AppColors.textMuted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _type = 'INCOME'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _type == 'INCOME' ? AppColors.incomeBg : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _type == 'INCOME' ? AppColors.income : AppColors.border,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Income',
                          style: TextStyle(
                            color: _type == 'INCOME' ? AppColors.income : AppColors.textMuted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Amount Field
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixIcon: Icon(Icons.currency_rupee, color: AppColors.textMuted),
              ),
            ),
            const SizedBox(height: 12),

            // Category Dropdown
            DropdownButtonFormField<String>(
              value: _category,
              dropdownColor: AppColors.surfaceElevated,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(
                labelText: 'Category',
                prefixIcon: Icon(Icons.category_outlined, color: AppColors.textMuted),
              ),
              items: _categories.map((c) {
                return DropdownMenuItem(value: c, child: Text(c));
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _category = val);
              },
            ),
            const SizedBox(height: 12),

            // Merchant Field
            TextField(
              controller: _merchantController,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(
                labelText: 'Merchant / Payee (Optional)',
                prefixIcon: Icon(Icons.storefront_outlined, color: AppColors.textMuted),
              ),
            ),
            const SizedBox(height: 12),

            // Description Field
            TextField(
              controller: _descriptionController,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(
                labelText: 'Notes / Description (Optional)',
                prefixIcon: Icon(Icons.description_outlined, color: AppColors.textMuted),
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Save Transaction'),
            ),
          ],
        ),
      ),
    );
  }
}
