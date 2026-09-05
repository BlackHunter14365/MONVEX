import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/models/receipt.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Receipt OCR Defensive Pipeline Tests', () {
    test('Receipt correctly preserves PENDING_REVIEW state without mutations', () {
      final json = {
        'id': 'rcpt_pending_01',
        'status': 'PENDING_REVIEW',
        'raw_text': 'Star Bazaar\nApples 120\nTotal: 120',
        'total_amount': 120.0,
        'merchant_name': 'Star Bazaar',
        'predicted_category': 'Groceries',
        'confidence_score': 0.94,
        'items': [
          {'name': 'Apples', 'price': 120.0, 'quantity': 1}
        ]
      };

      final receipt = Receipt.fromJson(json);
      expect(receipt.id, equals('rcpt_pending_01'));
      expect(receipt.status, equals('PENDING_REVIEW'));
      expect(receipt.totalAmount, equals(120.0));
      expect(receipt.merchantName, equals('Star Bazaar'));
      expect(receipt.confidenceScore, equals(0.94));
      expect(receipt.items.length, equals(1));
    });

    test('Receipt handles OCR failure / unparsed payload safely with OCR_FAILED status', () {
      final json = {
        'id': 'rcpt_failed_02',
        'status': 'OCR_FAILED',
        'raw_text': '',
        'total_amount': null,
        'merchant_name': null,
        'predicted_category': null,
        'confidence_score': 0.0,
        'items': []
      };

      final receipt = Receipt.fromJson(json);
      expect(receipt.id, equals('rcpt_failed_02'));
      expect(receipt.status, equals('OCR_FAILED'));
      expect(receipt.totalAmount, equals(0.0));
      expect(receipt.merchant, equals('Unknown Vendor'));
      expect(receipt.category, equals('Groceries'));
      expect(receipt.items.isEmpty, isTrue);
    });

    test('Receipt fallback never invents financial figures for missing prices or subtotals', () {
      final json = {
        'id': 'rcpt_no_numbers',
        'status': 'PENDING_REVIEW',
        'merchant_name': 'Corner Bakery',
      };

      final receipt = Receipt.fromJson(json);
      expect(receipt.totalAmount, equals(0.0));
      expect(receipt.subtotal, equals(0.0));
      expect(receipt.taxAmount, equals(0.0));
    });

    test('Receipt line item parses string prices safely', () {
      final itemJson = {
        'name': 'Espresso Single',
        'price': '180.50',
        'quantity': '2',
      };

      final item = ReceiptItem.fromJson(itemJson);
      expect(item.name, equals('Espresso Single'));
      expect(item.price, equals(180.50));
      expect(item.qty, equals(2));
    });

    test('Receipt line item with completely null fields does not crash', () {
      final item = ReceiptItem.fromJson({});
      expect(item.name, equals('Item'));
      expect(item.price, equals(0.0));
      expect(item.qty, equals(1));
    });
  });
}
