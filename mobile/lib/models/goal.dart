class GoalModel {
  final String id;
  final String title;
  final double targetAmount;
  final double currentAmount;
  final String? targetDate;
  final double progressPercentage;
  final String status;
  final String? category;

  GoalModel({
    required this.id,
    required this.title,
    required this.targetAmount,
    required this.currentAmount,
    this.targetDate,
    required this.progressPercentage,
    required this.status,
    this.category,
  });

  double get remainingAmount => (targetAmount - currentAmount).clamp(0.0, double.infinity);

  factory GoalModel.fromJson(Map<String, dynamic> json) {
    final target = (json['target_amount'] as num?)?.toDouble() ?? 1.0;
    final current = (json['current_amount'] as num?)?.toDouble() ?? 0.0;
    final progress = (json['progress_percentage'] as num?)?.toDouble() ?? (target > 0 ? (current / target) * 100 : 0.0);

    return GoalModel(
      id: json['id'].toString(),
      title: json['title'] ?? json['name'] ?? 'Savings Goal',
      targetAmount: target,
      currentAmount: current,
      targetDate: json['deadline'] ?? json['target_date'],
      progressPercentage: progress.clamp(0.0, 100.0),
      status: json['status'] ?? 'ACTIVE',
      category: json['category'],
    );
  }
}
