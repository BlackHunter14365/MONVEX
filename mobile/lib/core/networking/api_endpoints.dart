/// Frozen API Endpoints for MONVEX Multi-Platform Services
class ApiEndpoints {
  // Authentication
  static const String login = '/auth/login/';
  static const String register = '/auth/register/';
  static const String me = '/auth/me/';
  static const String logout = '/auth/logout/';
  static const String googleAuth = '/auth/google/';
  static const String verificationCheck = '/auth/verification/check/';
  static const String verificationResend = '/auth/verification/resend/';

  // Analytics & Dashboard
  static const String dashboard = '/analytics/dashboard/';
  static const String healthScore = '/analytics/health-score/';

  // Transactions & Ingestion
  static const String transactions = '/transactions/';
  static const String transactionSummary = '/transactions/summary/';

  // Accounts
  static const String accounts = '/accounts/';

  // Budgets
  static const String budgets = '/budgets/';

  // Goals
  static const String goals = '/goals/';

  // AI Copilot
  static const String aiChat = '/ai/chat/';

  // Universal Search
  static const String search = '/search/';

  // Security & Audit
  static const String securityOverview = '/security/overview/';
  static const String securityLogs = '/security/logs/';
}
