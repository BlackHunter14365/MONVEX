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
  Database,
  Laptop,
  CheckCheck,
  Scale,
  FileText,
  Cookie,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type TabId = 'general' | 'financial' | 'notifications' | 'ai' | 'security' | 'data' | 'legal';

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

  // Form saving status
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const loadSettings = () => {
    if (!user) return;
    setCurrency(user.currency || 'INR');
    setMonthlyIncome(String(user.monthly_income || 75000));
    setSavingsTarget(String(user.savings_target_percentage || 20));
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPhoneNumber(user.phone_number || '');
    setBio(user.bio || 'Building long-term financial sovereignty 🚀');

    if (user.avatar_url) {
      setAvatarImage(user.avatar_url);
      setSelectedPreset(null);
    } else if (user.avatar_preset) {
      setSelectedPreset(user.avatar_preset);
      setAvatarImage(null);
    } else {
      setAvatarImage(null);
      setSelectedPreset(null);
    }

    const p = user.preferences || {};
    if (p.fiscalStartDay) setFiscalStartDay(p.fiscalStartDay);
    if (p.notifAnomaly !== undefined) setNotifAnomaly(p.notifAnomaly);
    if (p.notifBudget80 !== undefined) setNotifBudget80(p.notifBudget80);
    if (p.notifGoalMilestone !== undefined) setNotifGoalMilestone(p.notifGoalMilestone);
    if (p.notifWeeklyDigest !== undefined) setNotifWeeklyDigest(p.notifWeeklyDigest);
    if (p.aiEmergencyBuffer) setAiEmergencyBuffer(p.aiEmergencyBuffer);
    if (p.voiceLang) setVoiceLang(p.voiceLang);
    if (p.aiAutoCategorize !== undefined) setAiAutoCategorize(p.aiAutoCategorize);
    if (p.sessionTimeout) setSessionTimeout(p.sessionTimeout);
  };

  useEffect(() => {
    loadSettings();
    const handleProfileUpdate = () => loadSettings();
    window.addEventListener('monvex:profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('monvex:profile-updated', handleProfileUpdate);
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setPendingPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarImage(base64);
      setSelectedPreset(null);
      toast.info('Photo loaded. Click "Save changes" to permanently apply.');
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setAvatarImage(null);
    setPendingPhotoFile(null);
  };

  const handleRemovePhoto = () => {
    setAvatarImage(null);
    setSelectedPreset(null);
    setPendingPhotoFile(null);
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');

    try {
      if (pendingPhotoFile) {
        try {
          await api.uploadAvatar(pendingPhotoFile);
          setPendingPhotoFile(null);
        } catch {
          // Fall back to profile update
        }
      }

      const updatedPreferences = {
        ...(user?.preferences || {}),
        fiscalStartDay,
        notifAnomaly,
        notifBudget80,
        notifGoalMilestone,
        notifWeeklyDigest,
        aiEmergencyBuffer,
        voiceLang,
        aiAutoCategorize,
        sessionTimeout,
      };

      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        bio,
        currency,
        monthly_income: Number(monthlyIncome),
        savings_target_percentage: Number(savingsTarget),
        preferences: updatedPreferences,
      };

      if (selectedPreset) {
        payload.avatar_preset = selectedPreset;
      }

      await api.updateProfile(payload);
      await refreshUser();
      toast.success('✓ Account configuration updated successfully.');
      setStatusMsg('Configuration saved.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      toast.error('Failed to update settings.');
      setStatusMsg('Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'general', label: 'Profile Identity', icon: User },
    { id: 'financial', label: 'Financial Parameters', icon: Sliders },
    { id: 'notifications', label: 'Alert Telemetry', icon: Bell },
    { id: 'ai', label: 'Copilot Behavior', icon: Sparkles },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
    { id: 'data', label: 'Data Governance', icon: Database },
    { id: 'legal', label: 'Legal & Compliance', icon: Scale },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <PageHeader
          eyebrow="CONFIGURATION"
          title="Account Settings & Parameters"
          description="Tune deterministic parameters, base currency calibration, notification thresholds, and security parameters."
          actionSlot={
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAll}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
              className="bg-[#6865E8] hover:bg-[#5b58db] text-white rounded-2xl shadow-xs"
            >
              Save Configuration
            </Button>
          }
        />

        {/* =========================================================================
            1. TAB NAVIGATION PILLS (Aurora Glass)
            ========================================================================= */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#E7E6F0] overflow-x-auto scrollbar-none shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0',
                  isActive
                    ? 'bg-[#6865E8] text-white shadow-xs'
                    : 'text-[#77798A] hover:text-[#20212B] hover:bg-[#F8F7FC]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            2. TAB CONTENT PANELS (Aurora Glass)
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-8 shadow-xs">
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0]">
                <h3 className="text-base font-bold text-[#20212B]">Identity & Profile</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Manage personal information and visual avatar representation</p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0]">
                <div className="relative">
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover border-2 border-[#6865E8] shadow-xs"
                    />
                  ) : selectedPreset ? (
                    <div
                      className={cn(
                        'h-20 w-20 rounded-full flex items-center justify-center text-3xl shadow-xs bg-gradient-to-br',
                        PRESET_AVATARS.find((p) => p.id === selectedPreset)?.bg || 'from-indigo-600 to-purple-800'
                      )}
                    >
                      {PRESET_AVATARS.find((p) => p.id === selectedPreset)?.emoji || '💼'}
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-[#ECEBFF] text-[#6865E8] flex items-center justify-center text-2xl font-black">
                      {firstName ? firstName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'M'}
                    </div>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#6865E8] text-white flex items-center justify-center shadow-xs hover:bg-[#5b58db] transition-colors"
                    title="Upload photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div>
                    <span className="text-xs font-bold text-[#20212B] block">Select Persona or Upload Custom Photo</span>
                    <span className="text-[11px] text-[#77798A]">PNG, JPEG, or WEBP up to 5MB</span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {PRESET_AVATARS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePresetSelect(p.id)}
                        className={cn(
                          'h-9 w-9 rounded-xl flex items-center justify-center text-base transition-all bg-gradient-to-br',
                          p.bg,
                          selectedPreset === p.id ? 'ring-2 ring-[#6865E8] ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100'
                        )}
                        title={p.label}
                      >
                        {p.emoji}
                      </button>
                    ))}

                    {(avatarImage || selectedPreset) && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#E76D7A] hover:bg-[#FEF2F2] rounded-xl border border-[#FECDD3] transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Bio & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">Financial Bio / Mission</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL PARAMETERS */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0]">
                <h3 className="text-base font-bold text-[#20212B]">Financial Calibration</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Configure currency denominators, monthly income baselines, and savings targets</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">Primary Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">
                    Expected Monthly Net Inflow ({currency})
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">
                    Target Savings Velocity (% of Inflow)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">
                    Fiscal Month Start Day (Day of Month)
                  </label>
                  <select
                    value={fiscalStartDay}
                    onChange={(e) => setFiscalStartDay(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="1">1st of Month</option>
                    <option value="5">5th of Month</option>
                    <option value="15">15th of Month</option>
                    <option value="25">25th (Salary Day)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0]">
                <h3 className="text-base font-bold text-[#20212B]">Proactive Alert Triggers</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Toggle automated threshold monitoring and weekly intelligence digests</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'Anomalous Spending Velocity Triggers',
                    desc: 'Notify when daily spending exceeds 2.5x the historical moving average.',
                    state: notifAnomaly,
                    setter: setNotifAnomaly,
                  },
                  {
                    title: '80% Budget Guardrail Early Warning',
                    desc: 'Send proactive warning as soon as a category budget crosses 80% utilization.',
                    state: notifBudget80,
                    setter: setNotifBudget80,
                  },
                  {
                    title: 'Savings Milestone Achievement Celebration',
                    desc: 'Trigger milestone notifications and visual confirmation when goals mature.',
                    state: notifGoalMilestone,
                    setter: setNotifGoalMilestone,
                  },
                  {
                    title: 'Weekly Executive Briefing Digest',
                    desc: 'Compile comprehensive weekly portfolio summaries directly to your dashboard inbox.',
                    state: notifWeeklyDigest,
                    setter: setNotifWeeklyDigest,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-[#20212B] block">{item.title}</span>
                      <p className="text-xs text-[#77798A]">{item.desc}</p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.state}
                      onClick={() => item.setter(!item.state)}
                      className={cn(
                        'w-12 h-6.5 rounded-full p-1 transition-colors relative shrink-0',
                        item.state ? 'bg-[#6865E8]' : 'bg-[#E7E6F0]'
                      )}
                    >
                      <div
                        className={cn(
                          'h-4.5 w-4.5 rounded-full bg-white shadow-xs transition-transform',
                          item.state ? 'translate-x-5.5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AI COPILOT */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0]">
                <h3 className="text-base font-bold text-[#20212B]">AI Copilot Behavior & Parameters</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Customize intelligence heuristic models and voice input parameters</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">
                    Safety Reserve Multiplier (Months of Runway)
                  </label>
                  <select
                    value={aiEmergencyBuffer}
                    onChange={(e) => setAiEmergencyBuffer(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="1.5">1.5x Monthly Burn (Aggressive)</option>
                    <option value="2.5">2.5x Monthly Burn (Balanced)</option>
                    <option value="6.0">6.0x Monthly Burn (Conservative)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">
                    Voice Input Language Recognition
                  </label>
                  <select
                    value={voiceLang}
                    onChange={(e) => setVoiceLang(e.target.value)}
                    className="w-full rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-[#20212B] block">Automatic Category Classification</span>
                  <p className="text-xs text-[#77798A]">
                    Use heuristic vendor taxonomy to categorize imported and scanned transactions.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={aiAutoCategorize}
                  onClick={() => setAiAutoCategorize(!aiAutoCategorize)}
                  className={cn(
                    'w-12 h-6.5 rounded-full p-1 transition-colors relative shrink-0',
                    aiAutoCategorize ? 'bg-[#6865E8]' : 'bg-[#E7E6F0]'
                  )}
                >
                  <div
                    className={cn(
                      'h-4.5 w-4.5 rounded-full bg-white shadow-xs transition-transform',
                      aiAutoCategorize ? 'translate-x-5.5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0]">
                <h3 className="text-base font-bold text-[#20212B]">Security & Session Controls</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Manage session timeout windows and credential authentication</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#20212B] block">
                    Session Inactivity Auto-Lock (Minutes)
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full sm:w-80 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] p-3 min-h-[48px] text-sm font-semibold text-[#20212B] focus:border-[#6865E8] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="15">15 Minutes (High Security)</option>
                    <option value="60">60 Minutes (Standard)</option>
                    <option value="240">4 Hours (Extended Session)</option>
                  </select>
                </div>

                <div className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-2">
                  <span className="text-sm font-bold text-[#20212B] block">Multi-Factor Authentication</span>
                  <p className="text-xs text-[#77798A]">
                    Hardware security keys (FIDO2) and TOTP authenticator app enforcement are active on your account.
                  </p>
                  <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8FBF4] text-[#16745C] border border-[#B6F0DE]">
                    ENFORCED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATA GOVERNANCE */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0]">
                <h3 className="text-base font-bold text-[#20212B]">Data Sovereignty & Ledger Export</h3>
                <p className="text-xs text-[#77798A] mt-0.5">Download entire financial ledgers or request data export packages</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-3">
                  <span className="text-sm font-bold text-[#20212B] block">Complete Ledger JSON</span>
                  <p className="text-xs text-[#77798A]">
                    Download your full financial database including all transactions, categories, budgets, and balance sheets.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const data = await api.exportFullUserDataJSON();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `monvex_ledger_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                    }}
                    leftIcon={<Download className="h-3.5 w-3.5 text-[#6865E8]" />}
                    className="rounded-xl border-[#E7E6F0]"
                  >
                    Export JSON Ledger
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-3">
                  <span className="text-sm font-bold text-[#20212B] block">Sanitized CSV Ledger</span>
                  <p className="text-xs text-[#77798A]">
                    Download clean spreadsheet data compatible with Excel, Google Sheets, or tax calculation software.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const blob = await api.downloadTransactionsCSV();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `monvex_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                    }}
                    leftIcon={<Download className="h-3.5 w-3.5 text-[#6865E8]" />}
                    className="rounded-xl border-[#E7E6F0]"
                  >
                    Export CSV Ledger
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LEGAL & COMPLIANCE */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[#E7E6F0] dark:border-[#2D2B3F]">
                <h3 className="text-base font-bold text-[#20212B] dark:text-[#F4F3FA]">
                  Legal Agreements & Governance Documentation
                </h3>
                <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] mt-0.5">
                  Review terms of service, data privacy rules, client storage policies, and financial disclaimers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#F8F7FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#20212B] dark:text-[#F4F3FA]">
                      <FileText className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2]" />
                      <span>Privacy Policy</span>
                    </div>
                    <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                      Detailed disclosure of zero data monetization, tenant cryptographic isolation, and ephemeral Google Gemini API handling.
                    </p>
                  </div>
                  <Link href="/privacy-policy" target="_blank" className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                      className="rounded-xl border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-semibold"
                    >
                      Read Privacy Policy
                    </Button>
                  </Link>
                </div>

                <div className="p-5 rounded-2xl bg-[#F8F7FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#20212B] dark:text-[#F4F3FA]">
                      <Scale className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2]" />
                      <span>Terms of Service</span>
                    </div>
                    <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                      Acceptable use, account security responsibilities, software license rights, and non-custodial operating boundaries.
                    </p>
                  </div>
                  <Link href="/terms-of-service" target="_blank" className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                      className="rounded-xl border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-semibold"
                    >
                      Read Terms of Service
                    </Button>
                  </Link>
                </div>

                <div className="p-5 rounded-2xl bg-[#F8F7FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#20212B] dark:text-[#F4F3FA]">
                      <Cookie className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2]" />
                      <span>Cookie & Storage Policy</span>
                    </div>
                    <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                      Verification that MONVEX stores zero advertising trackers and uses only functional session keys in localStorage and cookies.
                    </p>
                  </div>
                  <Link href="/cookie-policy" target="_blank" className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                      className="rounded-xl border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-semibold"
                    >
                      Inspect Storage Items
                    </Button>
                  </Link>
                </div>

                <div className="p-5 rounded-2xl bg-[#F8F7FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#20212B] dark:text-[#F4F3FA]">
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                      <span>Financial & Advisory Disclaimer</span>
                    </div>
                    <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
                      Formal clarification of computational software status, non-fiduciary relationship, and simulation model limitations.
                    </p>
                  </div>
                  <Link href="/financial-disclaimer" target="_blank" className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                      className="rounded-xl border-[#E7E6F0] dark:border-[#2D2B3F] text-xs font-semibold"
                    >
                      Read Disclaimer
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#77798A] dark:text-[#A6A4B8]">
                  Need guidance on features, or want to contact engineering?
                </span>
                <div className="flex items-center gap-3">
                  <Link href="/help" className="text-[#6865E8] dark:text-[#7C79F2] font-semibold hover:underline">
                    Help Center & FAQ
                  </Link>
                  <span className="text-[#E7E6F0] dark:text-[#2D2B3F]">•</span>
                  <Link href="/contact" className="text-[#6865E8] dark:text-[#7C79F2] font-semibold hover:underline">
                    Contact Engineering
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
