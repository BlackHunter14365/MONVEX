class Asset {
  final String id;
  final String name;
  final String assetType;
  final double value;
  final String institution;
  final String? notes;

  const Asset({
    required this.id,
    required this.name,
    required this.assetType,
    required this.value,
    this.institution = '',
    this.notes,
  });

  double get currentValue => value;
  String get category => assetType;

  factory Asset.fromJson(Map<String, dynamic> json) {
    return Asset(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Asset',
      assetType: json['asset_type']?.toString() ?? json['type']?.toString() ?? 'OTHER',
      value: (json['value'] as num?)?.toDouble() ??
          double.tryParse(json['value']?.toString() ?? '0.0') ??
          0.0,
      institution: json['institution']?.toString() ?? '',
      notes: json['notes']?.toString(),
    );
  }
}

class Liability {
  final String id;
  final String name;
  final String liabilityType;
  final double remainingBalance;
  final double monthlyEmi;
  final double interestRatePct;
  final String? lender;

  const Liability({
    required this.id,
    required this.name,
    required this.liabilityType,
    required this.remainingBalance,
    required this.monthlyEmi,
    required this.interestRatePct,
    this.lender,
  });

  double get currentBalance => remainingBalance;
  double get interestRate => interestRatePct;
  double get minimumPayment => monthlyEmi;

  factory Liability.fromJson(Map<String, dynamic> json) {
    return Liability(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Liability',
      liabilityType: json['liability_type']?.toString() ?? json['type']?.toString() ?? 'OTHER',
      remainingBalance: (json['remaining_balance'] as num?)?.toDouble() ??
          double.tryParse(json['remaining_balance']?.toString() ?? '0.0') ??
          0.0,
      monthlyEmi: (json['monthly_emi'] as num?)?.toDouble() ??
          double.tryParse(json['monthly_emi']?.toString() ?? '0.0') ??
          0.0,
      interestRatePct: (json['interest_rate_pct'] as num?)?.toDouble() ??
          double.tryParse(json['interest_rate_pct']?.toString() ?? '0.0') ??
          0.0,
      lender: json['lender']?.toString(),
    );
  }
}

class NetWorthSummary {
  final double totalAssets;
  final double totalLiabilities;
  final double netWorth;
  final double liquidCapital;

  const NetWorthSummary({
    required this.totalAssets,
    required this.totalLiabilities,
    required this.netWorth,
    required this.liquidCapital,
  });

  factory NetWorthSummary.fromJson(Map<String, dynamic> json) {
    return NetWorthSummary(
      totalAssets: (json['total_assets'] as num?)?.toDouble() ??
          double.tryParse(json['total_assets']?.toString() ?? '0.0') ?? 0.0,
      totalLiabilities: (json['total_liabilities'] as num?)?.toDouble() ??
          double.tryParse(json['total_liabilities']?.toString() ?? '0.0') ?? 0.0,
      netWorth: (json['net_worth'] as num?)?.toDouble() ??
          double.tryParse(json['net_worth']?.toString() ?? '0.0') ?? 0.0,
      liquidCapital: (json['liquid_assets'] as num?)?.toDouble() ??
          double.tryParse(json['liquid_assets']?.toString() ?? '0.0') ?? 0.0,
    );
  }
}
