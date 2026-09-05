class GoalModel {
  final String id;
  final String title;
  final double targetAmount;
  final double currentAmount;
  final String? targetDate;
  final double progressPercentage;
  final String status;
  final String? category;

  const GoalModel({
    required this.id,
    required this.title,
    required this.targetAmount,
    required this.currentAmount,
    this.targetDate,
    required this.progressPercentage,
    required this.status,
    this.category,
  });

  String get name => title;
  double get remainingAmount => (targetAmount - currentAmount).clamp(0.0, double.infinity);
  bool get isCompleted => currentAmount >= targetAmount;

  int? get daysRemaining {
    if (targetDate == null || targetDate!.isEmpty) return null;
    try {
      final dt = DateTime.parse(targetDate!);
      return dt.difference(DateTime.now()).inDays;
    } catch (_) {
      return null;
    }
  }

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    double parseNum(dynamic val) {
      if (val is num) return val.toDouble();
      if (val != null) return double.tryParse(val.toString()) ?? 0.0;
      return 0.0;
    }

    final target = parseNum(json['target_amount'] ?? json['target'] ?? 1.0);
    final current = parseNum(json['current_amount'] ?? json['current'] ?? 0.0);
    final progress = parseNum(json['progress_percentage'] ?? (target > 0 ? (current / target) * 100 : 0.0));

    return GoalModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['name']?.toString() ?? 'Savings Goal',
      targetAmount: target > 0 ? target : 1.0,
      currentAmount: current,
      targetDate: json['deadline']?.toString() ?? json['target_date']?.toString(),
      progressPercentage: progress.clamp(0.0, 100.0),
      status: json['status']?.toString() ?? (current >= target ? 'COMPLETED' : 'ACTIVE'),
      category: json['category']?.toString(),
    );
  }
}
