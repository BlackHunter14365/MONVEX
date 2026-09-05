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
  final String currency;

  const TransactionModel({
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
    this.currency = 'INR',
  });

  bool get isExpense => type.toUpperCase() == 'EXPENSE';
  bool get isIncome => type.toUpperCase() == 'INCOME';

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    double parsedAmount = 0.0;
    if (json['amount'] is num) {
      parsedAmount = (json['amount'] as num).toDouble();
    } else if (json['amount'] != null) {
      parsedAmount = double.tryParse(json['amount'].toString()) ?? 0.0;
    }

    String catName = 'General';
    String catColor = '#4056A1';
    if (json['category_name'] != null) {
      catName = json['category_name'].toString();
    } else if (json['category'] is Map) {
      catName = json['category']['name']?.toString() ?? 'General';
      catColor = json['category']['color']?.toString() ?? '#4056A1';
    }

    if (json['category_color'] != null) {
      catColor = json['category_color'].toString();
    }

    return TransactionModel(
      id: json['id']?.toString() ?? '',
      amount: parsedAmount,
      type: json['type']?.toString().toUpperCase() ?? 'EXPENSE',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().split('T').first,
      categoryName: catName,
      categoryColor: catColor,
      merchantName: json['merchant_name']?.toString() ?? json['merchant']?.toString(),
      description: json['description']?.toString() ?? json['title']?.toString(),
      accountName: json['account_name']?.toString() ?? (json['account'] is Map ? json['account']['name']?.toString() : null),
      source: json['source']?.toString() ?? 'MANUAL',
      confidence: json['confidence'] is num
          ? (json['confidence'] as num).toDouble()
          : double.tryParse(json['confidence']?.toString() ?? ''),
      currency: json['currency']?.toString() ?? 'INR',
    );
  }

  factory TransactionModel.empty() => TransactionModel(
    id: '',
    amount: 0.0,
    type: 'EXPENSE',
    date: DateTime.now().toIso8601String().split('T').first,
    categoryName: 'General',
    categoryColor: '#4056A1',
    source: 'MANUAL',
    currency: 'INR',
  );
}
