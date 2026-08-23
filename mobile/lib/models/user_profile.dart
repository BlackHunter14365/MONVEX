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

  UserProfile({
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
    return UserProfile(
      id: json['id']?.toString() ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'],
      lastName: json['last_name'],
      phoneNumber: json['phone_number'],
      currency: json['currency'] ?? 'INR',
      monthlyIncome: (json['monthly_income'] as num?)?.toDouble() ?? 0.0,
      isVerified: json['is_verified'] ?? false,
      hasGoogleAuth: json['has_google_auth'] ?? false,
      hasPasswordAuth: json['has_password_auth'] ?? true,
    );
  }
}
