import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../core/utils/haptics.dart';
import '../../providers/auth_provider.dart';

import '../../models/user_profile.dart';

class EditProfileSheet extends StatefulWidget {
  final UserProfile? user;
  const EditProfileSheet({super.key, this.user});

  @override
  State<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<EditProfileSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _usernameController;
  late TextEditingController _phoneController;
  late TextEditingController _incomeController;
  String _currency = 'INR';
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final user = widget.user ?? context.read<AuthProvider>().user;
    _firstNameController = TextEditingController(text: user?.firstName ?? '');
    _lastNameController = TextEditingController(text: user?.lastName ?? '');
    _usernameController = TextEditingController(text: user?.username ?? '');
    _phoneController = TextEditingController(text: user?.phoneNumber ?? '');
    _incomeController = TextEditingController(
      text: user?.monthlyIncome != null && user!.monthlyIncome > 0
          ? user.monthlyIncome.toStringAsFixed(0)
          : '',
    );
    _currency = user?.currency ?? 'INR';
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _phoneController.dispose();
    _incomeController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    AppHaptics.medium();

    final auth = context.read<AuthProvider>();
    final parsedIncome = double.tryParse(_incomeController.text.trim()) ?? 0.0;

    final updatePayload = <String, dynamic>{
      'first_name': _firstNameController.text.trim(),
      'last_name': _lastNameController.text.trim(),
      'username': _usernameController.text.trim(),
      'phone_number': _phoneController.text.trim(),
      'monthly_income': parsedIncome,
      'currency': _currency,
    };

    final success = await auth.updateProfile(updatePayload);

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        AppHaptics.success();
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: AppColors.income,
          ),
        );
      } else {
        AppHaptics.warning();
        setState(() {
          _errorMessage = auth.errorMessage ?? 'Could not save profile changes.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Edit Profile',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.textMuted, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: AppColors.expenseBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.expense.withOpacity(0.3)),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: AppColors.expense, fontSize: 12),
                  ),
                ),
              ],
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameController,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                      decoration: const InputDecoration(labelText: 'First Name'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameController,
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                      decoration: const InputDecoration(labelText: 'Last Name'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _usernameController,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Username',
                  prefixIcon: Icon(Icons.alternate_email, size: 18, color: AppColors.textMuted),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Username required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+91 9876543210',
                  prefixIcon: Icon(Icons.phone_outlined, size: 18, color: AppColors.textMuted),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _incomeController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                decoration: const InputDecoration(
                  labelText: 'Monthly Income (₹)',
                  hintText: 'e.g. 75000',
                  prefixIcon: Icon(Icons.currency_rupee, size: 18, color: AppColors.textMuted),
                ),
                validator: (val) {
                  if (val != null && val.isNotEmpty) {
                    final num = double.tryParse(val);
                    if (num == null || num < 0) return 'Enter a valid positive amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isSaving ? null : _handleSave,
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
