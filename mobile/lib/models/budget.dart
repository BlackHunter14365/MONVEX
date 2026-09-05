class BudgetModel {
  final String id;
  final String categoryName;
  final String categoryColor;
  final double limitAmount;
  final double spentAmount;
  final String status;
  final double usagePercentage;
  final double remainingAmount;
  final String month;

  const BudgetModel({
    required this.id,
    required this.categoryName,
    required this.categoryColor,
    required this.limitAmount,
    required this.spentAmount,
    required this.status,
    required this.usagePercentage,
    required this.remainingAmount,
    this.month = '',
  });

  double get amount => limitAmount;
  double get spent => spentAmount;

  bool get isExceeded => status == 'EXCEEDED' || usagePercentage >= 100.0;
  bool get isWarning => status == 'WARNING' || (usagePercentage >= 80.0 && usagePercentage < 100.0);
  bool get isHealthy => !isExceeded && !isWarning;

  /// Pace comparison: spending percentage vs day of month elapsed percentage
  String get paceInsight {
    if (limitAmount <= 0) return 'No limit configured';
    final now = DateTime.now();
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final dayProgressPct = (now.day / daysInMonth) * 100.0;
    final diff = usagePercentage - dayProgressPct;

    if (isExceeded) {
      return 'Budget limit exceeded by ${(usagePercentage - 100).toStringAsFixed(1)}%';
    } else if (diff > 15) {
      return 'Spending ${diff.toStringAsFixed(0)}% faster than monthly pace';
    } else if (diff < -15) {
      return 'Under budget pace by ${(-diff).toStringAsFixed(0)}%';
    } else {
      return 'On track with monthly timeline';
    }
  }

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    double parseNum(dynamic val) {
      if (val is num) return val.toDouble();
      if (val != null) return double.tryParse(val.toString()) ?? 0.0;
      return 0.0;
    }

    final limit = parseNum(json['amount'] ?? json['limit_amount'] ?? json['limit']);
    final spent = parseNum(json['spent_amount'] ?? json['current_spent'] ?? json['spent']);
    final remaining = parseNum(json['remaining_amount'] ?? (limit - spent));
    final usage = limit > 0 ? (spent / limit) * 100 : 0.0;

    String catName = 'Category';
    String catColor = '#4056A1';
    if (json['category_name'] != null) {
      catName = json['category_name'].toString();
    } else if (json['category'] is Map) {
      catName = json['category']['name']?.toString() ?? 'Category';
      catColor = json['category']['color']?.toString() ?? '#4056A1';
    }

    if (json['category_color'] != null) {
      catColor = json['category_color'].toString();
    }

    return BudgetModel(
      id: json['id']?.toString() ?? '',
      categoryName: catName,
      categoryColor: catColor,
      limitAmount: limit,
      spentAmount: spent,
      status: json['status']?.toString() ?? (usage >= 100 ? 'EXCEEDED' : (usage >= 80 ? 'WARNING' : 'HEALTHY')),
      usagePercentage: usage,
      remainingAmount: remaining,
      month: json['month']?.toString() ?? '',
    );
  }
}
