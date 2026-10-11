import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Landmark,
  PieChart,
  Target,
  CreditCard,
  Repeat,
  Sparkles,
  TrendingUp,
  Sliders,
  FileText,
  Bell,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  exact?: boolean;
}

export interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export const MONVEX_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'main',
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { name: 'Transactions', href: '/transactions', icon: Receipt },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'money',
    title: 'Money Management',
    items: [
      { name: 'Net Worth', href: '/net-worth', icon: Landmark },
      { name: 'Budgets', href: '/budgets', icon: PieChart },
      { name: 'Savings Goals', href: '/goals', icon: Target },
      { name: 'Debt & Loans', href: '/debt', icon: CreditCard },
      { name: 'Subscriptions', href: '/subscriptions', icon: Repeat, badge: '05' },
    ],
  },
  {
    id: 'intelligence',
    title: 'AI & Intelligence',
    items: [
      { name: 'AI Copilot', href: '/ai', icon: Sparkles, badge: 'AI' },
      { name: 'Cashflow Forecast', href: '/forecast', icon: TrendingUp },
      { name: 'What-If Simulator', href: '/simulator', icon: Sliders, badge: 'Sim' },
    ],
  },
  {
    id: 'documents',
    title: 'Documents & Vision',
    items: [
      { name: 'Receipt Vision', href: '/receipts', icon: Receipt, badge: 'OCR' },
      { name: 'Reports & Statements', href: '/reports', icon: FileText },
    ],
  },
  {
    id: 'preferences',
    title: 'System & Security',
    items: [
      { name: 'Smart Alerts', href: '/notifications', icon: Bell },
      { name: 'Security Vault', href: '/security', icon: ShieldCheck, badge: 'ZeroTrust' },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];
