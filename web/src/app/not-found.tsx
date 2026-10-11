'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  Home,
  LayoutDashboard,
  Search,
  HelpCircle,
  Mail,
  ShieldCheck,
  Sparkles,
  Receipt,
  PiggyBank,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const authenticatedRoutes = [
    { href: '/dashboard', label: 'Console Dashboard', icon: LayoutDashboard, desc: 'Balance sheet & cash runway' },
    { href: '/transactions', label: 'Ledger Entries', icon: Receipt, desc: 'Double-entry transaction history' },
    { href: '/ai', label: 'AI Financial Copilot', icon: Sparkles, desc: 'Natural language queries & scenario math' },
    { href: '/budgets', label: 'Budgets & Limits', icon: PiggyBank, desc: 'Category caps & burn rate trackers' },
  ];

  const publicRoutes = [
    { href: '/', label: 'Product Homepage', icon: Home, desc: 'Overview of MONVEX architecture' },
    { href: '/help', label: 'Help Center & FAQ', icon: HelpCircle, desc: 'Guides on ledger & features' },
    { href: '/security-overview', label: 'Security & Trust', icon: ShieldCheck, desc: 'Zero-trust architecture disclosure' },
    { href: '/contact', label: 'Contact & Support', icon: Mail, desc: 'Direct message to engineering' },
  ];

  const quickNav = isAuthenticated ? authenticatedRoutes : publicRoutes;

  return (
    <div className="min-h-screen bg-[#FAF9FC] dark:bg-[#0F0E17] text-[#20212B] dark:text-[#F4F3FA] flex flex-col justify-between selection:bg-[#6865E8] selection:text-white transition-colors duration-200">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-[#E7E6F0] dark:border-[#2D2B3F] bg-white/70 dark:bg-[#151421]/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-white p-1 border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
            <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
          </div>
          <span className="font-extrabold tracking-tight text-base text-[#20212B] dark:text-[#F4F3FA]">
            MONVEX
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#F4F3FA] dark:hover:bg-[#1B1A2A] border border-transparent hover:border-[#E7E6F0] dark:hover:border-[#2D2B3F] transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-[#6865E8]" />
            )}
          </button>

          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="bg-[#6865E8] text-white rounded-xl text-xs">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm" className="rounded-xl text-xs">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main 404 Canvas */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center">
        {/* Glow badge & Code */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDF8] dark:bg-[#23213B] border border-[#6865E8]/30 dark:border-[#7C79F2]/30 text-xs font-mono font-bold uppercase tracking-wider text-[#6865E8] dark:text-[#7C79F2] mb-4">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>HTTP 404 • ROUTE UNRESOLVED</span>
        </div>

        {/* Big Stylized 404 Visual */}
        <div className="relative my-2 select-none">
          <span className="text-7xl sm:text-9xl font-black tracking-tighter text-[#20212B]/10 dark:text-white/10 font-mono">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-elevated flex items-center justify-center text-[#6865E8] dark:text-[#7C79F2] animate-bounce">
              <Compass className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>

        {/* Heading & Contextual Subtitle */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#20212B] dark:text-[#F4F3FA] mt-4 mb-2">
          Page Not Located in Ledger Space
        </h1>
        <p className="max-w-md mx-auto text-xs sm:text-sm text-[#77798A] dark:text-[#A6A4B8] leading-relaxed mb-8">
          The requested path does not exist, has been reorganized, or requires different authentication privileges.
        </p>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-10">
          {isAuthenticated ? (
            <Link href="/dashboard" className="w-full sm:w-auto flex-1">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<LayoutDashboard className="h-4 w-4" />}
                className="w-full bg-[#6865E8] hover:bg-[#5754DC] text-white font-bold rounded-2xl shadow-sm"
              >
                Back to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/" className="w-full sm:w-auto flex-1">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Home className="h-4 w-4" />}
                className="w-full bg-[#6865E8] hover:bg-[#5754DC] text-white font-bold rounded-2xl shadow-sm"
              >
                Return to Homepage
              </Button>
            </Link>
          )}

          <Link href="/help" className="w-full sm:w-auto flex-1">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<HelpCircle className="h-4 w-4" />}
              className="w-full font-semibold rounded-2xl border border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#1B1A2A] text-[#20212B] dark:text-[#F4F3FA]"
            >
              Browse Help Center
            </Button>
          </Link>
        </div>

        {/* Structured Destination Directory (Card Grid) */}
        <div className="w-full max-w-2xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] rounded-3xl p-5 sm:p-6 shadow-card text-left">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E6F0] dark:border-[#2D2B3F] mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#77798A] dark:text-[#A6A4B8]">
              {isAuthenticated ? 'Suggested Workspace Destinations' : 'Explore MONVEX Intelligence'}
            </span>
            <span className="text-[11px] font-mono text-[#6865E8] dark:text-[#7C79F2]">
              {isAuthenticated ? `Signed in as @${user?.username || 'member'}` : 'Guest Session'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 p-3 rounded-2xl border border-transparent hover:border-[#E7E6F0] dark:hover:border-[#2D2B3F] hover:bg-[#FAF9FC] dark:hover:bg-[#222135] transition-all"
                >
                  <div className="p-2 rounded-xl bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2] group-hover:scale-105 transition-transform shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-semibold text-xs text-[#20212B] dark:text-[#F4F3FA] group-hover:text-[#6865E8] dark:group-hover:text-[#7C79F2] transition-colors">
                      <span>{item.label}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-[#77798A] dark:text-[#A6A4B8] truncate">
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-wrap items-center justify-between gap-2 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <span>Need direct assistance?</span>
            <Link
              href="/contact"
              className="text-[#6865E8] dark:text-[#7C79F2] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Contact engineering & support</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full border-t border-[#E7E6F0] dark:border-[#2D2B3F] py-4 px-4 sm:px-8 text-center text-xs text-[#77798A] dark:text-[#A6A4B8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} MONVEX. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
            <Link href="/terms-of-service" className="hover:underline">Terms</Link>
            <Link href="/security-overview" className="hover:underline">Security</Link>
            <Link href="/contact" className="hover:underline">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
