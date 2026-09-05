import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/receipt.dart';
import 'auth_provider.dart';

class ReceiptProvider extends ChangeNotifier {
  Receipt? _currentReceipt;
  List<Receipt> _receipts = [];
  bool _isAnalyzing = false;
  bool _isConfirming = false;
  bool _isLoadingList = false;
  String? _errorMessage;

  Receipt? get currentReceipt => _currentReceipt;
  List<Receipt> get receipts => _receipts;
  bool get isAnalyzing => _isAnalyzing;
  bool get isConfirming => _isConfirming;
  bool get isLoadingList => _isLoadingList;
  String? get errorMessage => _errorMessage;

  ReceiptProvider() {
    AuthProvider.registerLogoutCallback(resetState);
  }

  @override
  void dispose() {
    AuthProvider.unregisterLogoutCallback(resetState);
    super.dispose();
  }

  void resetState() {
    _currentReceipt = null;
    _receipts = [];
    _isAnalyzing = false;
    _isConfirming = false;
    _isLoadingList = false;
    _errorMessage = null;
    notifyListeners();
  }

  void clearCurrentReceipt() {
    _currentReceipt = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<Receipt?> uploadReceiptBytes({
    required List<int> bytes,
    required String filename,
  }) async {
    _isAnalyzing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.uploadFile(
        ApiEndpoints.receiptUpload,
        fieldName: 'receipt',
        fileBytes: bytes,
        filename: filename,
      );

      if (res is Map<String, dynamic>) {
        // Backend returns either { "receipt": { ... } } or the receipt object directly
        final receiptJson = res.containsKey('receipt') && res['receipt'] is Map<String, dynamic>
            ? res['receipt'] as Map<String, dynamic>
            : res;

        _currentReceipt = Receipt.fromJson(receiptJson);
        _isAnalyzing = false;
        notifyListeners();
        return _currentReceipt;
      } else {
        throw ApiException('Unexpected server response format during receipt OCR.');
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isAnalyzing = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> confirmReceipt({
    required String receiptId,
    required String merchant,
    required double totalAmount,
    required String date,
    required String category,
    String? accountId,
  }) async {
    _isConfirming = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = <String, dynamic>{
        'receipt_id': receiptId,
        'merchant': merchant.trim(),
        'total_amount': totalAmount,
        'date': date,
        'category': category,
      };
      if (accountId != null && accountId.isNotEmpty) {
        payload['account_id'] = accountId;
      }

      final res = await ApiClient.post(ApiEndpoints.receiptConfirm(receiptId), payload);
      if (res is Map<String, dynamic> && (res['success'] == true || res['id'] != null || res['transaction'] != null)) {
        _currentReceipt = null;
        _isConfirming = false;
        notifyListeners();
        // Refresh past receipts list in background
        fetchReceipts();
        return true;
      } else {
        throw ApiException('Failed to confirm receipt transaction.');
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isConfirming = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchReceipts() async {
    _isLoadingList = true;
    notifyListeners();

    try {
      final res = await ApiClient.get(ApiEndpoints.receipts);
      final List rawList = res is List ? res : (res['results'] is List ? res['results'] : []);
      _receipts = rawList.map((j) => Receipt.fromJson(j)).toList();
    } catch (e) {
      debugPrint('[ReceiptProvider] fetchReceipts error: $e');
    } finally {
      _isLoadingList = false;
      notifyListeners();
    }
  }
}
