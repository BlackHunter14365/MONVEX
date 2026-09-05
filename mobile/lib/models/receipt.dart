class ReceiptItem {
  final String name;
  final int qty;
  final double price;

  const ReceiptItem({
    required this.name,
    required this.qty,
    required this.price,
  });

  factory ReceiptItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val is num) return val.toDouble();
      if (val != null) return double.tryParse(val.toString()) ?? 0.0;
      return 0.0;
    }

    int parseInt(dynamic val) {
      if (val is num) return val.toInt();
      if (val != null) return int.tryParse(val.toString()) ?? 1;
      return 1;
    }

    return ReceiptItem(
      name: json['name']?.toString() ?? 'Item',
      qty: parseInt(json['qty'] ?? json['quantity']),
      price: parseDouble(json['price'] ?? json['amount']),
    );
  }

  String get description => name;
  double get totalPrice => price * qty;

  Map<String, dynamic> toJson() => {
    'name': name,
    'qty': qty,
    'price': price,
  };
}

class Receipt {
  final String id;
  final String merchantName;
  final double totalAmount;
  final double subtotal;
  final double taxAmount;
  final double discountAmount;
  final String currency;
  final String date;
  final String predictedCategory;
  final double confidenceScore;
  final String status;
  final List<ReceiptItem> items;
  final String rawOcrText;
  final String? imageUrl;
  final String? confirmedTransactionId;
  final String createdAt;

  const Receipt({
    required this.id,
    required this.merchantName,
    required this.totalAmount,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.currency,
    required this.date,
    required this.predictedCategory,
    required this.confidenceScore,
    required this.status,
    required this.items,
    required this.rawOcrText,
    this.imageUrl,
    this.confirmedTransactionId,
    required this.createdAt,
  });

  bool get isConfirmed => status == 'CONFIRMED';
  bool get isPendingReview => status == 'PENDING_REVIEW';
  String get merchant => merchantName;
  String get category => predictedCategory;

  factory Receipt.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val is num) return val.toDouble();
      if (val != null) return double.tryParse(val.toString()) ?? 0.0;
      return 0.0;
    }

    var rawItems = json['items'];
    List<ReceiptItem> parsedItems = [];
    if (rawItems is List) {
      parsedItems = rawItems
          .whereType<Map<String, dynamic>>()
          .map((item) => ReceiptItem.fromJson(item))
          .toList();
    }

    return Receipt(
      id: json['id']?.toString() ?? '',
      merchantName: json['merchant_name']?.toString() ?? 'Unknown Vendor',
      totalAmount: parseDouble(json['total_amount']),
      subtotal: parseDouble(json['subtotal']),
      taxAmount: parseDouble(json['tax_amount']),
      discountAmount: parseDouble(json['discount_amount']),
      currency: json['currency']?.toString() ?? 'INR',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().split('T').first,
      predictedCategory: json['predicted_category']?.toString() ?? json['category_suggestion']?.toString() ?? 'Groceries',
      confidenceScore: parseDouble(json['confidence_score']),
      status: json['status']?.toString() ?? 'PENDING_REVIEW',
      items: parsedItems,
      rawOcrText: json['raw_ocr_text']?.toString() ?? json['raw_text']?.toString() ?? '',
      imageUrl: json['image_url']?.toString(),
      confirmedTransactionId: json['confirmed_transaction'] is Map
          ? json['confirmed_transaction']['id']?.toString()
          : json['confirmed_transaction']?.toString(),
      createdAt: json['created_at']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }

  factory Receipt.empty() => Receipt(
    id: '',
    merchantName: 'Unknown Vendor',
    totalAmount: 0.0,
    subtotal: 0.0,
    taxAmount: 0.0,
    discountAmount: 0.0,
    currency: 'INR',
    date: DateTime.now().toIso8601String().split('T').first,
    predictedCategory: 'Groceries',
    confidenceScore: 0.0,
    status: 'MANUAL_ENTRY_REQUIRED',
    items: const [],
    rawOcrText: '',
    createdAt: DateTime.now().toIso8601String(),
  );
}
