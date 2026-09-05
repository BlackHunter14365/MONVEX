class Subscription {
  final String id;
  final String name;
  final double amount;
  final String billingCycle; // MONTHLY, YEARLY, QUARTERLY
  final String nextDueDate;
  final String categoryName;
  final bool isActive;

  const Subscription({
    required this.id,
    required this.name,
    required this.amount,
    required this.billingCycle,
    required this.nextDueDate,
    required this.categoryName,
    required this.isActive,
  });

  String get nextRenewalDate => nextDueDate;
  double get monthlyCost {
    final cycle = billingCycle.toUpperCase();
    if (cycle == 'YEARLY' || cycle == 'ANNUAL') return amount / 12;
    if (cycle == 'QUARTERLY') return amount / 3;
    if (cycle == 'WEEKLY') return amount * 4.33;
    return amount;
  }

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['merchant_name']?.toString() ?? 'Subscription',
      amount: (json['amount'] as num?)?.toDouble() ??
          double.tryParse(json['amount']?.toString() ?? '0.0') ??
          0.0,
      billingCycle: json['billing_cycle']?.toString() ?? json['frequency']?.toString() ?? 'MONTHLY',
      nextDueDate: json['next_due_date']?.toString() ?? json['next_payment_date']?.toString() ?? '',
      categoryName: json['category_name']?.toString() ?? 'Utilities & Bills',
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
