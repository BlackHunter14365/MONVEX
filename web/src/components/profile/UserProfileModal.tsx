'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  Check,
  Trash2,
  Save,
  Phone,
  Mail,
  Palette,
  Key,
  LogOut,
  ExternalLink,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'pres_1', label: 'Executive', bg: 'from-blue-600 to-indigo-900', emoji: '💼' },
  { id: 'pres_2', label: 'Tech Lead', bg: 'from-emerald-500 to-teal-800', emoji: '⚡' },
  { id: 'pres_3', label: 'Investor', bg: 'from-amber-500 to-orange-800', emoji: '📈' },
  { id: 'pres_4', label: 'Cryptographer', bg: 'from-purple-600 to-indigo-950', emoji: '🛡️' },
  { id: 'pres_5', label: 'FIRE Builder', bg: 'from-rose-500 to-red-900', emoji: '🔥' },
  { id: 'pres_6', label: 'Minimalist', bg: 'from-slate-700 to-slate-950', emoji: '🏛️' },
];

const ACCENT_COLORS = [
  { id: 'obsidian', name: 'Obsidian Navy', hex: '#172033', bgClass: 'bg-[#172033]' },
  { id: 'sapphire', name: 'Cyber Sapphire', hex: '#2563EB', bgClass: 'bg-[#2563EB]' },
  { id: 'emerald', name: 'Emerald Wealth', hex: '#059669', bgClass: 'bg-[#059669]' },
  { id: 'amber', name: 'Royal Amber', hex: '#D97706', bgClass: 'bg-[#D97706]' },
  { id: 'rose', name: 'Velvet Rose', hex: '#E11D48', bgClass: 'bg-[#E11D48]' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('Building long-term financial sovereignty 🚀');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('obsidian');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load Initial Saved Profile State
  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhoneNumber(user.phone_number || '');

      try {
        // 1. Check Full Saved Profile Object
        const fullSaved = localStorage.getItem(`monvex_user_profile_${user.username}`);
        if (fullSaved) {
          const parsed = JSON.parse(fullSaved);
          if (parsed.firstName) setFirstName(parsed.firstName);
          if (parsed.lastName) setLastName(parsed.lastName);
          if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.theme) setSelectedTheme(parsed.theme);
        }

        // 2. Check Saved Avatar
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
      } catch {
        // ignore
      }

      setHasUnsavedChanges(false);
      setSaveSuccess(false);
    }
  }, [user, isOpen]);

  // Handle Photo Upload from file picker
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
      setHasUnsavedChanges(true);

      // Auto-cache to local storage for instant feedback
      if (user) {
        localStorage.setItem(`monvex_avatar_${user.username}`, base64);
        window.dispatchEvent(new Event('monvex:profile-updated'));
      }
      toast.info('Photo preview loaded. Click "Save Profile" to make it permanent.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_AVATARS[0]) => {
    setSelectedPreset(preset.id);
    setAvatarImage(null);
    setHasUnsavedChanges(true);

    if (user) {
      localStorage.setItem(`monvex_avatar_${user.username}`, JSON.stringify(preset));
      window.dispatchEvent(new Event('monvex:profile-updated'));
    }
    toast.info(`Selected "${preset.label}" preset style.`);
  };

  const handleRemovePhoto = () => {
    setAvatarImage(null);
    setSelectedPreset(null);
    setHasUnsavedChanges(true);

    if (user) {
      localStorage.removeItem(`monvex_avatar_${user.username}`);
      window.dispatchEvent(new Event('monvex:profile-updated'));
    }
    toast.success('Avatar reset to default initials.');
  };

  const executeSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Persist to Backend API (Database)
      await api.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        theme: selectedTheme,
      });

      // 2. Persist to LocalStorage (Permanent Client Store)
      if (user) {
        if (avatarImage) {
          localStorage.setItem(`monvex_avatar_${user.username}`, avatarImage);
          localStorage.setItem('monvex_avatar_active', avatarImage);
        } else if (selectedPreset) {
          const pres = PRESET_AVATARS.find((p) => p.id === selectedPreset);
          if (pres) {
            localStorage.setItem(`monvex_avatar_${user.username}`, JSON.stringify(pres));
          }
        } else {
          localStorage.removeItem(`monvex_avatar_${user.username}`);
        }

        const profileRecord = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
          bio: bio.trim(),
          theme: selectedTheme,
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem(`monvex_user_profile_${user.username}`, JSON.stringify(profileRecord));
        localStorage.setItem(`monvex_bio_${user.username}`, bio.trim());
        localStorage.setItem(`monvex_theme_${user.username}`, selectedTheme);
      }

      // 3. Refresh user Context & Dispatch global update
      await refreshUser();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('monvex:profile-updated'));
      }

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      toast.success('✓ Profile changes saved permanently!');

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = `${firstName} ${lastName}`.trim() || user?.username || 'User';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile Setup & Customization"
      subtitle="Your changes are saved permanently to your account and device."
      maxWidth="lg"
    >
      <form onSubmit={executeSave} className="space-y-5">
        {/* Sticky Unsaved Notice / Quick Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC]">
          <div className="flex items-center gap-2">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>All changes saved permanently!</span>
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#D97706]">
                <AlertCircle className="h-4 w-4 text-[#D97706]" />
                <span>Unsaved changes detected</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                <ShieldCheck className="h-4 w-4 text-[#059669]" />
                <span>Account Profile Active & Synced</span>
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="h-3.5 w-3.5" />}
            className="text-xs shadow-sm bg-[#172033] hover:bg-[#0F172A]"
          >
            Save Profile
          </Button>
        </div>

        {/* 1. Master Avatar Customizer */}
        <div className="p-5 rounded-2xl bg-white/90 border border-[#E4E2DC] shadow-sm space-y-4">
          <span className="swiss-eyebrow block">1. Profile Photo & Executive Avatar</span>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar Preview Surface */}
            <div className="relative group shrink-0">
              <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-[#172033] flex items-center justify-center text-white text-2xl font-black relative ring-2 ring-slate-900/10">
                {avatarImage ? (
                  <img src={avatarImage} alt={displayName} className="h-full w-full object-cover" />
                ) : selectedPreset ? (
                  <div
                    className={cn(
                      'h-full w-full flex items-center justify-center text-3xl bg-gradient-to-br',
                      PRESET_AVATARS.find((p) => p.id === selectedPreset)?.bg
                    )}
                  >
                    {PRESET_AVATARS.find((p) => p.id === selectedPreset)?.emoji}
                  </div>
                ) : (
                  <span className="uppercase">{user?.username?.slice(0, 1) || 'U'}</span>
                )}
              </div>

              {/* Upload trigger overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#172033] text-white shadow-md hover:bg-[#2563EB] transition-all hover:scale-110"
                title="Upload Photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Upload & Reset Buttons */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  Upload custom photo
                </Button>

                {(avatarImage || selectedPreset) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 text-xs font-semibold text-[#E11D48] hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Reset to default</span>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-[#858D9A] block">
                Supports JPG, PNG, WEBP up to 5MB. Persists permanently in your profile.
              </span>
            </div>
          </div>

          {/* Preset Avatars Gallery */}
          <div className="space-y-2 pt-3 border-t border-[#E4E2DC]/80">
            <span className="text-xs font-bold text-[#172033] block">Or choose a 3D preset style:</span>
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
        </div>

        {/* 2. Personal Identity & Bio */}
        <div className="p-5 rounded-2xl bg-white/90 border border-[#E4E2DC] shadow-sm space-y-4">
          <span className="swiss-eyebrow block">2. Personal Information</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="e.g. Demon"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-semibold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="e.g. 68"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-semibold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Primary Phone</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-semibold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033] mb-1 block">Verified Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] px-3.5 py-2 text-xs font-bold text-[#858D9A] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033] mb-1 block">Personal Tagline / Status Bio</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="e.g. Financial Freedom Builder • Portfolio Target ₹1 Cr"
              className="w-full rounded-xl bg-white border border-[#E4E2DC] px-3.5 py-2 text-xs font-semibold text-[#172033] focus:border-[#172033] focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* 3. Workspace Accent Theme */}
        <div className="p-5 rounded-2xl bg-white/90 border border-[#E4E2DC] shadow-sm space-y-3">
          <span className="swiss-eyebrow block">3. Workspace Theme Accent</span>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {ACCENT_COLORS.map((c) => {
              const isSel = selectedTheme === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(c.id);
                    setHasUnsavedChanges(true);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold whitespace-nowrap',
                    isSel
                      ? 'border-[#172033] bg-[#172033] text-white shadow-sm'
                      : 'border-[#E4E2DC] bg-white text-[#5F6878] hover:text-[#172033]'
                  )}
                >
                  <span className={cn('h-3.5 w-3.5 rounded-full shadow-xs', c.bgClass)} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Prominent Sticky Action Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-4 -mx-1 -mb-1 rounded-2xl border-t border-[#E4E2DC] shadow-lg flex items-center justify-between z-20">
          <Link
            href="/settings"
            onClick={onClose}
            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>Advanced System Settings</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              className="bg-[#172033] hover:bg-[#0F172A] text-white font-bold px-5 shadow-md"
            >
              {saveSuccess ? 'Saved ✓' : 'Save & Apply Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
