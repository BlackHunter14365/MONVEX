import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/transaction.dart';
import '../models/health_score.dart';

class DashboardProvider extends ChangeNotifier {
  Map<String, dynamic>? _rawMetrics;
  HealthScoreModel? _healthScore;
  List<TransactionModel> _recentTransactions = [];
  bool _isLoading = false;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get rawMetrics => _rawMetrics;
  HealthScoreModel? get healthScore => _healthScore;
  List<TransactionModel> get recentTransactions => _recentTransactions;

  double get monthlyIncome => (_rawMetrics?['monthly_income'] as num?)?.toDouble() ?? 0.0;
  double get monthlyExpense => (_rawMetrics?['monthly_expense'] as num?)?.toDouble() ?? 0.0;
  double get netWorth => (_rawMetrics?['net_worth'] as num?)?.toDouble() ?? (monthlyIncome - monthlyExpense);
  double get cashFlow => (_rawMetrics?['net_balance'] as num?)?.toDouble() ?? (monthlyIncome - monthlyExpense);

  Future<void> fetchDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.dashboard);
      if (res is Map<String, dynamic>) {
        _rawMetrics = res;

        if (res['health_score'] is Map<String, dynamic>) {
          _healthScore = HealthScoreModel.fromJson(res['health_score']);
        }

        if (res['recent_transactions'] is List) {
          _recentTransactions = (res['recent_transactions'] as List)
              .map((j) => TransactionModel.fromJson(j))
              .toList();
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
