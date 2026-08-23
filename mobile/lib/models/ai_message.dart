class AiMessageModel {
  final String id;
  final String sender; // 'user' | 'assistant'
  final String text;
  final List<String> toolsUsed;
  final DateTime timestamp;

  AiMessageModel({
    required this.id,
    required this.sender,
    required this.text,
    this.toolsUsed = const [],
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isUser => sender == 'user';
  bool get isBot => sender == 'assistant' || sender == 'bot';
}
