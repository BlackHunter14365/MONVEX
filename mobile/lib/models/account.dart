class AccountModel {
  final String id;
  final String name;
  final String type;
  final String institution;
  final double balance;
  final String currency;
  final String? mask;
  final bool isActive;

  AccountModel({
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
    return AccountModel(
      id: json['id'].toString(),
      name: json['name'] ?? json['institution'] ?? 'Account',
      type: json['type'] ?? 'CHECKING',
      institution: json['institution'] ?? 'General',
      balance: (json['balance'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'INR',
      mask: json['mask'] ?? json['account_number_mask'],
      isActive: json['is_active'] ?? true,
    );
  }
}
