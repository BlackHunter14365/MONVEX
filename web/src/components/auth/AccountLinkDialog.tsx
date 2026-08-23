'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface AccountLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  credential: string;
  onSuccess: () => void;
}

export const AccountLinkDialog: React.FC<AccountLinkDialogProps> = ({
  isOpen,
  onClose,
  email,
  credential,
  onSuccess,
}) => {
  const { linkGoogleAccount } = useAuth();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      await linkGoogleAccount({
        credential,
        password,
      });

      toast.success('✓ Google account securely connected to your MONVEX account!');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect password. Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Google Sign-In"
      subtitle="Verify ownership of your existing MONVEX account"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
            <ShieldCheck className="h-4 w-4 text-[#059669]" />
            <span>Existing MONVEX Account Detected</span>
          </div>
          <p className="text-xs text-[#5F6878] leading-relaxed">
            The email <strong className="text-[#172033]">{email}</strong> is already registered. Enter your password to securely link Google Sign-In to this account.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#FFF1F2] text-[#E11D48] text-xs border border-[#FECDD3] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#E11D48] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#5F6878] mb-1.5 block">
              MONVEX Account Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858D9A]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter existing password"
                className="w-full rounded-xl bg-[#F6F5F1] border border-[#E4E2DC] pl-10 pr-10 py-2.5 text-xs font-medium text-[#172033] placeholder:text-[#858D9A] focus:border-[#172033] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#858D9A] hover:text-[#172033]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E2DC]">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isLoading}
              className="bg-[#172033] hover:bg-[#0F172A] text-white text-xs font-bold"
            >
              Verify &amp; Link Google
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
