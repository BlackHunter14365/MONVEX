import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/budget.dart';

class BudgetProvider extends ChangeNotifier {
  List<BudgetModel> _budgets = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<BudgetModel> get budgets => _budgets;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchBudgets() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.budgets);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _budgets = rawList.map((j) => BudgetModel.fromJson(j)).toList();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createBudget(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.budgets, payload);
      if (res is Map<String, dynamic>) {
        final b = BudgetModel.fromJson(res);
        _budgets.add(b);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
