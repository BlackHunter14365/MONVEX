import { HttpClient, httpClient } from './client';
import { AuthEndpoints } from './endpoints/auth';
import { TransactionEndpoints } from './endpoints/transactions';
import { BudgetEndpoints } from './endpoints/budgets';
import { GoalEndpoints } from './endpoints/goals';
import { AnalyticsEndpoints } from './endpoints/analytics';
import { AIEndpoints } from './endpoints/ai';
import { SecurityEndpoints } from './endpoints/security';
import { SearchResultGroup } from './types';

export class UnifiedApiClient {
  public auth: AuthEndpoints;
  public transactions: TransactionEndpoints;
  public budgets: BudgetEndpoints;
  public goals: GoalEndpoints;
  public analytics: AnalyticsEndpoints;
  public ai: AIEndpoints;
  public security: SecurityEndpoints;

  constructor(public client: HttpClient = httpClient) {
    this.auth = new AuthEndpoints(client);
    this.transactions = new TransactionEndpoints(client);
    this.budgets = new BudgetEndpoints(client);
    this.goals = new GoalEndpoints(client);
    this.analytics = new AnalyticsEndpoints(client);
    this.ai = new AIEndpoints(client);
    this.security = new SecurityEndpoints(client);
  }

  // Token management proxies
  getAccessToken = () => this.client.getAccessToken();
  setTokens = (access: string, refresh: string) => this.client.setTokens(access, refresh);
  clearTokens = () => this.client.clearTokens();

  // Auth proxies
  login = (c: any) => this.auth.login(c);
  googleLogin = (c: string) => this.auth.googleLogin(c);
  linkGoogleAccount = (p: any) => this.auth.linkGoogleAccount(p);
  register = (u: any) => this.auth.register(u);
  checkVerification = (p: any) => this.auth.checkVerification(p);
  resendVerification = (id: string) => this.auth.resendVerification(id);
  sendVerification = (email: string) => this.auth.sendVerification(email);
  verifyOTP = (p: any) => this.auth.verifyOTP(p);
  resendOTP = (id: string) => this.auth.resendOTP(id);
  getProfile = () => this.auth.getProfile();
  updateProfile = (p: any) => this.auth.updateProfile(p);
  logout = () => this.auth.logout();

  // Dashboard & Analytics proxies
  getDashboardMetrics = () => this.analytics.getDashboardMetrics();
  getAnalyticsSummary = () => this.analytics.getAnalyticsSummary();
  getHealthScore = () => this.analytics.getHealthScore();
  getCashflowForecast = (days?: number) => this.analytics.getCashflowForecast(days);
  getSpendingByCategory = () => this.analytics.getSpendingByCategory();
  getMonthlyTrend = () => this.analytics.getMonthlyTrend();
  getAnomalies = () => this.analytics.getAnomalies();

  // Transactions proxies
  getTransactions = (p?: any) => this.transactions.getTransactions(p);
  createTransaction = (t: any) => this.transactions.createTransaction(t);
  updateTransaction = (id: string, t: any) => this.transactions.updateTransaction(id, t);
  deleteTransaction = (id: string) => this.transactions.deleteTransaction(id);
  parseNaturalTransaction = (txt: string) => this.transactions.parseNaturalTransaction(txt);
  parseAndCategorize = (txt: string, amt?: number) => this.transactions.parseAndCategorize(txt, amt);
  getCategories = (type?: any) => this.transactions.getCategories(type);
  getRecurringPayments = () => this.transactions.getRecurringPayments();
  createRecurringPayment = (d: any) => this.transactions.createRecurringPayment(d);
  deleteRecurringPayment = (id: string) => this.transactions.deleteRecurringPayment(id);
  getNetWorth = () => this.transactions.getNetWorth();
  getAssets = () => this.transactions.getAssets();
  createAsset = (d: any) => this.transactions.createAsset(d);
  updateAsset = (id: string, d: any) => this.transactions.updateAsset(id, d);
  deleteAsset = (id: string) => this.transactions.deleteAsset(id);
  getLiabilities = () => this.transactions.getLiabilities();
  createLiability = (d: any) => this.transactions.createLiability(d);
  deleteLiability = (id: string) => this.transactions.deleteLiability(id);
  getDebtPlanner = () => this.transactions.getDebtPlanner();
  simulateDebt = (d: any) => this.transactions.simulateDebt(d);
  getReceipts = () => this.transactions.getReceipts();
  uploadReceipt = (d: any) => this.transactions.uploadReceipt(d);
  confirmReceipt = (id: string, d?: any) => this.transactions.confirmReceipt(id, d);
  rejectReceipt = (id: string) => this.transactions.rejectReceipt(id);
  getDuplicateTransactions = () => this.transactions.getDuplicateTransactions();
  getNotifications = (type?: string) => this.transactions.getNotifications(type);
  markNotificationRead = (id: string) => this.transactions.markNotificationRead(id);
  clearAllNotifications = () => this.transactions.clearAllNotifications();
  getWhyExplanation = (cat?: string) => this.transactions.getWhyExplanation(cat);
  getMonthlyReport = () => this.transactions.getMonthlyReport();
  downloadTransactionsCSV = () => this.transactions.downloadTransactionsCSV();

  // Budgets proxies
  getBudgets = () => this.budgets.getBudgets();
  createBudget = (b: any) => this.budgets.createBudget(b);
  updateBudget = (id: string, b: any) => this.budgets.updateBudget(id, b);
  deleteBudget = (id: string) => this.budgets.deleteBudget(id);

  // Goals proxies
  getGoals = () => this.goals.getGoals();
  createGoal = (g: any) => this.goals.createGoal(g);
  updateGoal = (id: string, d: any) => this.goals.updateGoal(id, d);
  deleteGoal = (id: string) => this.goals.deleteGoal(id);
  contributeToGoal = (id: string, amt: any, n?: string) => this.goals.contributeToGoal(id, amt, n);

  // AI proxies
  askCopilot = (q: string, cid?: string) => this.ai.askCopilot(q, cid);
  askAICopilot = (q: string, cid?: string) => this.ai.askAICopilot(q, cid);
  getAIConversations = () => this.ai.getAIConversations();
  getAIConversation = (id: string) => this.ai.getAIConversation(id);
  deleteAIConversation = (id: string) => this.ai.deleteAIConversation(id);
  clearAIConversation = (id: string) => this.ai.clearAIConversation(id);
  runWhatIfSimulation = (d: any) => this.ai.runWhatIfSimulation(d);
  runFullSimulation = (d: any) => this.ai.runFullSimulation(d);
  getAIHistory = () => this.ai.getAIHistory();

  // Security proxies
  getSecurityOverview = () => this.security.getSecurityOverview();
  getSecurityLogs = (p?: any) => this.security.getSecurityLogs(p);
  runSecurityScan = () => this.security.runSecurityScan();
  revokeAllSessions = () => this.security.revokeAllSessions();

  // Export full portfolio
  async exportFullUserDataJSON() {
    const [profile, transactions, budgets, goals, assets, liabilities, recurring] = await Promise.all([
      this.getProfile().catch(() => null),
      this.getTransactions().catch(() => []),
      this.getBudgets().catch(() => []),
      this.getGoals().catch(() => []),
      this.getAssets().catch(() => []),
      this.getLiabilities().catch(() => []),
      this.getRecurringPayments().catch(() => []),
    ]);

    return {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      platform: 'MONVEX Financial Intelligence',
      user: profile,
      financial_ledger: {
        transactions: Array.isArray(transactions) ? transactions : transactions?.results || [],
        budgets: Array.isArray(budgets) ? budgets : budgets?.results || [],
        goals: Array.isArray(goals) ? goals : goals?.results || [],
        assets: Array.isArray(assets) ? assets : assets?.results || [],
        liabilities: Array.isArray(liabilities) ? liabilities : liabilities?.results || [],
        recurring_payments: Array.isArray(recurring) ? recurring : recurring?.results || [],
      },
    };
  }

  // Universal Search API
  async search(query: string = '', limit: number = 5) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (limit) params.append('limit', String(limit));
    return this.client.request<{
      success: boolean;
      query: string;
      results: SearchResultGroup;
      total: number;
    }>(`/search/?${params.toString()}`);
  }

  // Contact Ingestion API
  async submitContact(payload: { name: string; email: string; phone?: string; message: string }) {
    return this.client.request<{ success: boolean; message: string; submission_id?: string }>('/contact/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new UnifiedApiClient();
export * from './types';
export * from './client';
