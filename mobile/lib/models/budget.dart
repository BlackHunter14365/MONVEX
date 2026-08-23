class BudgetModel {
  final String id;
  final String categoryName;
  final String categoryColor;
  final double limitAmount;
  final double spentAmount;
  final String status;
  final double usagePercentage;
  final double remainingAmount;

  BudgetModel({
    required this.id,
    required this.categoryName,
    required this.categoryColor,
    required this.limitAmount,
    required this.spentAmount,
    required this.status,
    required this.usagePercentage,
    required this.remainingAmount,
  });

  bool get isExceeded => status == 'EXCEEDED' || usagePercentage >= 100.0;
  bool get isWarning => status == 'WARNING' || (usagePercentage >= 80.0 && usagePercentage < 100.0);

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    final limit = (json['amount'] ?? json['limit_amount'] as num?)?.toDouble() ?? 0.0;
    final spent = (json['spent_amount'] ?? json['current_spent'] as num?)?.toDouble() ?? 0.0;
    final remaining = (json['remaining_amount'] as num?)?.toDouble() ?? (limit - spent);
    final usage = (json['usage_percentage'] as num?)?.toDouble() ?? (limit > 0 ? (spent / limit) * 100 : 0.0);

    return BudgetModel(
      id: json['id'].toString(),
      categoryName: json['category_name'] ?? json['category']?['name'] ?? 'Category',
      categoryColor: json['category_color'] ?? json['category']?['color'] ?? '#6366F1',
      limitAmount: limit,
      spentAmount: spent,
      status: json['status'] ?? (usage >= 100 ? 'EXCEEDED' : (usage >= 80 ? 'WARNING' : 'HEALTHY')),
      usagePercentage: usage,
      remainingAmount: remaining,
    );
  }
}
