'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Github,
  MessageSquare,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<{ submissionId?: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Please provide your full name.';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Please provide a valid email address.';
    if (!message.trim() || message.trim().length < 10) {
      errors.message = 'Please provide a message with at least 10 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepend category if chosen
      const formattedMessage = `[Category: ${category}]\n\n${message.trim()}`;
      const res = await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: formattedMessage,
      });

      if (res.success) {
        setSubmittedData({
          submissionId: res.submission_id,
          message: res.message || 'Your message has been safely delivered.',
        });
        // Clear inputs
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        setErrorMsg(res.message || 'Failed to submit contact request.');
      }
    } catch (err: any) {
      if (err?.message?.includes('Too many contact requests') || err?.status === 429) {
        setErrorMsg('Too many contact requests submitted from your IP address. Please wait a few minutes before trying again.');
      } else if (err?.errors) {
        setFieldErrors(err.errors);
        setErrorMsg('Please correct the highlighted form errors.');
      } else {
        setErrorMsg(err?.message || 'An unexpected error occurred while delivering your message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageShell
      eyebrow="SUPPORT & ENGINEERING DISPATCH"
      title="Contact MONVEX"
      description="Direct communication with creator Danish Ansari and the engineering team for inquiries, bug reports, and feedback."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Info Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-card space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2] flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#20212B] dark:text-[#F4F3FA]">
                  Direct Engineering Inbox
                </h3>
                <span className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
                  Personal oversight on every message
                </span>
              </div>
            </div>

            <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
              MONVEX is developed and maintained by Danish Ansari (Drix). Whether you have a question about double-entry mathematics, discovered an edge-case bug, or want to discuss enterprise licensing, we read and respond to every verified message.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F]">
                <Clock className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2] shrink-0" />
                <div>
                  <span className="font-semibold text-[#20212B] dark:text-[#F4F3FA] block">Turnaround Time</span>
                  <span className="text-[#77798A] dark:text-[#A6A4B8]">Typically within 24 to 48 business hours</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F]">
                <Mail className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2] shrink-0" />
                <div>
                  <span className="font-semibold text-[#20212B] dark:text-[#F4F3FA] block">Direct Email</span>
                  <a
                    href="mailto:danishansari6876@gmail.com"
                    className="text-[#6865E8] dark:text-[#7C79F2] hover:underline font-mono"
                  >
                    danishansari6876@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F]">
                <Github className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2] shrink-0" />
                <div>
                  <span className="font-semibold text-[#20212B] dark:text-[#F4F3FA] block">GitHub Repository</span>
                  <a
                    href="https://github.com/danishansari6876"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#6865E8] dark:text-[#7C79F2] hover:underline font-mono"
                  >
                    github.com/danishansari6876
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#EEEDF8] dark:bg-[#23213B] border border-[#6865E8]/20 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#20212B] dark:text-[#F4F3FA]">
              <ShieldCheck className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2]" />
              <span>Reporting a Security Vulnerability?</span>
            </div>
            <p className="text-[#77798A] dark:text-[#A6A4B8] leading-relaxed">
              If reporting a cryptographic, authorization, or injection vulnerability, please select &ldquo;Security Vulnerability Disclosure&rdquo; in the subject selector so our system prioritizes your ticket.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Contact Form (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] shadow-elevated">
            {submittedData ? (
              <div className="py-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-[#20212B] dark:text-[#F4F3FA]">
                    Message Transmitted Successfully!
                  </h3>
                  <p className="text-xs text-[#77798A] dark:text-[#A6A4B8] max-w-md mx-auto leading-relaxed">
                    {submittedData.message}
                  </p>
                </div>

                {submittedData.submissionId && (
                  <div className="inline-block px-3 py-1.5 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] font-mono text-xs text-[#77798A] dark:text-[#A6A4B8]">
                    Tracking ID: <span className="font-bold text-[#6865E8] dark:text-[#7C79F2]">{submittedData.submissionId}</span>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setSubmittedData(null)}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Send Another Message
                  </Button>
                  <Link href="/">
                    <Button
                      variant="primary"
                      size="md"
                      className="bg-[#6865E8] text-white rounded-xl text-xs font-bold"
                    >
                      Return to Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1 pb-2 border-b border-[#E7E6F0] dark:border-[#2D2B3F]">
                  <h3 className="font-bold text-base text-[#20212B] dark:text-[#F4F3FA]">
                    Dispatch a Message
                  </h3>
                  <p className="text-xs text-[#77798A] dark:text-[#A6A4B8]">
                    Fill in your details below and our backend will route your request directly to engineering.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA]">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77798A] dark:text-[#A6A4B8]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Danish Ansari"
                        disabled={isSubmitting}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border text-xs text-[#20212B] dark:text-[#F4F3FA] placeholder:text-[#77798A] dark:placeholder:text-[#A6A4B8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/40 ${
                          fieldErrors.name
                            ? 'border-rose-400 dark:border-rose-500'
                            : 'border-[#E7E6F0] dark:border-[#2D2B3F]'
                        }`}
                      />
                    </div>
                    {fieldErrors.name && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.name}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA]">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77798A] dark:text-[#A6A4B8]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        disabled={isSubmitting}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border text-xs text-[#20212B] dark:text-[#F4F3FA] placeholder:text-[#77798A] dark:placeholder:text-[#A6A4B8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/40 ${
                          fieldErrors.email
                            ? 'border-rose-400 dark:border-rose-500'
                            : 'border-[#E7E6F0] dark:border-[#2D2B3F]'
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <span className="text-[11px] text-rose-500">{fieldErrors.email}</span>
                    )}
                  </div>
                </div>

                {/* Phone & Subject Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA]">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77798A] dark:text-[#A6A4B8]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs text-[#20212B] dark:text-[#F4F3FA] placeholder:text-[#77798A] dark:placeholder:text-[#A6A4B8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA]">
                      Topic Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border border-[#E7E6F0] dark:border-[#2D2B3F] text-xs text-[#20212B] dark:text-[#F4F3FA] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/40 cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support / Bug Report</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Security Vulnerability Disclosure">Security Vulnerability Disclosure</option>
                      <option value="Feedback & Collaboration">Feedback & Collaboration</option>
                    </select>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#20212B] dark:text-[#F4F3FA]">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your inquiry, bug scenario, or questions regarding MONVEX..."
                    disabled={isSubmitting}
                    className={`w-full p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#151421] border text-xs text-[#20212B] dark:text-[#F4F3FA] placeholder:text-[#77798A] dark:placeholder:text-[#A6A4B8] focus:outline-none focus:ring-2 focus:ring-[#6865E8]/40 resize-none ${
                      fieldErrors.message
                        ? 'border-rose-400 dark:border-rose-500'
                        : 'border-[#E7E6F0] dark:border-[#2D2B3F]'
                    }`}
                  />
                  {fieldErrors.message && (
                    <span className="text-[11px] text-rose-500">{fieldErrors.message}</span>
                  )}
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  leftIcon={!isSubmitting && <Send className="h-4 w-4" />}
                  className="w-full bg-[#6865E8] hover:bg-[#5754DC] text-white font-bold rounded-2xl shadow-sm text-xs min-h-[44px]"
                >
                  {isSubmitting ? 'Transmitting Message...' : 'Transmit Message to Engineering'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
