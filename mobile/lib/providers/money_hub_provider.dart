import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/account.dart';
import '../models/asset_liability.dart';
import '../models/subscription.dart';
import 'auth_provider.dart';

class MoneyHubProvider extends ChangeNotifier {
  List<AccountModel> _accounts = [];
  List<Asset> _assets = [];
  List<Liability> _liabilities = [];
  List<Subscription> _subscriptions = [];
  NetWorthSummary? _netWorthSummary;

  bool _isLoading = false;
  String? _errorMessage;
  int _selectedTab = 0; // 0: Transactions, 1: Accounts, 2: Assets, 3: Liabilities, 4: Subscriptions

  List<AccountModel> get accounts => _accounts;
  List<Asset> get assets => _assets;
  List<Liability> get liabilities => _liabilities;
  List<Subscription> get subscriptions => _subscriptions;
  NetWorthSummary? get netWorthSummary => _netWorthSummary;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get selectedTab => _selectedTab;

  void setSelectedTab(int index) {
    _selectedTab = index;
    notifyListeners();
  }

  MoneyHubProvider() {
    AuthProvider.registerLogoutCallback(resetState);
  }

  @override
  void dispose() {
    AuthProvider.unregisterLogoutCallback(resetState);
    super.dispose();
  }

  void resetState() {
    _accounts = [];
    _assets = [];
    _liabilities = [];
    _subscriptions = [];
    _netWorthSummary = null;
    _isLoading = false;
    _errorMessage = null;
    _selectedTab = 0;
    notifyListeners();
  }

  double get totalLiquidBalance {
    return _accounts.fold(0.0, (sum, a) => sum + a.balance);
  }

  double get totalAssetValue {
    return _assets.fold(0.0, (sum, a) => sum + a.currentValue);
  }

  double get totalLiabilityBalance {
    return _liabilities.fold(0.0, (sum, l) => sum + l.currentBalance);
  }

  double get computedNetWorth {
    return totalLiquidBalance + totalAssetValue - totalLiabilityBalance;
  }

  double get totalMonthlySubscriptions {
    return _subscriptions.where((s) => s.isActive).fold(0.0, (sum, s) => sum + s.monthlyCost);
  }

  Future<void> fetchAll() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await Future.wait([
        fetchAccounts(notify: false),
        fetchAssets(notify: false),
        fetchLiabilities(notify: false),
        fetchSubscriptions(notify: false),
        fetchNetWorth(notify: false),
      ]);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAccounts({bool notify = true}) async {
    try {
      final res = await ApiClient.get(ApiEndpoints.accounts);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _accounts = rawList.map((j) => AccountModel.fromJson(j)).toList();
      if (notify) notifyListeners();
    } catch (e) {
      debugPrint('[MoneyHubProvider] fetchAccounts error: $e');
    }
  }

  Future<void> fetchAssets({bool notify = true}) async {
    try {
      final res = await ApiClient.get(ApiEndpoints.assets);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _assets = rawList.map((j) => Asset.fromJson(j)).toList();
      if (notify) notifyListeners();
    } catch (e) {
      debugPrint('[MoneyHubProvider] fetchAssets error: $e');
    }
  }

  Future<void> fetchLiabilities({bool notify = true}) async {
    try {
      final res = await ApiClient.get(ApiEndpoints.liabilities);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _liabilities = rawList.map((j) => Liability.fromJson(j)).toList();
      if (notify) notifyListeners();
    } catch (e) {
      debugPrint('[MoneyHubProvider] fetchLiabilities error: $e');
    }
  }

  Future<void> fetchSubscriptions({bool notify = true}) async {
    try {
      final res = await ApiClient.get(ApiEndpoints.subscriptions);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _subscriptions = rawList.map((j) => Subscription.fromJson(j)).toList();
      if (notify) notifyListeners();
    } catch (e) {
      debugPrint('[MoneyHubProvider] fetchSubscriptions error: $e');
    }
  }

  Future<void> fetchNetWorth({bool notify = true}) async {
    try {
      final res = await ApiClient.get(ApiEndpoints.netWorth);
      if (res is Map<String, dynamic>) {
        _netWorthSummary = NetWorthSummary.fromJson(res);
      }
      if (notify) notifyListeners();
    } catch (e) {
      debugPrint('[MoneyHubProvider] fetchNetWorth error: $e');
    }
  }

  Future<bool> addAccount(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.accounts, payload);
      if (res is Map<String, dynamic>) {
        _accounts.add(AccountModel.fromJson(res));
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

  Future<bool> addAsset(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.assets, payload);
      if (res is Map<String, dynamic>) {
        _assets.add(Asset.fromJson(res));
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

  Future<bool> addLiability(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.liabilities, payload);
      if (res is Map<String, dynamic>) {
        _liabilities.add(Liability.fromJson(res));
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

  Future<bool> addSubscription(Map<String, dynamic> payload) async {
    try {
      final res = await ApiClient.post(ApiEndpoints.subscriptions, payload);
      if (res is Map<String, dynamic>) {
        _subscriptions.add(Subscription.fromJson(res));
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

  Future<bool> deleteAsset(String id) async {
    try {
      await ApiClient.delete('${ApiEndpoints.assets}$id/');
      _assets.removeWhere((a) => a.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteLiability(String id) async {
    try {
      await ApiClient.delete('${ApiEndpoints.liabilities}$id/');
      _liabilities.removeWhere((l) => l.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteSubscription(String id) async {
    try {
      await ApiClient.delete('${ApiEndpoints.subscriptions}$id/');
      _subscriptions.removeWhere((s) => s.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
