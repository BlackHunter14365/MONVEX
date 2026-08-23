import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/transaction.dart';

class TransactionProvider extends ChangeNotifier {
  List<TransactionModel> _transactions = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _filterType = 'ALL'; // 'ALL' | 'EXPENSE' | 'INCOME'
  String _searchQuery = '';

  List<TransactionModel> get transactions {
    return _transactions.filter((tx) {
      if (_filterType != 'ALL' && tx.type != _filterType) return false;
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final m = (tx.merchantName ?? '').toLowerCase();
        final d = (tx.description ?? '').toLowerCase();
        final c = tx.categoryName.toLowerCase();
        return m.contains(q) || d.contains(q) || c.contains(q);
      }
      return true;
    }).toList();
  }

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get filterType => _filterType;
  String get searchQuery => _searchQuery;

  void setFilterType(String type) {
    _filterType = type;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> fetchTransactions() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.transactions);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _transactions = rawList.map((j) => TransactionModel.fromJson(j)).toList();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addTransaction(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.transactions, payload);
      if (res is Map<String, dynamic>) {
        final newTx = TransactionModel.fromJson(res);
        _transactions.insert(0, newTx);
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

  Future<bool> deleteTransaction(String id) async {
    try {
      await ApiClient.delete('${ApiEndpoints.transactions}$id/');
      _transactions.removeWhere((tx) => tx.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}

extension FilterList<E> on List<E> {
  Iterable<E> filter(bool Function(E element) test) sync* {
    for (E element in this) {
      if (test(element)) yield element;
    }
  }
}
