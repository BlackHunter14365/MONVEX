import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/models/receipt.dart';
import 'package:monvex_mobile/models/transaction.dart';
import 'package:monvex_mobile/models/budget.dart';
import 'package:monvex_mobile/models/goal.dart';
import 'package:monvex_mobile/models/asset_liability.dart';
import 'package:monvex_mobile/models/subscription.dart';
import 'package:monvex_mobile/models/user_profile.dart';
import 'package:monvex_mobile/models/ai_message.dart';

void main() {
  group('Defensive Model Parsing & Zero-Fabrication Tests', () {
    test('Receipt defensive parsing with empty JSON does not crash', () {
      final receipt = Receipt.fromJson({});
      expect(receipt.id, equals(''));
      expect(receipt.merchantName, equals('Unknown Vendor'));
      expect(receipt.merchant, equals('Unknown Vendor'));
      expect(receipt.totalAmount, equals(0.0));
      expect(receipt.currency, equals('INR'));
      expect(receipt.status, equals('PENDING_REVIEW'));
      expect(receipt.isConfirmed, isFalse);
      expect(receipt.items, isEmpty);
    });

    test('Receipt parses line items accurately without inventing numbers', () {
      final json = {
        'id': 'rcpt-101',
        'merchant_name': 'Organic Supermarket',
        'total_amount': '450.50',
        'subtotal': '400.00',
        'tax_amount': '50.50',
        'currency': 'INR',
        'date': '2026-09-06',
        'predicted_category': 'Groceries',
        'confidence_score': 0.94,
        'status': 'CONFIRMED',
        'items': [
          {'name': 'Almond Milk', 'qty': 2, 'price': 120.0},
          {'name': 'Organic Oats', 'quantity': 1, 'amount': 210.50},
        ],
      };

      final receipt = Receipt.fromJson(json);
      expect(receipt.id, equals('rcpt-101'));
      expect(receipt.merchant, equals('Organic Supermarket'));
      expect(receipt.totalAmount, equals(450.50));
      expect(receipt.isConfirmed, isTrue);
      expect(receipt.items.length, equals(2));
      expect(receipt.items[0].description, equals('Almond Milk'));
      expect(receipt.items[0].totalPrice, equals(240.0));
      expect(receipt.items[1].description, equals('Organic Oats'));
      expect(receipt.items[1].totalPrice, equals(210.50));
    });

    test('Receipt.empty() guarantees zero fabricated values', () {
      final emptyReceipt = Receipt.empty();
      expect(emptyReceipt.totalAmount, equals(0.0));
      expect(emptyReceipt.subtotal, equals(0.0));
      expect(emptyReceipt.taxAmount, equals(0.0));
      expect(emptyReceipt.status, equals('MANUAL_ENTRY_REQUIRED'));
      expect(emptyReceipt.isConfirmed, isFalse);
      expect(emptyReceipt.items, isEmpty);
    });

    test('TransactionModel handles missing fields safely', () {
      final tx = TransactionModel.fromJson({});
      expect(tx.id, equals(''));
      expect(tx.amount, equals(0.0));
      expect(tx.type, equals('EXPENSE'));
      expect(tx.categoryName, equals('General'));
      expect(tx.currency, equals('INR'));
      expect(tx.isExpense, isTrue);
      expect(tx.isIncome, isFalse);
    });

    test('TransactionModel parses populated payload correctly', () {
      final tx = TransactionModel.fromJson({
        'id': 'tx-202',
        'amount': '1250.75',
        'type': 'INCOME',
        'category_name': 'Freelance Consulting',
        'merchant_name': 'Tech Client',
        'date': '2026-09-06',
      });
      expect(tx.id, equals('tx-202'));
      expect(tx.amount, equals(1250.75));
      expect(tx.isIncome, isTrue);
      expect(tx.merchantName, equals('Tech Client'));
      expect(tx.categoryName, equals('Freelance Consulting'));
    });

    test('BudgetModel computes pacing metrics correctly', () {
      final budget = BudgetModel.fromJson({
        'id': 'b-1',
        'category_name': 'Dining Out',
        'amount': 1000.0,
        'spent': 850.0,
      });

      expect(budget.amount, equals(1000.0));
      expect(budget.spent, equals(850.0));
      expect(budget.usagePercentage, equals(85.0));
      expect(budget.isWarning, isTrue);
      expect(budget.isExceeded, isFalse);
      expect(budget.paceInsight, isNotEmpty);
    });

    test('GoalModel calculates remaining days and progress safely', () {
      final goal = GoalModel.fromJson({
        'id': 'g-1',
        'title': 'Emergency Fund',
        'target_amount': 50000.0,
        'current_amount': 25000.0,
        'target_date': '2026-12-31',
      });

      expect(goal.name, equals('Emergency Fund'));
      expect(goal.targetAmount, equals(50000.0));
      expect(goal.currentAmount, equals(25000.0));
      expect(goal.progressPercentage, equals(50.0));
      expect(goal.remainingAmount, equals(25000.0));
      expect(goal.isCompleted, isFalse);
    });

    test('Asset and Liability defensive parsing', () {
      final asset = Asset.fromJson({
        'id': 'a-1',
        'name': 'Tesla Model 3',
        'asset_type': 'VEHICLE',
        'value': 35000.0,
      });
      expect(asset.currentValue, equals(35000.0));
      expect(asset.category, equals('VEHICLE'));

      final liability = Liability.fromJson({
        'id': 'l-1',
        'name': 'Student Loan',
        'liability_type': 'EDUCATION',
        'remaining_balance': 15000.0,
        'interest_rate_pct': 4.5,
        'monthly_emi': 350.0,
      });
      expect(liability.currentBalance, equals(15000.0));
      expect(liability.interestRate, equals(4.5));
      expect(liability.minimumPayment, equals(350.0));
    });

    test('Subscription monthly cost normalization', () {
      final annualSub = Subscription.fromJson({
        'id': 'sub-1',
        'name': 'AWS Cloud Hosting',
        'amount': 1200.0,
        'billing_cycle': 'YEARLY',
      });
      expect(annualSub.monthlyCost, equals(100.0));

      final monthlySub = Subscription.fromJson({
        'id': 'sub-2',
        'name': 'Spotify Premium',
        'amount': 10.99,
        'billing_cycle': 'MONTHLY',
      });
      expect(monthlySub.monthlyCost, equals(10.99));
    });

    test('UserProfile parses safely without exceptions', () {
      final profile = UserProfile.fromJson({
        'id': 'usr-789',
        'email': 'investor@monvex.ai',
        'first_name': 'Alex',
        'last_name': 'Morgan',
        'profile': {
          'currency': 'USD',
          'monthly_income': 8500.0,
        },
      });

      expect(profile.id, equals('usr-789'));
      expect(profile.email, equals('investor@monvex.ai'));
      expect(profile.displayName, equals('Alex Morgan'));
      expect(profile.currency, equals('USD'));
      expect(profile.monthlyIncome, equals(8500.0));
    });

    test('AiMessageModel parses assistant response with tools', () {
      final msg = AiMessageModel.fromJson({
        'id': 'm-1',
        'sender': 'assistant',
        'text': 'Your cash flow trajectory indicates 14 months of runway.',
        'tools_used': ['Runway Calculator', 'Solvency Engine'],
      });

      expect(msg.isUser, isFalse);
      expect(msg.toolsUsed.length, equals(2));
      expect(msg.toolsUsed.contains('Runway Calculator'), isTrue);
    });
  });
}
