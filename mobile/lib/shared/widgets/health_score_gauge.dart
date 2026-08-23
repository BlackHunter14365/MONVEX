import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';

class HealthScoreGauge extends StatelessWidget {
  final int score;
  final String grade;
  final double size;

  const HealthScoreGauge({
    super.key,
    required this.score,
    required this.grade,
    this.size = 80,
  });

  Color get scoreColor {
    if (score >= 80) return AppColors.income;
    if (score >= 60) return AppColors.warning;
    return AppColors.expense;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: size,
      width: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            height: size,
            width: size,
            child: CircularProgressIndicator(
              value: (score / 100.0).clamp(0.0, 1.0),
              backgroundColor: Colors.white.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
              strokeWidth: 7,
              strokeCap: StrokeCap.round,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$score',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              Text(
                grade,
                style: TextStyle(
                  color: scoreColor,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
