'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  ArrowRight,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  FileText,
  Mail,
  Info,
  Scale,
  Cookie,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface PublicPageShellProps {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  lastUpdated?: string;
  actionSlot?: React.ReactNode;
  maxWidth?: string;
}

export const PublicPageShell: React.FC<PublicPageShellProps> = ({
  children,
  eyebrow,
  title,
  description,
  lastUpdated,
  actionSlot,
  maxWidth = 'max-w-5xl',
}) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/security-overview', label: 'Security' },
    { href: '/help', label: 'Help & FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC] dark:bg-[#0F0E17] text-[#20212B] dark:text-[#F4F3FA] transition-colors duration-200">
      {/* =========================================================================
          TOP NAVIGATION HEADER (Glassmorphic)
          ========================================================================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#151421]/80 border-b border-[#E7E6F0] dark:border-[#2D2B3F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6865E8]/40 rounded-xl p-1"
          >
            <div className="h-9 w-9 rounded-xl overflow-hidden bg-white p-1 border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-base text-[#20212B] dark:text-[#F4F3FA]">
                MONVEX
              </span>
              <span className="text-[10px] font-medium text-[#77798A] dark:text-[#A6A4B8] hidden sm:block -mt-1">
                Financial Operating System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-[#6865E8] dark:text-[#7C79F2] bg-[#EEEDF8] dark:bg-[#23213B]'
                      : 'text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA] hover:bg-[#F4F3FA] dark:hover:bg-[#1B1A2A]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
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

            {/* Auth Actions */}
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="bg-[#6865E8] hover:bg-[#5754DC] text-white shadow-xs rounded-xl"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA] hover:bg-[#F4F3FA] dark:hover:bg-[#1B1A2A] rounded-xl"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="bg-[#6865E8] hover:bg-[#5754DC] text-white shadow-xs rounded-xl text-xs font-bold"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-xl text-[#77798A] dark:text-[#A6A4B8] hover:bg-[#F4F3FA] dark:hover:bg-[#1B1A2A]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#151421] px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? 'text-[#6865E8] dark:text-[#7C79F2] bg-[#EEEDF8] dark:bg-[#23213B]'
                    : 'text-[#77798A] dark:text-[#A6A4B8] hover:text-[#20212B] dark:hover:text-[#F4F3FA]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-col gap-2">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full bg-[#6865E8] text-white">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full bg-[#6865E8] text-white">
                      Create Free Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO BANNER (If title or eyebrow provided)
          ========================================================================= */}
      {(title || eyebrow) && (
        <section className="border-b border-[#E7E6F0] dark:border-[#2D2B3F] bg-gradient-to-b from-white to-[#F4F3FA] dark:from-[#151421] dark:to-[#0F0E17] py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className={`${maxWidth} mx-auto`}>
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDF8] dark:bg-[#23213B] border border-[#6865E8]/20 dark:border-[#7C79F2]/20 text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8] dark:text-[#7C79F2] mb-3">
                <span>{eyebrow}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                {title && (
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#20212B] dark:text-[#F4F3FA]">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm sm:text-base text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                    {description}
                  </p>
                )}
                {lastUpdated && (
                  <div className="pt-1 text-xs font-mono text-[#77798A] dark:text-[#A6A4B8]">
                    Last Updated: <span className="font-semibold text-[#20212B] dark:text-[#F4F3FA]">{lastUpdated}</span>
                  </div>
                )}
              </div>
              {actionSlot && <div className="shrink-0">{actionSlot}</div>}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          MAIN PAGE CONTENT
          ========================================================================= */}
      <main className={`flex-1 ${maxWidth} mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12`}>
        {children}
      </main>

      {/* =========================================================================
          COMPREHENSIVE STRUCTURED FOOTER
          ========================================================================= */}
      <footer className="mt-auto border-t border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#151421] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Column 1: Brand & Philosophy */}
            <div className="lg:col-span-1 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white p-1 border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-2xs flex items-center justify-center">
                  <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
                </div>
                <span className="font-extrabold tracking-tight text-lg text-[#20212B] dark:text-[#F4F3FA]">
                  MONVEX
                </span>
              </Link>
              <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                Autonomous personal financial intelligence platform built on deterministic double-entry accounting and verified arithmetic modeling.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
              <div className="pt-1 text-[11px] text-[#77798A] dark:text-[#A6A4B8]">
                Conceived & engineered by{' '}
                <span className="font-semibold text-[#20212B] dark:text-[#F4F3FA]">Danish Ansari</span>
              </div>
            </div>

            {/* Column 2: Platform Architecture */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA]">
                Platform
              </h3>
              <ul className="space-y-2 text-xs font-medium text-[#77798A] dark:text-[#A6A4B8]">
                <li>
                  <Link href="/#core-loop" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Double-Entry Ledger
                  </Link>
                </li>
                <li>
                  <Link href="/#simulator" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    What-If Engine
                  </Link>
                </li>
                <li>
                  <Link href="/#intelligence" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    AI Copilot Intelligence
                  </Link>
                </li>
                <li>
                  <Link href="/#desktop" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Desktop Windows Application
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Live Telemetry Console
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Trust & Security */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA]">
                Trust & Security
              </h3>
              <ul className="space-y-2 text-xs font-medium text-[#77798A] dark:text-[#A6A4B8]">
                <li>
                  <Link href="/security-overview" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Security & Trust Architecture
                  </Link>
                </li>
                <li>
                  <Link href="/security-overview#data-protection" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Zero-Trust Vault & MFA
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy#data-protection" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Zero-Knowledge Ingestion
                  </Link>
                </li>
                <li>
                  <Link href="/security-overview#disclosure" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Vulnerability Disclosure
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policies */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA]">
                Legal & Governance
              </h3>
              <ul className="space-y-2 text-xs font-medium text-[#77798A] dark:text-[#A6A4B8]">
                <li>
                  <Link href="/privacy-policy" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Cookie & Storage Policy
                  </Link>
                </li>
                <li>
                  <Link href="/financial-disclaimer" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Financial Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Company & Support */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#20212B] dark:text-[#F4F3FA]">
                Company & Support
              </h3>
              <ul className="space-y-2 text-xs font-medium text-[#77798A] dark:text-[#A6A4B8]">
                <li>
                  <Link href="/about" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    About MONVEX
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Help Center & FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Contact & Inquiries
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#6865E8] dark:hover:text-[#7C79F2] transition-colors">
                    Workspace Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Regulatory Footnote */}
          <div className="mt-12 pt-8 border-t border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <span>&copy; {new Date().getFullYear()} MONVEX. All rights reserved.</span>
              <span className="hidden sm:inline text-[#E7E6F0] dark:text-[#2D2B3F]">•</span>
              <span>Deterministic Double-Entry Personal Finance</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/privacy-policy" className="hover:underline">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms
              </Link>
              <Link href="/cookie-policy" className="hover:underline">
                Cookies
              </Link>
              <Link href="/financial-disclaimer" className="hover:underline">
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
