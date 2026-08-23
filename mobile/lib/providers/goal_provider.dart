import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/goal.dart';

class GoalProvider extends ChangeNotifier {
  List<GoalModel> _goals = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<GoalModel> get goals => _goals;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchGoals() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.goals);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _goals = rawList.map((j) => GoalModel.fromJson(j)).toList();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createGoal(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.goals, payload);
      if (res is Map<String, dynamic>) {
        final g = GoalModel.fromJson(res);
        _goals.add(g);
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
