class HealthScoreModel {
  final int score;
  final String grade;
  final String status;
  final Map<String, dynamic> breakdown;

  HealthScoreModel({
    required this.score,
    required this.grade,
    required this.status,
    required this.breakdown,
  });

  factory HealthScoreModel.fromJson(Map<String, dynamic> json) {
    return HealthScoreModel(
      score: (json['score'] as num?)?.toInt() ?? 0,
      grade: json['grade'] ?? 'B',
      status: json['status'] ?? 'Good',
      breakdown: json['breakdown'] is Map<String, dynamic> ? json['breakdown'] : {},
    );
  }
}
