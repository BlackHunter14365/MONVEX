class TransactionModel {
  final String id;
  final double amount;
  final String type;
  final String date;
  final String categoryName;
  final String categoryColor;
  final String? merchantName;
  final String? description;
  final String? accountName;
  final String source;
  final double? confidence;

  TransactionModel({
    required this.id,
    required this.amount,
    required this.type,
    required this.date,
    required this.categoryName,
    required this.categoryColor,
    this.merchantName,
    this.description,
    this.accountName,
    required this.source,
    this.confidence,
  });

  bool get isExpense => type == 'EXPENSE';
  bool get isIncome => type == 'INCOME';

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'].toString(),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      type: json['type'] ?? 'EXPENSE',
      date: json['date'] ?? '',
      categoryName: json['category_name'] ?? json['category']?['name'] ?? 'General',
      categoryColor: json['category_color'] ?? json['category']?['color'] ?? '#6366F1',
      merchantName: json['merchant_name'] ?? json['merchant'],
      description: json['description'],
      accountName: json['account_name'] ?? json['account']?['name'],
      source: json['source'] ?? 'MANUAL',
      confidence: json['confidence'] != null ? (json['confidence'] as num).toDouble() : null,
    );
  }
}
