'use client';

import React from 'react';
import Link from 'next/link';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import {
  Cookie,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  Layers,
  Info,
  Sliders,
} from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <PublicPageShell
      eyebrow="TRANSPARENT CLIENT STORAGE"
      title="Cookie & Storage Policy"
      description="An exact, technical disclosure of how MONVEX uses HTTP cookies and browser localStorage."
      lastUpdated="October 2026"
    >
      <div className="space-y-10 text-sm leading-relaxed text-[#20212B] dark:text-[#F4F3FA]">
        {/* Anti-Tracking Guarantee Callout */}
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-white dark:bg-[#1B1A2A] text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
              Zero Third-Party Advertising Trackers
            </h3>
            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
              MONVEX has <strong>never</strong> installed Google Analytics, Meta Pixels, ad network cookies, or cross-site tracking beacons. We store only essential state items required to render your user interface and secure your session.
            </p>
          </div>
        </div>

        {/* Section 1: Distinction */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">1.</span> Cookies vs. Local Storage
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            Many websites misleadingly call all client-side data &ldquo;cookies.&rdquo; At MONVEX, we believe in architectural honesty and distinguish clearly between <strong>HTTP Cookies</strong> and <strong>Browser Local Storage</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-1.5">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-1.5">
                <Cookie className="h-4 w-4 text-[#6865E8] dark:text-[#7C79F2]" />
                HTTP Cookies
              </span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Small headers transmitted with HTTP requests. In MONVEX, we use exactly one first-party cookie to maintain sidebar layout preference during server-side rendering (SSR), preventing visual flicker on reload.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] space-y-1.5">
              <span className="font-bold text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Browser LocalStorage
              </span>
              <p className="text-[#77798A] dark:text-[#A6A4B8]">
                Key-value data stored strictly on your device. LocalStorage data is never automatically transmitted over the network on every HTTP request and remains isolated to the <code className="font-mono text-[11px]">monvex.app</code> domain.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Complete Inventory */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">2.</span> Exhaustive Inventory of Client Storage
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            Below is the complete, verifiable list of every cookie and storage key used in the MONVEX application:
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[#E7E6F0] dark:border-[#2D2B3F] bg-white dark:bg-[#1B1A2A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FC] dark:bg-[#151421] border-b border-[#E7E6F0] dark:border-[#2D2B3F] text-[#20212B] dark:text-[#F4F3FA]">
                <tr>
                  <th className="py-3 px-4 font-bold">Identifier</th>
                  <th className="py-3 px-4 font-bold">Storage Type</th>
                  <th className="py-3 px-4 font-bold">Classification</th>
                  <th className="py-3 px-4 font-bold">Technical Description</th>
                  <th className="py-3 px-4 font-bold">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E6F0] dark:divide-[#2D2B3F] text-[#77798A] dark:text-[#A6A4B8]">
                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-[#6865E8] dark:text-[#7C79F2]">monvex-sidebar-collapsed</td>
                  <td className="py-3 px-4 font-mono">Cookie</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2]">
                      Functional (First-party)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Stores whether the desktop sidebar is expanded or collapsed so Next.js App Router renders the matching width on page reload with <code className="font-mono text-[10px]">SameSite=Lax</code>.
                  </td>
                  <td className="py-3 px-4">1 Year</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-[#6865E8] dark:text-[#7C79F2]">monvex_auth_session</td>
                  <td className="py-3 px-4 font-mono">localStorage</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                      Strictly Necessary
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Contains your authenticated cryptographic JWT session token (access token, refresh token) and cached user identity profile.
                  </td>
                  <td className="py-3 px-4">Until Explicit Sign Out</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-[#6865E8] dark:text-[#7C79F2]">monvex-theme</td>
                  <td className="py-3 px-4 font-mono">localStorage</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2]">
                      Preference
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Stores your visual display preference (<code className="font-mono text-[10px]">&quot;light&quot;</code> or <code className="font-mono text-[10px]">&quot;dark&quot;</code>) to prevent theme flashing during initial paint.
                  </td>
                  <td className="py-3 px-4">Persistent</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-[#6865E8] dark:text-[#7C79F2]">monvex-sidebar-collapsed</td>
                  <td className="py-3 px-4 font-mono">localStorage</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEEDF8] dark:bg-[#23213B] text-[#6865E8] dark:text-[#7C79F2]">
                      Functional
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Client-side mirror of sidebar width preference for instantaneous layout hydration.
                  </td>
                  <td className="py-3 px-4">Persistent</td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-mono font-semibold text-[#6865E8] dark:text-[#7C79F2]">monvex_last_activity_ts</td>
                  <td className="py-3 px-4 font-mono">localStorage</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                      Security
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Records the unix epoch of the last user interaction to enforce configured auto-lock and inactivity session timeouts.
                  </td>
                  <td className="py-3 px-4">Updated on Interaction</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: What We Do NOT Store */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">3.</span> What We NEVER Store
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            To protect your privacy and reduce attack surfaces, we explicitly refuse to load:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="text-[#20212B] dark:text-[#F4F3FA]">No advertising or retargeting cookies</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="text-[#20212B] dark:text-[#F4F3FA]">No third-party cross-site trackers</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="text-[#20212B] dark:text-[#F4F3FA]">No session recording or keystroke replay tools</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1B1A2A] border border-[#E7E6F0] dark:border-[#2D2B3F] flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="text-[#20212B] dark:text-[#F4F3FA]">No social network data-mining widgets</span>
            </div>
          </div>
        </section>

        {/* Section 4: How to Manage */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#20212B] dark:text-[#F4F3FA] flex items-center gap-2">
            <span className="text-[#6865E8] dark:text-[#7C79F2]">4.</span> Managing & Clearing Client Storage
          </h2>
          <p className="text-[#77798A] dark:text-[#A6A4B8]">
            You have full authority to purge stored credentials and settings:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-[#77798A] dark:text-[#A6A4B8]">
            <li>
              <strong>Instant Log Out:</strong> Clicking &ldquo;Sign Out&rdquo; in the MONVEX top navigation or sidebar immediately purges <code className="font-mono text-[10px]">monvex_auth_session</code> and revokes the active JWT tokens.
            </li>
            <li>
              <strong>Browser DevTools:</strong> You can inspect and delete all items at any time in your browser by pressing <kbd className="px-1.5 py-0.5 rounded bg-[#EEEDF8] dark:bg-[#23213B] font-mono text-[10px]">F12</kbd> &rarr; Application &rarr; Local Storage &amp; Cookies.
            </li>
          </ul>
        </section>

        {/* Inquiries */}
        <section className="pt-4 border-t border-[#E7E6F0] dark:border-[#2D2B3F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-[#77798A] dark:text-[#A6A4B8]">
            Have technical questions about our client storage footprint?
          </span>
          <Link
            href="/contact"
            className="text-[#6865E8] dark:text-[#7C79F2] font-semibold hover:underline"
          >
            Contact engineering team &rarr;
          </Link>
        </section>
      </div>
    </PublicPageShell>
  );
}
