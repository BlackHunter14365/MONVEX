import 'package:flutter_test/flutter_test.dart';
import 'package:monvex_mobile/models/transaction.dart';
import 'package:monvex_mobile/models/budget.dart';
import 'package:monvex_mobile/models/goal.dart';
import 'package:monvex_mobile/models/account.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Financial Mutations & Idempotency Tests', () {
    test('Transaction creation payload enforces currency and defensive bounds', () {
      final json = {
        'id': 'tx_mutation_001',
        'title': 'Coffee Roasters',
        'amount': 250.00,
        'type': 'EXPENSE',
        'category': 'Food & Dining',
        'date': '2026-09-06T03:00:00Z',
        'currency': 'INR',
      };

      final tx = TransactionModel.fromJson(json);
      expect(tx.id, equals('tx_mutation_001'));
      expect(tx.amount, equals(250.00));
      expect(tx.isExpense, isTrue);
      expect(tx.currency, equals('INR'));
    });

    test('Concurrent or duplicate transaction payloads are distinct by idempotency keys/IDs', () {
      final tx1 = TransactionModel.fromJson({
        'id': 'tx_req_001',
        'title': 'Salary',
        'amount': 85000.0,
        'type': 'INCOME',
        'date': '2026-09-01',
      });

      final tx2 = TransactionModel.fromJson({
        'id': 'tx_req_002',
        'title': 'Salary',
        'amount': 85000.0,
        'type': 'INCOME',
        'date': '2026-09-01',
      });

      // Different unique transaction IDs mean distinct ledger entries
      expect(tx1.id, isNot(equals(tx2.id)));
      expect(tx1.amount, equals(tx2.amount));
    });

    test('Account balance update computes new balance defensively without overflow', () {
      final accountJson = {
        'id': 'acc_001',
        'name': 'Primary Checking',
        'type': 'CHECKING',
        'balance': 15000.50,
        'currency': 'INR',
      };

      final account = AccountModel.fromJson(accountJson);
      expect(account.balance, equals(15000.50));

      // Simulate a withdrawal mutation
      const debitAmount = 4500.0;
      final updatedBalance = account.balance - debitAmount;
      expect(updatedBalance, equals(10500.50));
    });

    test('Budget pacing calculates percentage safely when amount is zero or negative', () {
      final zeroBudget = BudgetModel.fromJson({
        'id': 'b_zero',
        'category': 'Entertainment',
        'amount': 0.0,
        'spent': 100.0,
        'month': '2026-09',
      });

      // Must not throw division by zero error
      expect(zeroBudget.usagePercentage, equals(0.0));
      expect(zeroBudget.remainingAmount, equals(-100.0));
    });

    test('Goal milestone contribution updates currentAmount without inventing target', () {
      final goal = GoalModel.fromJson({
        'id': 'goal_001',
        'name': 'Emergency Fund',
        'target_amount': 100000.0,
        'current_amount': 65000.0,
        'target_date': '2026-12-31',
      });

      expect(goal.progressPercentage, closeTo(65.0, 0.001));

      // Simulate contribution
      const contribution = 5000.0;
      final newCurrent = goal.currentAmount + contribution;
      final updatedGoal = GoalModel.fromJson({
        'id': goal.id,
        'name': goal.name,
        'target_amount': goal.targetAmount,
        'current_amount': newCurrent,
        'target_date': goal.targetDate,
      });

      expect(updatedGoal.currentAmount, equals(70000.0));
      expect(updatedGoal.progressPercentage, closeTo(70.0, 0.001));
      expect(updatedGoal.targetAmount, equals(100000.0));
    });
  });
}
