import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../models/transaction.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/money_hub_provider.dart';

class AddTransactionSheet extends StatefulWidget {
  final String initialType;
  final TransactionModel? transactionToEdit;

  const AddTransactionSheet({
    super.key,
    this.initialType = 'EXPENSE',
    this.transactionToEdit,
  });

  @override
  State<AddTransactionSheet> createState() => _AddTransactionSheetState();
}

class _AddTransactionSheetState extends State<AddTransactionSheet> {
  late final TextEditingController _amountController;
  late final TextEditingController _merchantController;
  late final TextEditingController _descriptionController;
  late String _type;
  late String _category;
  late DateTime _date;
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
    'Investments',
    'Transfer',
    'General',
  ];

  @override
  void initState() {
    super.initState();
    final tx = widget.transactionToEdit;
    if (tx != null) {
      _amountController = TextEditingController(text: tx.amount > 0 ? tx.amount.toStringAsFixed(2) : '');
      _merchantController = TextEditingController(text: tx.merchantName ?? '');
      _descriptionController = TextEditingController(text: tx.description ?? '');
      _type = tx.type;
      _category = _categories.contains(tx.categoryName) ? tx.categoryName : 'General';
      _date = DateTime.tryParse(tx.date) ?? DateTime.now();
    } else {
      _amountController = TextEditingController();
      _merchantController = TextEditingController();
      _descriptionController = TextEditingController();
      _type = widget.initialType;
      _category = widget.initialType == 'INCOME'
          ? 'Salary & Income'
          : widget.initialType == 'TRANSFER'
              ? 'Transfer'
              : 'Food & Dining';
      _date = DateTime.now();
    }
  }

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
    bool success;

    if (widget.transactionToEdit != null) {
      success = await txProvider.updateTransaction(widget.transactionToEdit!.id, payload);
    } else {
      success = await txProvider.addTransaction(payload);
    }

    if (success && mounted) {
      context.read<DashboardProvider>().fetchDashboard();
      context.read<MoneyHubProvider>().fetchAll();
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.transactionToEdit != null
              ? 'Transaction updated successfully.'
              : 'Transaction recorded successfully.'),
          backgroundColor: AppColors.income,
        ),
      );
    } else if (mounted) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(txProvider.errorMessage ?? 'Failed to save transaction.'),
          backgroundColor: AppColors.expense,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.transactionToEdit != null;

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

            Text(
              isEditing ? 'Edit Transaction' : 'Add Transaction',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),

            // 3-Way Type Segment: Expense / Income / Transfer
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
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
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
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _type = 'TRANSFER'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _type == 'TRANSFER' ? AppColors.infoBg : AppColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _type == 'TRANSFER' ? AppColors.info : AppColors.border,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Transfer',
                          style: TextStyle(
                            color: _type == 'TRANSFER' ? AppColors.info : AppColors.textMuted,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
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
              autofocus: !isEditing,
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
                  : Text(isEditing ? 'Save Changes' : 'Save Transaction'),
            ),
          ],
        ),
      ),
    );
  }
}
