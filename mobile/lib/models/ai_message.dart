class AiMessageModel {
  final String id;
  final String sender; // 'user' | 'assistant'
  final String text;
  final List<String> toolsUsed;
  final Map<String, dynamic>? structuredData;
  final Map<String, dynamic>? pendingAction; // If AI proposes an action requiring user confirmation
  final DateTime timestamp;

  AiMessageModel({
    required this.id,
    required this.sender,
    required this.text,
    this.toolsUsed = const [],
    this.structuredData,
    this.pendingAction,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isUser => sender == 'user';
  bool get isBot => sender == 'assistant' || sender == 'bot';

  factory AiMessageModel.fromJson(Map<String, dynamic> json) {
    return AiMessageModel(
      id: json['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      sender: json['sender']?.toString() ?? 'assistant',
      text: json['text']?.toString() ?? json['message']?.toString() ?? '',
      toolsUsed: (json['tools_used'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      structuredData: json['data'] is Map<String, dynamic> ? json['data'] : null,
      pendingAction: json['pending_action'] is Map<String, dynamic> ? json['pending_action'] : null,
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
