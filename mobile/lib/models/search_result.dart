class SearchResultItem {
  final String id;
  final String title;
  final String subtitle;
  final String category; // 'TRANSACTION', 'ACCOUNT', 'BUDGET', 'GOAL', 'NAVIGATION'
  final String? url;
  final Map<String, dynamic>? metadata;

  SearchResultItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.category,
    this.url,
    this.metadata,
  });

  factory SearchResultItem.fromJson(Map<String, dynamic> json) {
    return SearchResultItem(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? json['name'] ?? '',
      subtitle: json['subtitle'] ?? json['description'] ?? '',
      category: json['category'] ?? json['type'] ?? 'TRANSACTION',
      url: json['url'],
      metadata: json['metadata'] is Map<String, dynamic> ? json['metadata'] : null,
    );
  }
}
