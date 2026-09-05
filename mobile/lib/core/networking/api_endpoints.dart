/// Authoritative API Endpoints for MONVEX Android Mobile Platform
class ApiEndpoints {
  // Authentication & Session
  static const String login = '/auth/login/';
  static const String register = '/auth/register/';
  static const String me = '/auth/me/';
  static const String logout = '/auth/logout/';
  static const String refresh = '/auth/refresh/';
  static const String googleAuth = '/auth/google/';
  static const String verificationCheck = '/auth/verification/check/';
  static const String verificationResend = '/auth/verification/resend/';

  // Analytics & Dashboard
  static const String dashboard = '/analytics/dashboard/';
  static const String healthScore = '/analytics/health-score/';

  // Core Ledger & Transactions
  static const String transactions = '/transactions/';
  static const String categories = '/transactions/categories/';
  static const String parseNatural = '/transactions/parse-natural/';
  static const String duplicates = '/transactions/duplicates/';

  // Receipt Intelligence & OCR
  static const String receipts = '/transactions/receipts/';
  static const String receiptUpload = '/transactions/receipts/upload/';
  static String receiptConfirm(String id) => '/transactions/receipts/$id/confirm/';
  static String receiptImage(String id) => '/transactions/receipts/$id/image/';

  // Financial Reports & PDF Export
  static const String monthlyReport = '/transactions/report/monthly/';
  static const String reportPdf = '/transactions/report/pdf/';
  static const String pdfReport = '/transactions/report/pdf/';
  static const String exportCsv = '/transactions/export/';

  // Wallets, Accounts & Portfolio
  static const String accounts = '/transactions/assets/';
  static const String assets = '/transactions/assets/';
  static const String liabilities = '/transactions/liabilities/';
  static const String netWorth = '/transactions/net-worth/';
  static const String debtPlanner = '/transactions/debt-planner/';
  static const String debtSimulate = '/transactions/debt-simulate/';

  // Budgets & Savings Goals
  static const String budgets = '/budgets/';
  static const String goals = '/goals/';
  static String goalContribute(String id) => '/goals/$id/contribute/';

  // Subscriptions & Recurring Payments
  static const String recurring = '/transactions/recurring/';
  static const String subscriptions = '/transactions/recurring/';

  // Smart Alerts & Notifications
  static const String notifications = '/transactions/notifications/';
  static const String notificationClearAll = '/transactions/notifications/clear-all/';

  // AI Copilot & Financial Reasoning
  static const String aiChat = '/ai/chat/';
  static const String aiQuery = '/ai/query/';
  static const String impulseBuy = '/ai/impulse-buy/';
  static const String impulseBuyCheck = '/ai/impulse-buy/';
  static const String aiParseTransaction = '/transactions/parse-natural/';

  // Universal Search
  static const String search = '/transactions/search/';

  // Security & Audit
  static const String securityOverview = '/security/overview/';
  static const String securityLogs = '/security/logs/';
}
