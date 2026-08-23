import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/account.dart';

class AccountProvider extends ChangeNotifier {
  List<AccountModel> _accounts = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<AccountModel> get accounts => _accounts;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  double get totalLiquidBalance {
    return _accounts.fold(0.0, (sum, acc) => sum + acc.balance);
  }

  Future<void> fetchAccounts() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.accounts);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _accounts = rawList.map((j) => AccountModel.fromJson(j)).toList();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addAccount(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.accounts, payload);
      if (res is Map<String, dynamic>) {
        final newAcc = AccountModel.fromJson(res);
        _accounts.add(newAcc);
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

  Future<bool> deleteAccount(String id) async {
    try {
      await ApiClient.delete('${ApiEndpoints.accounts}$id/');
      _accounts.removeWhere((a) => a.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
