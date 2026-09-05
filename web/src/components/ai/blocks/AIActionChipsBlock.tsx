'use client';

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  PieChart,
  Sliders,
  DollarSign,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Target,
  CreditCard,
  BarChart2,
  Calendar,
  Activity,
} from 'lucide-react';
import { AIActionChip } from '@/types/ai';

interface Props {
  actions: AIActionChip[];
  onActionClick: (prompt: string) => void;
  disabled?: boolean;
}

export const AIActionChipsBlock: React.FC<Props> = ({ actions, onActionClick, disabled }) => {
  if (!actions || actions.length === 0) return null;

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'PieChart':
        return <PieChart className="h-3 w-3 text-[#2563EB]" />;
      case 'TrendingUp':
        return <TrendingUp className="h-3 w-3 text-[#059669]" />;
      case 'Sliders':
        return <Sliders className="h-3 w-3 text-[#7C3AED]" />;
      case 'DollarSign':
        return <DollarSign className="h-3 w-3 text-[#D97706]" />;
      case 'CreditCard':
        return <CreditCard className="h-3 w-3 text-[#E11D48]" />;
      case 'Target':
        return <Target className="h-3 w-3 text-[#059669]" />;
      case 'BarChart2':
        return <BarChart2 className="h-3 w-3 text-[#2563EB]" />;
      case 'Calendar':
        return <Calendar className="h-3 w-3 text-[#7C3AED]" />;
      case 'Activity':
        return <Activity className="h-3 w-3 text-[#059669]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="h-3 w-3 text-emerald-600" />;
      default:
        return <Sparkles className="h-3 w-3 text-[#2563EB]" />;
    }
  };

  return (
    <div className="pt-2 my-2 space-y-1.5">
      <span className="text-[10px] font-bold text-[#898390] uppercase tracking-wider block">
        Suggested Next Inquiries
      </span>
      <div className="flex flex-wrap gap-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onActionClick(act.prompt)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEEAF7] hover:bg-[#E9EDFA] border border-[#625477]/20 hover:border-[#7184C4]/35 text-xs font-semibold text-[#191522] shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#4056A1]/30 focus-visible:outline-none"
          >
            {renderIcon(act.icon)}
            <span>{act.label}</span>
            <ArrowUpRight className="h-3 w-3 text-[#898390] group-hover:text-[#191522] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
