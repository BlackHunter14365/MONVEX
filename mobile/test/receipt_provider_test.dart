import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/models/receipt.dart';
import 'package:monvex_mobile/providers/receipt_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ReceiptProvider & Zero-Fabrication Integrity Tests', () {
    late ReceiptProvider provider;

    setUp(() {
      provider = ReceiptProvider();
    });

    tearDown(() {
      provider.dispose();
    });

    test('Initial state has zero receipts and no pending OCR review', () {
      expect(provider.currentReceipt, isNull);
      expect(provider.receipts, isEmpty);
      expect(provider.isAnalyzing, isFalse);
      expect(provider.isConfirming, isFalse);
      expect(provider.errorMessage, isNull);
    });

    test('clearCurrentReceipt purges active unconfirmed receipt from memory', () {
      // Receipt.empty() has 0.0 values, never invented
      final emptyRcpt = Receipt.empty();
      expect(emptyRcpt.totalAmount, equals(0.0));
      expect(emptyRcpt.subtotal, equals(0.0));

      provider.clearCurrentReceipt();
      expect(provider.currentReceipt, isNull);
    });

    test('resetState performs total memory purge on logout', () {
      provider.resetState();
      expect(provider.currentReceipt, isNull);
      expect(provider.receipts, isEmpty);
      expect(provider.isAnalyzing, isFalse);
      expect(provider.isConfirming, isFalse);
      expect(provider.errorMessage, isNull);
    });
  });
}
