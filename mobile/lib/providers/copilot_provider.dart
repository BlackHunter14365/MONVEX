import 'package:flutter/material.dart';
import '../core/networking/api_client.dart';
import '../core/networking/api_endpoints.dart';
import '../models/ai_message.dart';

class CopilotProvider extends ChangeNotifier {
  final List<AiMessageModel> _messages = [
    AiMessageModel(
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your MONVEX AI Financial Copilot. Ask me about your spending velocities, cash flow trajectory, or simulate scenarios.',
      toolsUsed: ['Financial Intelligence Engine'],
    ),
  ];
  bool _isLoading = false;
  String? _errorMessage;

  List<AiMessageModel> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> sendMessage(String text) async {
    final cleanText = text.trim();
    if (cleanText.isEmpty || _isLoading) return;

    final userMsg = AiMessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sender: 'user',
      text: cleanText,
    );
    _messages.add(userMsg);
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiClient.post(ApiEndpoints.aiChat, {
        'question': cleanText,
      });

      String botReply = 'Financial telemetry analysis completed.';
      List<String> tools = [];

      if (res is Map<String, dynamic>) {
        botReply = res['response'] ?? res['answer'] ?? botReply;
        if (res['tools_used'] is List) {
          tools = (res['tools_used'] as List).map((t) => t.toString()).toList();
        }
      }

      _messages.add(
        AiMessageModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          sender: 'assistant',
          text: botReply,
          toolsUsed: tools,
        ),
      );
    } catch (e) {
      _messages.add(
        AiMessageModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          sender: 'assistant',
          text: '⚠️ ${e.toString().replaceAll("Exception: ", "")}',
        ),
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearConversation() {
    _messages.clear();
    _messages.add(
      AiMessageModel(
        id: 'welcome_reset',
        sender: 'assistant',
        text: 'Session reset. What financial question can I help you analyze?',
        toolsUsed: ['Financial Intelligence Engine'],
      ),
    );
    notifyListeners();
  }
}
