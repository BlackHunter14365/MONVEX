# MONVEX V4.0 — Structured AI Response Schema Specification

============================================================
RESPONSE PAYLOAD CONTRACT
============================================================

The MONVEX V4.0 AI response payload provides a strongly typed structure containing both analytical narrative and visual financial data.

---

## 1. Schema Definition

```typescript
interface AIChatResponse {
  id: string;
  response: string;           // Direct Markdown analytical answer
  conversation_id: string;   // Session ID for multi-turn thread
  intent: string;            // Classified intent (16 domain categories)
  tools_used: string[];      // Verified domain tools invoked
  tool_activity: string[];   // Safe high-level activity steps
  citations: Array<{ title: string; url: string }>;
  data: Record<string, any>; // Raw verified dataset
  metrics?: AIMetricCard[];  // Financial KPI Cards
  charts?: AIChartConfig[];  // Dynamic Recharts configuration
  insights?: AIInsightItem[];// Key variance drivers & observations
  recommendations?: AIRecommendationItem[]; // Actionable advice
  actions?: AIActionChip[];  // Contextual follow-up suggestions
  warnings?: AIWarningItem[];// Safety & overspend warnings
  model: string;             // AI model name
}
```

---

## 2. Block Specifications

### 2.1 Financial KPI Card (`AIMetricCard`)
```json
{
  "title": "Current Month Spending",
  "value": 44200.00,
  "type": "currency",
  "delta": "+15.1%",
  "trend": "negative",
  "subtitle": "vs ₹38,400.00 last month"
}
```

### 2.2 Dynamic Chart (`AIChartConfig`)
```json
{
  "type": "comparison",
  "title": "Spending Variance by Category",
  "xAxis": "name",
  "yAxisLabel": "Amount (₹)",
  "series": [
    { "key": "previous", "name": "Previous Month", "color": "#858D9A" },
    { "key": "current", "name": "Current Month", "color": "#2563EB" }
  ],
  "data": [
    { "name": "Food & Dining", "previous": 8000, "current": 10400 },
    { "name": "Shopping", "previous": 5000, "current": 6800 }
  ],
  "description": "Comparison of spending across categories between current and previous months."
}
```

### 2.3 Insight Block (`AIInsightItem`)
```json
{
  "title": "Higher spend in Food & Dining",
  "description": "Outflow increased by +₹2,400.00 (30.0%) vs last month.",
  "severity": "warning",
  "icon": "TrendingUp"
}
```

### 2.4 Actionable Recommendation (`AIRecommendationItem`)
```json
{
  "title": "Optimize Food & Dining allocation",
  "description": "Target reducing Food & Dining by ₹500/week to stabilize your monthly run-rate.",
  "actionLabel": "Set Category Budget",
  "actionPrompt": "Help me set a budget cap for Food & Dining",
  "impact": "High Savings Potential"
}
```

### 2.5 Contextual Action Chip (`AIActionChip`)
```json
{
  "label": "Where can I cut spending?",
  "prompt": "Where can I cut spending this month?",
  "icon": "Sliders"
}
```
