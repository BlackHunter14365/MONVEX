/**
 * MONVEX V4.0 Financial Intelligence & AI Response Types
 * Strongly typed contracts for structured AI outputs:
 * Metrics, Charts, Insights, Recommendations, and Actions.
 */

export type AIMetricType = 'currency' | 'number' | 'percentage' | 'text';
export type AIMetricTrend = 'positive' | 'negative' | 'neutral';

export interface AIMetricCard {
  title: string;
  value: number | string;
  type?: AIMetricType;
  delta?: string | null;
  trend?: AIMetricTrend;
  subtitle?: string;
}

export interface AIChartSeries {
  key: string;
  name: string;
  color?: string;
}

export type AIChartType = 'line' | 'bar' | 'area' | 'donut' | 'comparison';

export interface AIChartConfig {
  type: AIChartType;
  title: string;
  xAxis?: string;
  yAxisLabel?: string;
  series?: AIChartSeries[];
  data: Array<Record<string, any>>;
  description?: string;
}

export interface AIInsightItem {
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  icon?: string;
}

export interface AIRecommendationItem {
  title: string;
  description: string;
  actionLabel?: string;
  actionPrompt?: string;
  impact?: string;
}

export interface AIActionChip {
  label: string;
  prompt: string;
  icon?: string;
}

export interface AIWarningItem {
  message: string;
  severity?: string;
}

export interface DesktopChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  toolActivity?: string[];
  citations?: Array<{ title: string; url: string }>;
  intent?: string;
  data?: any;
  metrics?: AIMetricCard[];
  charts?: AIChartConfig[];
  insights?: AIInsightItem[];
  recommendations?: AIRecommendationItem[];
  actions?: AIActionChip[];
  warnings?: AIWarningItem[];
  reasoningSteps?: string[];
  thoughtDuration?: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface DesktopChatSessionHistory {
  id: string;
  title: string;
  dateGroup: 'Today' | 'Yesterday' | 'Previous 7 Days';
  pinned?: boolean;
}

export interface AIStarterPrompt {
  title: string;
  subtitle: string;
  icon: string;
  prompt: string;
  category?: 'spending' | 'budget' | 'forecast' | 'simulation' | 'debt';
}
