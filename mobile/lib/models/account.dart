class AccountModel {
  final String id;
  final String name;
  final String type;
  final String institution;
  final double balance;
  final String currency;
  final String? mask;
  final bool isActive;

  const AccountModel({
    required this.id,
    required this.name,
    required this.type,
    required this.institution,
    required this.balance,
    required this.currency,
    this.mask,
    this.isActive = true,
  });

  factory AccountModel.fromJson(Map<String, dynamic> json) {
    double parseBalance(dynamic val) {
      if (val is num) return val.toDouble();
      if (val != null) return double.tryParse(val.toString()) ?? 0.0;
      return 0.0;
    }

    return AccountModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['institution']?.toString() ?? 'Account',
      type: json['type']?.toString().toUpperCase() ?? 'CHECKING',
      institution: json['institution']?.toString() ?? 'General',
      balance: parseBalance(json['balance'] ?? json['value'] ?? json['current_balance']),
      currency: json['currency']?.toString() ?? 'INR',
      mask: json['mask']?.toString() ?? json['account_number_mask']?.toString(),
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
