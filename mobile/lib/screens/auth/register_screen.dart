import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Step 1 Controllers
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _incomeController = TextEditingController(text: '75000');
  final String _currency = 'INR';

  // Step 2 OTP State
  bool _isOtpStep = false;
  String _verificationId = '';
  final _otpController = TextEditingController();
  int _cooldownSeconds = 60;
  Timer? _cooldownTimer;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _incomeController.dispose();
    _otpController.dispose();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  void _startCooldown() {
    setState(() => _cooldownSeconds = 60);
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds <= 1) {
        timer.cancel();
        setState(() => _cooldownSeconds = 0);
      } else {
        setState(() => _cooldownSeconds--);
      }
    });
  }

  Future<void> _handleRegister() async {
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final income = double.tryParse(_incomeController.text) ?? 75000.0;

    if (username.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields.')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    final res = await auth.register({
      'username': username,
      'email': email,
      'password': password,
      'monthly_income': income,
      'currency': _currency,
    });

    if (res != null) {
      if (res['verification_id'] != null) {
        setState(() {
          _isOtpStep = true;
          _verificationId = res['verification_id'];
        });
        _startCooldown();
      } else if (res['access'] != null) {
        // Verification disabled mode - direct login
        if (mounted) Navigator.pop(context);
      }
    } else if (mounted && auth.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage!), backgroundColor: AppColors.expense),
      );
    }
  }

  Future<void> _handleVerifyOtp() async {
    final code = _otpController.text.trim();
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a 6-digit OTP.')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    final success = await auth.verifyOtp(_verificationId, code);

    if (success && mounted) {
      Navigator.pop(context);
    } else if (mounted && auth.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage!), backgroundColor: AppColors.expense),
      );
    }
  }

  Future<void> _handleResendOtp() async {
    if (_cooldownSeconds > 0) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.resendOtp(_verificationId);
    if (success) {
      _startCooldown();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('New OTP sent to your email.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isOtpStep ? 'Verify Email' : 'Create MONVEX Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: _isOtpStep ? _buildOtpStep(auth) : _buildRegistrationStep(auth),
        ),
      ),
    );
  }

  Widget _buildRegistrationStep(AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Start your financial sovereignty journey.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 24),

        TextField(
          controller: _usernameController,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: const InputDecoration(
            labelText: 'Username',
            prefixIcon: Icon(Icons.person_outline, size: 20, color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: const InputDecoration(
            labelText: 'Email Address',
            prefixIcon: Icon(Icons.email_outlined, size: 20, color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _passwordController,
          obscureText: true,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: const InputDecoration(
            labelText: 'Password',
            prefixIcon: Icon(Icons.lock_outline, size: 20, color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 14),

        TextField(
          controller: _incomeController,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          decoration: const InputDecoration(
            labelText: 'Monthly Income (₹)',
            prefixIcon: Icon(Icons.currency_rupee, size: 20, color: AppColors.textMuted),
          ),
        ),
        const SizedBox(height: 28),

        ElevatedButton(
          onPressed: auth.isLoading ? null : _handleRegister,
          child: auth.isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Continue to Verification'),
        ),
      ],
    );
  }

  Widget _buildOtpStep(AuthProvider auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.mark_email_read_outlined, size: 48, color: AppColors.primaryLight),
        const SizedBox(height: 16),
        const Text(
          'Enter 6-Digit Code',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'We sent a verification code to ${_emailController.text}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
        ),
        const SizedBox(height: 32),

        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 24,
            fontWeight: FontWeight.w800,
            letterSpacing: 8,
          ),
          decoration: const InputDecoration(
            hintText: '000000',
            counterText: '',
          ),
        ),
        const SizedBox(height: 24),

        ElevatedButton(
          onPressed: auth.isLoading ? null : _handleVerifyOtp,
          child: auth.isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Verify & Activate Account'),
        ),
        const SizedBox(height: 20),

        Center(
          child: TextButton(
            onPressed: _cooldownSeconds == 0 ? _handleResendOtp : null,
            child: Text(
              _cooldownSeconds > 0
                  ? 'Resend OTP in ${_cooldownSeconds}s'
                  : 'Resend OTP Code',
              style: TextStyle(
                color: _cooldownSeconds > 0 ? AppColors.textMuted : AppColors.primaryLight,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
