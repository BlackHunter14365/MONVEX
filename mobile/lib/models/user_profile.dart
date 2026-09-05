class UserProfile {
  final String id;
  final String username;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phoneNumber;
  final String currency;
  final double monthlyIncome;
  final bool isVerified;
  final bool hasGoogleAuth;
  final bool hasPasswordAuth;

  const UserProfile({
    required this.id,
    required this.username,
    required this.email,
    this.firstName,
    this.lastName,
    this.phoneNumber,
    this.currency = 'INR',
    this.monthlyIncome = 0.0,
    this.isVerified = false,
    this.hasGoogleAuth = false,
    this.hasPasswordAuth = true,
  });

  String get displayName {
    final full = '${firstName ?? ''} ${lastName ?? ''}'.trim();
    if (full.isNotEmpty) return full;
    return username;
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    // Check if profile is nested
    final profile = json['profile'] is Map ? json['profile'] as Map<String, dynamic> : null;

    double parseIncome(dynamic val) {
      if (val is num) return val.toDouble();
      if (val != null) return double.tryParse(val.toString()) ?? 0.0;
      return 0.0;
    }

    return UserProfile(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      firstName: json['first_name']?.toString() ?? profile?['first_name']?.toString(),
      lastName: json['last_name']?.toString() ?? profile?['last_name']?.toString(),
      phoneNumber: json['phone_number']?.toString() ?? profile?['phone_number']?.toString(),
      currency: json['currency']?.toString() ?? profile?['currency']?.toString() ?? 'INR',
      monthlyIncome: parseIncome(json['monthly_income'] ?? profile?['monthly_income']),
      isVerified: (json['is_verified'] ?? profile?['is_verified']) as bool? ?? false,
      hasGoogleAuth: (json['has_google_auth'] ?? profile?['has_google_auth']) as bool? ?? false,
      hasPasswordAuth: (json['has_password_auth'] ?? profile?['has_password_auth']) as bool? ?? true,
    );
  }
}
