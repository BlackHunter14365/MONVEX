import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/search_result.dart';

class SearchProvider extends ChangeNotifier {
  List<SearchResultItem> _results = [];
  bool _isSearching = false;
  String _currentQuery = '';

  List<SearchResultItem> get results => _results;
  bool get isSearching => _isSearching;
  String get currentQuery => _currentQuery;

  Future<void> search(String query) async {
    final cleanQuery = query.trim();
    _currentQuery = cleanQuery;
    if (cleanQuery.isEmpty) {
      _results = [];
      _isSearching = false;
      notifyListeners();
      return;
    }

    _isSearching = true;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.search, queryParams: {'q': cleanQuery});
      if (res is Map<String, dynamic> && res['results'] is List) {
        _results = (res['results'] as List)
            .map((j) => SearchResultItem.fromJson(j))
            .toList();
      } else if (res is List) {
        _results = res.map((j) => SearchResultItem.fromJson(j)).toList();
      } else {
        _results = [];
      }
    } catch (_) {
      _results = [];
    } finally {
      _isSearching = false;
      notifyListeners();
    }
  }

  void clearSearch() {
    _results = [];
    _currentQuery = '';
    _isSearching = false;
    notifyListeners();
  }
}
