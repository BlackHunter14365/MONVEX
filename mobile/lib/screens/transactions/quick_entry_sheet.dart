import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/haptics.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/dashboard_provider.dart';

class QuickEntrySheet extends StatefulWidget {
  final VoidCallback? onSwitchToReceiptScanner;
  const QuickEntrySheet({super.key, this.onSwitchToReceiptScanner});

  @override
  State<QuickEntrySheet> createState() => _QuickEntrySheetState();
}

class _QuickEntrySheetState extends State<QuickEntrySheet> {
  int _entryMode = 0; // 0: Natural Language, 1: Manual

  // Natural Language state
  final _nlController = TextEditingController();
  bool _isParsing = false;
  Map<String, dynamic>? _parsedData;

  // Manual state
  final _amountController = TextEditingController();
  final _merchantController = TextEditingController();
  final _descController = TextEditingController();
  String _type = 'EXPENSE';
  String _category = 'Food & Dining';
  final DateTime _date = DateTime.now();
  bool _isSaving = false;

  final List<String> _categories = [
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Health & Medical',
    'Salary & Income',
    'General',
  ];

  @override
  void dispose() {
    _nlController.dispose();
    _amountController.dispose();
    _merchantController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleParseNL() async {
    final text = _nlController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isParsing = true);
    AppHaptics.medium();

    final result = await context.read<TransactionProvider>().parseNaturalLanguage(text);

    if (mounted) {
      setState(() {
        _isParsing = false;
        _parsedData = result;
        if (result != null) {
          if (result['amount'] != null) {
            _amountController.text = result['amount'].toString();
          }
          if (result['merchant'] != null) {
            _merchantController.text = result['merchant'].toString();
          }
          if (result['category'] != null && _categories.contains(result['category'])) {
            _category = result['category'].toString();
          }
        }
      });
      AppHaptics.success();
    }
  }

  Future<void> _handleSaveTransaction() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      AppHaptics.warning();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount.')),
      );
      return;
    }

    setState(() => _isSaving = true);
    AppHaptics.medium();

    final payload = {
      'amount': amount,
      'type': _type,
      'category_name': _category,
      'merchant_name': _merchantController.text.trim().isNotEmpty ? _merchantController.text.trim() : null,
      'description': _descController.text.trim().isNotEmpty ? _descController.text.trim() : null,
      'date': _date.toIso8601String().split('T').first,
    };

    final txProvider = context.read<TransactionProvider>();
    final success = await txProvider.addTransaction(payload);

    if (success && mounted) {
      context.read<DashboardProvider>().fetchDashboard();
      AppHaptics.success();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Transaction recorded successfully.'),
          backgroundColor: AppColors.income,
        ),
      );
    } else if (mounted) {
      setState(() => _isSaving = false);
      AppHaptics.warning();
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
      decoration: const BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Record Transaction',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (widget.onSwitchToReceiptScanner != null)
                  TextButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onSwitchToReceiptScanner!();
                    },
                    icon: const Icon(Icons.document_scanner_outlined, size: 16, color: AppColors.primaryLight),
                    label: const Text('Scan Receipt', style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
              ],
            ),
            const SizedBox(height: 14),

            // Mode Selector Tabs
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      AppHaptics.selection();
                      setState(() => _entryMode = 0);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _entryMode == 0 ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _entryMode == 0 ? AppColors.primary : AppColors.border),
                      ),
                      child: Center(
                        child: Text(
                          'Natural Language AI',
                          style: TextStyle(
                            color: _entryMode == 0 ? Colors.white : AppColors.textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      AppHaptics.selection();
                      setState(() => _entryMode = 1);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _entryMode == 1 ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _entryMode == 1 ? AppColors.primary : AppColors.border),
                      ),
                      child: Center(
                        child: Text(
                          'Manual Form',
                          style: TextStyle(
                            color: _entryMode == 1 ? Colors.white : AppColors.textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_entryMode == 0) ...[
              // Natural Language Input
              TextField(
                controller: _nlController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'e.g. Spent \$45 on sushi with Alex at Nobu',
                  prefixIcon: Icon(Icons.auto_awesome, color: AppColors.primaryLight, size: 20),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  onPressed: _isParsing ? null : _handleParseNL,
                  icon: _isParsing
                      ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.psychology, size: 18),
                  label: Text(_isParsing ? 'Parsing...' : 'Analyze & Extract'),
                ),
              ),
              if (_parsedData != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('PARSED TRANSACTION ENTITY', style: TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 6),
                      Text(
                        '${_merchantController.text.isNotEmpty ? _merchantController.text : "Merchant"} • ${Formatters.currency(double.tryParse(_amountController.text) ?? 0)}',
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
                      ),
                      Text('Category: $_category', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],

            // Standard Form Fields
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _type = 'EXPENSE'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _type == 'EXPENSE' ? AppColors.expenseBg : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _type == 'EXPENSE' ? AppColors.expense : AppColors.border),
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
                        color: _type == 'INCOME' ? AppColors.incomeBg : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _type == 'INCOME' ? AppColors.income : AppColors.border),
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
              ],
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixIcon: Icon(Icons.attach_money, size: 20),
              ),
            ),
            const SizedBox(height: 10),

            TextField(
              controller: _merchantController,
              decoration: const InputDecoration(
                labelText: 'Merchant / Payee',
                prefixIcon: Icon(Icons.storefront_outlined, size: 20),
              ),
            ),
            const SizedBox(height: 10),

            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(
                labelText: 'Category',
                prefixIcon: Icon(Icons.category_outlined, size: 20),
              ),
              dropdownColor: AppColors.surfaceElevated,
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _category = v ?? 'Food & Dining'),
            ),
            const SizedBox(height: 18),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _isSaving ? null : _handleSaveTransaction,
                child: _isSaving
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Record to Ledger', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
