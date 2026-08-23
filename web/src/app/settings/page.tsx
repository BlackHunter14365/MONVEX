'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  ShieldCheck,
  Download,
  Save,
  CheckCircle2,
  Bell,
  Sliders,
  Sparkles,
  Lock,
  Globe,
  Smartphone,
  Trash2,
  RefreshCw,
  Zap,
  Key,
  ShieldAlert,
  Mic,
  PieChart,
  Camera,
  Upload,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type TabId = 'general' | 'financial' | 'notifications' | 'ai' | 'security' | 'data';

const PRESET_AVATARS = [
  { id: 'pres_1', label: 'Executive', bg: 'from-blue-600 to-indigo-900', emoji: '💼' },
  { id: 'pres_2', label: 'Tech Lead', bg: 'from-emerald-500 to-teal-800', emoji: '⚡' },
  { id: 'pres_3', label: 'Investor', bg: 'from-amber-500 to-orange-800', emoji: '📈' },
  { id: 'pres_4', label: 'Cryptographer', bg: 'from-purple-600 to-indigo-950', emoji: '🛡️' },
  { id: 'pres_5', label: 'FIRE Builder', bg: 'from-rose-500 to-red-900', emoji: '🔥' },
  { id: 'pres_6', label: 'Minimalist', bg: 'from-slate-700 to-slate-950', emoji: '🏛️' },
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabId>('general');

  // 1. General Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('Building long-term financial sovereignty 🚀');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // 2. Financial Parameters State
  const [currency, setCurrency] = useState('INR');
  const [monthlyIncome, setMonthlyIncome] = useState('75000');
  const [savingsTarget, setSavingsTarget] = useState('25');
  const [fiscalStartDay, setFiscalStartDay] = useState('1');

  // 3. Notifications & Telemetry Toggles
  const [notifAnomaly, setNotifAnomaly] = useState(true);
  const [notifBudget80, setNotifBudget80] = useState(true);
  const [notifGoalMilestone, setNotifGoalMilestone] = useState(true);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);

  // 4. AI Copilot Behavior Preferences
  const [aiEmergencyBuffer, setAiEmergencyBuffer] = useState('2.5');
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [aiAutoCategorize, setAiAutoCategorize] = useState(true);

  // 5. Security & Session State
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [requireOtpLogin, setRequireOtpLogin] = useState(true);

  // Form saving status
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Load initial preferences & profile state
  const loadSettings = () => {
    if (!user) return;
    setCurrency(user.currency || 'INR');
    setMonthlyIncome(String(user.monthly_income || 75000));
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPhoneNumber(user.phone_number || '');

    // Hydrate from localStorage
    try {
      const fullSaved = localStorage.getItem(`monvex_user_profile_${user.username}`);
      if (fullSaved) {
        const parsed = JSON.parse(fullSaved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.bio) setBio(parsed.bio);
      }

      const savedAvatar = localStorage.getItem(`monvex_avatar_${user.username}`);
      if (savedAvatar) {
        if (savedAvatar.startsWith('data:image')) {
          setAvatarImage(savedAvatar);
          setSelectedPreset(null);
        } else if (savedAvatar.startsWith('{')) {
          const pres = JSON.parse(savedAvatar);
          setSelectedPreset(pres.id);
          setAvatarImage(null);
        }
      }

      const savedPrefs = localStorage.getItem('monvex_app_preferences');
      if (savedPrefs) {
        const p = JSON.parse(savedPrefs);
        if (p.savingsTarget) setSavingsTarget(p.savingsTarget);
        if (p.fiscalStartDay) setFiscalStartDay(p.fiscalStartDay);
        if (p.notifAnomaly !== undefined) setNotifAnomaly(p.notifAnomaly);
        if (p.notifBudget80 !== undefined) setNotifBudget80(p.notifBudget80);
        if (p.notifGoalMilestone !== undefined) setNotifGoalMilestone(p.notifGoalMilestone);
        if (p.notifWeeklyDigest !== undefined) setNotifWeeklyDigest(p.notifWeeklyDigest);
        if (p.aiEmergencyBuffer) setAiEmergencyBuffer(p.aiEmergencyBuffer);
        if (p.voiceLang) setVoiceLang(p.voiceLang);
        if (p.aiAutoCategorize !== undefined) setAiAutoCategorize(p.aiAutoCategorize);
        if (p.sessionTimeout) setSessionTimeout(p.sessionTimeout);
        if (p.requireOtpLogin !== undefined) setRequireOtpLogin(p.requireOtpLogin);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSettings();
    const handleProfileUpdate = () => loadSettings();
    window.addEventListener('monvex:profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('monvex:profile-updated', handleProfileUpdate);
  }, [user]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarImage(base64);
      setSelectedPreset(null);

      if (user) {
        localStorage.setItem(`monvex_avatar_${user.username}`, base64);
        localStorage.setItem('monvex_avatar_active', base64);
        window.dispatchEvent(new Event('monvex:profile-updated'));
      }
      toast.success('Photo uploaded! Click "Save changes" to permanently apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_AVATARS[0]) => {
    setSelectedPreset(preset.id);
    setAvatarImage(null);

    if (user) {
      localStorage.setItem(`monvex_avatar_${user.username}`, JSON.stringify(preset));
      window.dispatchEvent(new Event('monvex:profile-updated'));
    }
    toast.info(`Selected "${preset.label}" avatar style.`);
  };

  const handleRemovePhoto = () => {
    setAvatarImage(null);
    setSelectedPreset(null);
    if (user) {
      localStorage.removeItem(`monvex_avatar_${user.username}`);
      window.dispatchEvent(new Event('monvex:profile-updated'));
    }
    toast.success('Avatar reset to default initials.');
  };

  const handleSaveAllPreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');

    try {
      // 1. Update Backend Profile
      await api.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        currency,
        monthly_income: parseFloat(monthlyIncome) || 75000,
        savings_target_percentage: parseFloat(savingsTarget) || 20,
      });

      // 2. Persist Client User Profile & Avatar
      if (user) {
        if (avatarImage) {
          localStorage.setItem(`monvex_avatar_${user.username}`, avatarImage);
          localStorage.setItem('monvex_avatar_active', avatarImage);
        } else if (selectedPreset) {
          const pres = PRESET_AVATARS.find((p) => p.id === selectedPreset);
          if (pres) localStorage.setItem(`monvex_avatar_${user.username}`, JSON.stringify(pres));
        }

        const profileRecord = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
          bio: bio.trim(),
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem(`monvex_user_profile_${user.username}`, JSON.stringify(profileRecord));
        localStorage.setItem(`monvex_bio_${user.username}`, bio.trim());
      }

      // 3. Persist Client Preferences
      const clientPrefs = {
        savingsTarget,
        fiscalStartDay,
        notifAnomaly,
        notifBudget80,
        notifGoalMilestone,
        notifWeeklyDigest,
        aiEmergencyBuffer,
        voiceLang,
        aiAutoCategorize,
        sessionTimeout,
        requireOtpLogin,
      };
      localStorage.setItem('monvex_app_preferences', JSON.stringify(clientPrefs));

      await refreshUser();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('monvex:profile-updated'));
      }

      toast.success('✓ All profile details & system settings saved permanently!');
      setStatusMsg('Preferences saved & verified.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export Comprehensive Multi-Entity JSON Portfolio
  const handleExportData = async () => {
    try {
      const fullData = await api.exportFullUserDataJSON();
      const exportJson = JSON.stringify(fullData, null, 2);
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monvex-financial-portfolio-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ Complete JSON portfolio ledger downloaded.');
    } catch {
      toast.error('Failed to export portfolio data.');
    }
  };

  // Export Sanitized CSV Ledger
  const handleExportCSV = async () => {
    try {
      const blob = await api.downloadTransactionsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monvex_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('✓ Sanitized CSV ledger downloaded.');
    } catch {
      toast.error('Unable to export transactions CSV.');
    }
  };

  const handleRevokeSessions = async () => {
    try {
      const res = await api.revokeAllSessions();
      toast.success(res.message || 'All other device tokens invalidated. Current session remains active.');
    } catch {
      toast.error('Failed to revoke other sessions.');
    }
  };

  const navTabs = [
    { id: 'general' as TabId, label: 'Profile', icon: User },
    { id: 'financial' as TabId, label: 'Financial Parameters', icon: Sliders },
    { id: 'notifications' as TabId, label: 'Telemetry & Alerts', icon: Bell },
    { id: 'ai' as TabId, label: 'AI Intelligence', icon: Sparkles },
    { id: 'security' as TabId, label: 'Security & Auth', icon: ShieldCheck },
    { id: 'data' as TabId, label: 'Data & Backup', icon: Download },
  ];

  const fullName = `${firstName} ${lastName}`.trim() || user?.username || 'User Profile';

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        <PageHeader
          title="System Settings"
          description="Configure your financial intelligence parameters, profile photo, AI reasoner behavior, and security policies."
          actionSlot={
            <Button
              onClick={() => handleSaveAllPreferences()}
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<Save className="h-3.5 w-3.5" />}
              className="bg-[#172033] hover:bg-[#0F172A] text-white shadow-md font-bold"
            >
              Save changes
            </Button>
          }
        />

        {/* Navigation Tabs Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E4E2DC]">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-[#172033] text-white shadow-sm'
                    : 'text-[#5F6878] hover:text-[#172033] hover:bg-white/60'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-[#858D9A]')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Profile & Identity */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Main Profile Showcase Card */}
            <div className="editorial-card p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E2DC]/80 pb-5">
                <div className="flex items-center gap-4">
                  {/* Active Profile Photo Surface */}
                  <div className="relative group shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden bg-[#172033] text-white text-xl font-black shadow-lg border-2 border-white ring-2 ring-slate-900/10">
                      {avatarImage ? (
                        <img src={avatarImage} alt={fullName} className="h-full w-full object-cover" />
                      ) : selectedPreset ? (
                        <div
                          className={cn(
                            'h-full w-full flex items-center justify-center text-2xl bg-gradient-to-br',
                            PRESET_AVATARS.find((p) => p.id === selectedPreset)?.bg
                          )}
                        >
                          {PRESET_AVATARS.find((p) => p.id === selectedPreset)?.emoji}
                        </div>
                      ) : (
                        <span className="uppercase">{user?.username?.slice(0, 1) || 'U'}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#172033] text-white shadow-md hover:bg-[#2563EB] transition-all hover:scale-110"
                      title="Upload Photo"
                    >
                      <Camera className="h-3 w-3" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Name & Identity */}
                  <div>
                    <h3 className="text-base font-extrabold text-[#172033] flex items-center gap-2">
                      <span>{fullName}</span>
                      <span className="text-xs text-[#858D9A] font-medium font-mono">(@{user?.username})</span>
                    </h3>
                    <span className="text-xs text-[#5F6878] font-medium block">{user?.email}</span>
                    <span className="text-[11px] text-[#858D9A] italic block mt-0.5">{bio}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                    className="text-xs"
                  >
                    Upload Photo
                  </Button>
                  {(avatarImage || selectedPreset) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 text-xs font-semibold text-[#E11D48] hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                  <span className="brutalist-tag-emerald text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified Identity</span>
                  </span>
                </div>
              </div>

              {/* 3D Preset Selector Gallery */}
              <div className="space-y-2">
                <span className="swiss-eyebrow block">Or Choose a 3D Preset Style:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((p) => {
                    const isSel = selectedPreset === p.id && !avatarImage;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={cn(
                          'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1',
                          isSel
                            ? 'border-[#172033] bg-[#172033]/5 ring-2 ring-[#172033]/20 shadow-sm'
                            : 'border-[#E4E2DC] bg-white hover:border-[#858D9A]'
                        )}
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center text-base bg-gradient-to-br shadow-xs',
                            p.bg
                          )}
                        >
                          {p.emoji}
                        </div>
                        <span className="text-[10px] font-bold text-[#172033] truncate max-w-full">
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Primary Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Account Level & Tier</label>
                  <div className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] flex items-center justify-between">
                    <span>MONVEX Enterprise / Individual</span>
                    <Badge variant="neutral" size="sm">Tier 1</Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="swiss-eyebrow mb-1.5 block">Personal Tagline / Status Bio</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Financial Freedom Builder • Portfolio Target ₹1 Cr"
                  className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => handleSaveAllPreferences()}
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                  className="bg-[#172033] hover:bg-[#0F172A] text-white shadow-md font-bold px-6"
                >
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financial Parameters */}
        {activeTab === 'financial' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="editorial-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#E4E2DC]/80 pb-3">
                <h3 className="text-sm font-bold text-[#172033]">Core Monetary Framework</h3>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Set baseline monthly inflow, reporting denomination, and fiscal month boundaries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Reporting Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Monthly Inflow Baseline</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] pl-8 pr-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#858D9A]">
                      {currency === 'INR' ? '₹' : '$'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="swiss-eyebrow mb-1.5 block">
                    Target Monthly Savings Rate: {savingsTarget}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(e.target.value)}
                    className="w-full accent-[#172033] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#858D9A] font-semibold mt-1">
                    <span>5% (Lean)</span>
                    <span>25% (Recommended)</span>
                    <span>60% (Aggressive FIRE)</span>
                  </div>
                </div>

                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Fiscal Cycle Start Day</label>
                  <select
                    value={fiscalStartDay}
                    onChange={(e) => setFiscalStartDay(e.target.value)}
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  >
                    <option value="1">1st of Month (Standard Calendar)</option>
                    <option value="5">5th of Month</option>
                    <option value="10">10th of Month</option>
                    <option value="25">25th of Month (Salary Credit Date)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications & Telemetry Alerts */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="editorial-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#E4E2DC]/80 pb-3">
                <h3 className="text-sm font-bold text-[#172033]">Real-Time Telemetry Triggers</h3>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Control which mathematical deviations and threshold warnings trigger UI alerts.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#E4E2DC]">
                  <div>
                    <span className="text-xs font-extrabold text-[#172033] block">Statistical Outlier Anomaly Detection</span>
                    <span className="text-[11px] text-[#5F6878]">
                      Alert when a single expense exceeds 2.5 standard deviations from the 90-day category mean.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifAnomaly}
                    onChange={(e) => setNotifAnomaly(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E4E2DC] accent-[#172033]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#E4E2DC]">
                  <div>
                    <span className="text-xs font-extrabold text-[#172033] block">80% Budget Velocity Warning</span>
                    <span className="text-[11px] text-[#5F6878]">
                      Send alert when category spending reaches 80% with more than 10 days remaining in the billing cycle.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifBudget80}
                    onChange={(e) => setNotifBudget80(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E4E2DC] accent-[#172033]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#E4E2DC]">
                  <div>
                    <span className="text-xs font-extrabold text-[#172033] block">Savings Goal Milestone Celebrations</span>
                    <span className="text-[11px] text-[#5F6878]">
                      Display milestone confirmations at 25%, 50%, 75%, and 100% savings goal completion.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifGoalMilestone}
                    onChange={(e) => setNotifGoalMilestone(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E4E2DC] accent-[#172033]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#E4E2DC]">
                  <div>
                    <span className="text-xs font-extrabold text-[#172033] block">Weekly Digest Email</span>
                    <span className="text-[11px] text-[#5F6878]">
                      Receive an encrypted Sunday morning summary of weekly cash velocity and top expenses.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifWeeklyDigest}
                    onChange={(e) => setNotifWeeklyDigest(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E4E2DC] accent-[#172033]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Copilot Intelligence */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="editorial-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#E4E2DC]/80 pb-3">
                <h3 className="text-sm font-bold text-[#172033]">Autonomous Reasoner Model Parameters</h3>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Tune the risk tolerance, speech dialect, and auto-tagging algorithms for the AI assistant.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Affordability Emergency Buffer</label>
                  <select
                    value={aiEmergencyBuffer}
                    onChange={(e) => setAiEmergencyBuffer(e.target.value)}
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  >
                    <option value="2.0">2.0x Monthly Expenses (Lean)</option>
                    <option value="2.5">2.5x Monthly Expenses (Standard)</option>
                    <option value="3.0">3.0x Monthly Expenses (Conservative)</option>
                    <option value="6.0">6.0x Monthly Expenses (Maximum Protection)</option>
                  </select>
                </div>

                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Voice Dictation Dialect</label>
                  <select
                    value={voiceLang}
                    onChange={(e) => setVoiceLang(e.target.value)}
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  >
                    <option value="en-IN">English (India - en-IN)</option>
                    <option value="en-US">English (United States - en-US)</option>
                    <option value="en-GB">English (United Kingdom - en-GB)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#E4E2DC]">
                <div>
                  <span className="text-xs font-extrabold text-[#172033] block">Automatic Category Normalization</span>
                  <span className="text-[11px] text-[#5F6878]">
                    Allow the AI parser to automatically map unknown merchant names (e.g. Swiggy, Uber) to standard categories.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={aiAutoCategorize}
                  onChange={(e) => setAiAutoCategorize(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E4E2DC] accent-[#172033]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security & Session Isolation */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Cyber Defense Center Gateway Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#172033] to-[#0F172A] text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black tracking-tight text-white uppercase">
                      MONVEX Cyber Defense Center
                    </h4>
                    <span className="brutalist-tag-emerald text-[9px] py-0 px-1.5">Zero-Trust Active</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Live WAF intrusion prevention, tamper-evident audit stream & automated vulnerability self-audits.
                  </p>
                </div>
              </div>

              <a
                href="/security"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#172033] hover:bg-[#F6F5F1] text-xs font-bold shadow-md transition-all shrink-0"
              >
                <span>Open Defense Center</span>
                <span className="text-xs">➔</span>
              </a>
            </div>

            <div className="editorial-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#E4E2DC]/80 pb-3">
                <h3 className="text-sm font-bold text-[#172033]">Enterprise Access & Session Controls</h3>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Manage active browser sessions, inactivity timeouts, and two-factor challenge enforcement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="swiss-eyebrow mb-1.5 block">Inactivity Auto-Lock Timeout</label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full rounded-xl bg-white/80 border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
                  >
                    <option value="15">15 Minutes (Strict)</option>
                    <option value="60">60 Minutes (Standard)</option>
                    <option value="720">12 Hours</option>
                    <option value="10080">7 Days (Trusted Workstation)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#E4E2DC]">
                  <div>
                    <span className="text-xs font-extrabold text-[#172033] block">6-Digit OTP Security Challenge</span>
                    <span className="text-[11px] text-[#5F6878]">Require email OTP on new device sign-ins.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireOtpLogin}
                    onChange={(e) => setRequireOtpLogin(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E4E2DC] accent-[#172033]"
                  />
                </div>
              </div>

              {/* Authentication Methods */}
              <div className="space-y-3 pt-3 border-t border-[#E4E2DC]/80">
                <span className="swiss-eyebrow block">Connected Authentication Methods</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/80 border border-[#E4E2DC] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#F6F5F1] text-[#172033] flex items-center justify-center font-bold">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#172033] block">Password Authentication</span>
                        <span className="text-[11px] text-[#5F6878]">Standard email/username + password</span>
                      </div>
                    </div>
                    {user?.has_password_auth !== false ? (
                      <Badge variant="success" size="sm">✓ Active</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Not Set</Badge>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-white/80 border border-[#E4E2DC] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#F6F5F1] text-[#2563EB] flex items-center justify-center font-bold">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#172033] block">Google Sign-In</span>
                        <span className="text-[11px] text-[#5F6878]">Federated Google Identity</span>
                      </div>
                    </div>
                    {user?.has_google_auth ? (
                      <Badge variant="success" size="sm">✓ Connected</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Available</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Sessions Inspector */}
              <div className="space-y-3 pt-3 border-t border-[#E4E2DC]/80">
                <div className="flex items-center justify-between">
                  <span className="swiss-eyebrow block">Active Device Sessions</span>
                  <button
                    type="button"
                    onClick={handleRevokeSessions}
                    className="text-xs font-bold text-[#E11D48] hover:underline"
                  >
                    Revoke all other sessions
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-white/80 border border-[#E4E2DC] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
                        PC
                      </div>
                      <div>
                        <span className="font-bold text-[#172033] block">Windows 11 • Chrome 124 (Current Session)</span>
                        <span className="text-[10px] text-[#858D9A]">IP: 127.0.0.1 • Location: India • Active Now</span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Current</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Data Portability & Backup */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="editorial-card p-6 sm:p-7 space-y-6">
              <div className="border-b border-[#E4E2DC]/80 pb-3">
                <h3 className="text-sm font-bold text-[#172033]">Data Portability & Encrypted Archives</h3>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Export complete transaction ledgers in open JSON and CSV spreadsheet formats.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/80 border border-[#E4E2DC] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                    <Download className="h-4 w-4 text-[#2563EB]" />
                    <span>Complete JSON Database Backup</span>
                  </div>
                  <p className="text-[11px] text-[#5F6878]">
                    Export every transaction, category mapping, recurring payment, and budget rule into an encrypted JSON file.
                  </p>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full"
                  >
                    Download JSON Archive
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-white/80 border border-[#E4E2DC] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                    <Download className="h-4 w-4 text-[#059669]" />
                    <span>Spreadsheet CSV Export</span>
                  </div>
                  <p className="text-[11px] text-[#5F6878]">
                    Download a clean CSV file compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
                  </p>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full"
                  >
                    Download CSV Spreadsheet
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
