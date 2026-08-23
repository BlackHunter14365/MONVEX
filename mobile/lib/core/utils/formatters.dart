import 'package:intl/intl.dart';

class Formatters {
  static String currency(dynamic value, {String symbol = '₹', int decimals = 2}) {
    final numVal = value != null ? (value as num).toDouble() : 0.0;
    final formatter = NumberFormat.currency(
      symbol: symbol,
      decimalDigits: decimals,
    );
    return formatter.format(numVal);
  }

  static String compactCurrency(dynamic value, {String symbol = '₹'}) {
    final numVal = value != null ? (value as num).toDouble() : 0.0;
    if (numVal.abs() >= 10000000) {
      return '$symbol${(numVal / 10000000).toStringAsFixed(2)}Cr';
    } else if (numVal.abs() >= 100000) {
      return '$symbol${(numVal / 100000).toStringAsFixed(1)}L';
    } else if (numVal.abs() >= 1000) {
      return '$symbol${(numVal / 1000).toStringAsFixed(1)}k';
    }
    return currency(numVal, symbol: symbol, decimals: 0);
  }

  static String date(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('MMM d, yyyy').format(dt);
    } catch (_) {
      return isoDate;
    }
  }

  static String relativeDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final dt = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(dt);

      if (diff.inDays == 0) return 'Today';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return DateFormat('MMM d').format(dt);
    } catch (_) {
      return isoDate;
    }
  }
}
