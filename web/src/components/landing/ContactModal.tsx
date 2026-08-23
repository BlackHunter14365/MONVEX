'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, Mail, User, Phone, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const titleId = useId();
  const subtitleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management & Escape key listener
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      // Auto focus first input on open
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    } else {
      // Restore focus on close
      previousActiveElementRef.current?.focus();
    }
  }, [isOpen, onClose]);

  // Reset form when opened anew if already submitted
  useEffect(() => {
    if (isOpen && submitSuccess) {
      setSubmitSuccess(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTouched({});
      setErrors({});
      setServerError(null);
    }
  }, [isOpen]);

  const validateField = (field: string, value: string) => {
    let err = '';
    const trimmed = value.trim();

    if (field === 'name') {
      if (!trimmed) {
        err = 'Please enter your name.';
      } else if (trimmed.length < 2) {
        err = 'Name must be at least 2 characters long.';
      }
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed) {
        err = 'Please enter your email address.';
      } else if (!emailRegex.test(trimmed)) {
        err = 'Please enter a valid email address.';
      }
    } else if (field === 'phone') {
      if (trimmed) {
        const cleanPhone = trimmed.replace(/[\s\-\(\)]/g, '');
        if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
          err = 'Please enter a valid phone number.';
        }
      }
    } else if (field === 'message') {
      if (!trimmed) {
        err = 'Please enter a message.';
      } else if (trimmed.length < 10) {
        err = 'Message must be at least 10 characters long.';
      }
    }

    return err;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);

    if (touched[name]) {
      const errorMsg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched and validate all
    const newTouched = { name: true, email: true, phone: true, message: true };
    setTouched(newTouched);

    const newErrors: Record<string, string> = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      message: validateField('message', formData.message),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((msg) => msg.length > 0);
    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await api.submitContact(formData);
      setSubmitSuccess(true);
    } catch (err: any) {
      const msg = err.message || 'Something went wrong while sending your message. Please try again.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F0EFEA] bg-[#FAFAF8]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
              <h2 id={titleId} className="text-lg font-black text-[#172033] tracking-tight">
                Let's Talk
              </h2>
            </div>
            <p id={subtitleId} className="text-xs text-[#5F6878] leading-relaxed">
              Have a question, project idea, collaboration opportunity, or feedback about MONVEX? Send a message.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#858D9A] hover:text-[#172033] hover:bg-[#E5E7EB]/50 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#172033]"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submitSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="h-14 w-14 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#172033]">Message sent successfully.</h3>
                <p className="text-xs text-[#5F6878] max-w-xs mx-auto leading-relaxed">
                  Thanks for reaching out. I’ll review your message and get back to you soon.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#172033] hover:bg-[#0F172A] text-xs font-bold text-white shadow-xs transition-all active:translate-y-[1px]"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {serverError && (
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-xs font-bold text-[#172033]">
                  Name <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#858D9A]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    ref={nameInputRef}
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Danish Ansari"
                    disabled={isSubmitting}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-[#FFFFFF] text-[#172033] placeholder-[#858D9A] transition-colors focus:outline-hidden focus:ring-2 ${
                      errors.name && touched.name
                        ? 'border-[#E11D48] focus:ring-[#E11D48]/30 bg-[#FFF1F2]/20'
                        : 'border-[#E5E7EB] focus:border-[#172033] focus:ring-[#172033]/15'
                    }`}
                  />
                </div>
                {errors.name && touched.name && (
                  <p className="text-[11px] font-semibold text-[#E11D48] flex items-center gap-1">
                    <span>•</span> {errors.name}
                  </p>
                )}
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-bold text-[#172033]">
                    Email <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#858D9A]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="danish@example.com"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-[#FFFFFF] text-[#172033] placeholder-[#858D9A] transition-colors focus:outline-hidden focus:ring-2 ${
                        errors.email && touched.email
                          ? 'border-[#E11D48] focus:ring-[#E11D48]/30 bg-[#FFF1F2]/20'
                          : 'border-[#E5E7EB] focus:border-[#172033] focus:ring-[#172033]/15'
                      }`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-[11px] font-semibold text-[#E11D48] flex items-center gap-1">
                      <span>•</span> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-phone" className="block text-xs font-bold text-[#172033]">
                    Phone Number <span className="text-[10px] font-normal text-[#858D9A]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#858D9A]">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="+91 9876543210"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs bg-[#FFFFFF] text-[#172033] placeholder-[#858D9A] transition-colors focus:outline-hidden focus:ring-2 ${
                        errors.phone && touched.phone
                          ? 'border-[#E11D48] focus:ring-[#E11D48]/30 bg-[#FFF1F2]/20'
                          : 'border-[#E5E7EB] focus:border-[#172033] focus:ring-[#172033]/15'
                      }`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="text-[11px] font-semibold text-[#E11D48] flex items-center gap-1">
                      <span>•</span> {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-bold text-[#172033]">
                  Description / Message <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tell me what you'd like to discuss..."
                    disabled={isSubmitting}
                    className={`w-full p-3 rounded-xl border text-xs bg-[#FFFFFF] text-[#172033] placeholder-[#858D9A] transition-colors resize-none focus:outline-hidden focus:ring-2 ${
                      errors.message && touched.message
                        ? 'border-[#E11D48] focus:ring-[#E11D48]/30 bg-[#FFF1F2]/20'
                        : 'border-[#E5E7EB] focus:border-[#172033] focus:ring-[#172033]/15'
                    }`}
                  />
                </div>
                {errors.message && touched.message && (
                  <p className="text-[11px] font-semibold text-[#E11D48] flex items-center gap-1">
                    <span>•</span> {errors.message}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EFEA]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F7F7F4] text-xs font-bold text-[#5F6878] hover:text-[#172033] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#172033] hover:bg-[#0F172A] text-xs font-bold text-white shadow-xs transition-all active:translate-y-[1px] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
