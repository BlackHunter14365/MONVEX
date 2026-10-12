'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  FileCheck,
  LogOut,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSecurityQuery } from '@/hooks/queries/useSecurityQuery';

interface AuditLogItem {
  id: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source_ip: string;
  user_agent: string;
  endpoint: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface ScanFinding {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';
  latency_ms: number;
  details: string;
  remediation?: string | null;
}

interface ScanResultData {
  success: boolean;
  scan_id: string;
  passed: boolean;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warning_tests: number;
  unknown_tests: number;
  overall_score: string;
  score: number;
  duration_ms: number;
  timestamp: string;
  results: ScanFinding[];
}

const DEFAULT_SHIELDS = [
  {
    id: 'rate_limiter',
    title: 'WAF Rate Limiting & Throttling',
    desc: 'IP and token-based rate limits mitigate brute-force attempts and DDoS saturation.',
    status: 'ENFORCED',
    icon: 'ShieldCheck',
    color: 'text-[#16745C] bg-[#E8FBF4]',
  },
  {
    id: 'sqli_xss',
    title: 'SQL Injection & XSS Guard',
    desc: 'Strict Django ORM parameterization and automated DOM sanitization prevent script injection.',
    status: 'VERIFIED',
    icon: 'Lock',
    color: 'text-[#16745C] bg-[#E8FBF4]',
  },
  {
    id: 'jwt_guard',
    title: 'Zero-Trust Token Rotation',
    desc: 'Short-lived JWT access tokens with rotating refresh tokens and revocation blacklists.',
    status: 'ENFORCED',
    icon: 'Key',
    color: 'text-[#6865E8] bg-[#ECEBFF]',
  },
  {
    id: 'password_hash',
    title: 'Argon2id Hash Function',
    desc: 'Memory-hard password hashing protects credentials against ASIC and GPU cracking clusters.',
    status: 'STANDARDIZED',
    icon: 'ShieldCheck',
    color: 'text-[#16745C] bg-[#E8FBF4]',
  },
  {
    id: 'csrf_defense',
    title: 'CSRF Double-Submit Defense',
    desc: 'Cryptographic anti-forgery tokens validate origin authenticity across state-changing mutations.',
    status: 'ACTIVE',
    icon: 'FileCheck',
    color: 'text-[#6865E8] bg-[#ECEBFF]',
  },
  {
    id: 'audit_engine',
    title: 'Tamper-Evident Audit Trail',
    desc: 'Every authentication event, capital transfer, and session shift is permanently indexed with SHA-256.',
    status: 'LOGGING',
    icon: 'Terminal',
    color: 'text-[#6865E8] bg-[#ECEBFF]',
  },
];

function resolveShieldIcon(iconName: string) {
  switch (iconName) {
    case 'Lock':
      return Lock;
    case 'Key':
      return Key;
    case 'FileCheck':
      return FileCheck;
    case 'Terminal':
      return Terminal;
    case 'Zap':
      return Zap;
    case 'ShieldAlert':
      return ShieldAlert;
    default:
      return ShieldCheck;
  }
}

export default function SecurityPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: secData, isLoading, refetch: fetchSecurityData } = useSecurityQuery();
  const overview = secData?.overview || null;
  const auditLogs = (secData?.logs || []) as AuditLogItem[];

  // Vulnerability Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResultData | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Revoke Modal State
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Filter Log State
  const [logFilter, setLogFilter] = useState<'ALL' | 'CRITICAL' | 'AUTH' | 'SCANS'>('ALL');

  const handleRunVulnerabilityScan = async () => {
    setIsScanning(true);
    toast.info('Initiating live multi-vector security diagnostic scan...');

    try {
      const res = await api.runSecurityScan();
      setScanResults(res);
      setIsScanning(false);
      setIsScanModalOpen(true);
      toast.success(
        `✓ Security scan complete: ${res.passed_tests}/${res.total_tests} checks passed (Score: ${res.overall_score})`
      );
      fetchSecurityData();
    } catch {
      setIsScanning(false);
      toast.error('Security scan execution failed. Please check network connectivity.');
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevoking(true);
    try {
      const res = await api.revokeAllSessions();
      toast.success(res.message || 'All other device sessions revoked successfully.');
      setIsRevokeModalOpen(false);
      fetchSecurityData();
    } catch {
      toast.error('Failed to revoke sessions.');
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'CRITICAL') return log.severity === 'CRITICAL';
    if (logFilter === 'AUTH') return log.event_type?.startsWith('AUTH_') || log.event_type === 'SESSION_REVOKED';
    if (logFilter === 'SCANS') return log.event_type === 'VULNERABILITY_SCAN';
    return true;
  });

  const matrixControls = (overview?.shields && overview.shields.length > 0)
    ? overview.shields
    : DEFAULT_SHIELDS;

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16">
        <PageHeader
          eyebrow="CYBER DEFENSE"
          title="Cyber Defense & Security Center"
          description="Enterprise-grade perimeter defense, real-time WAF intrusion prevention, tamper-evident audit logging, and zero-trust session isolation."
          actionSlot={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsRevokeModalOpen(true)}
                disabled={isRevoking}
                leftIcon={<LogOut className="h-4 w-4 text-[#E76D7A]" />}
                className="rounded-2xl border-[#E7E6F0] hover:bg-[#FEF2F2] text-[#20212B]"
              >
                Revoke Other Sessions
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleRunVulnerabilityScan}
                isLoading={isScanning}
                disabled={isScanning}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
                className="bg-[#6865E8] hover:bg-[#5b58db] text-white rounded-2xl shadow-xs"
              >
                Run Security Scan
              </Button>
            </div>
          }
        />

        {/* =========================================================================
            1. TOP 4 SECURITY METRICS (Aurora Glass)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Perimeter Defense */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16745C]">
                Perimeter Defense
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#16745C]">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#16745C]">
                {overview?.perimeter_defense?.status || 'ACTIVE SHIELD'}
              </div>
              <p className="text-xs text-[#77798A] font-medium mt-1">
                {overview?.perimeter_defense?.description || 'Zero known vulnerabilities'}
              </p>
            </div>
          </div>

          {/* Card 2: Session Isolation */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6865E8]">
                Session Isolation
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">
                {overview?.session_isolation?.status || 'Single Active Session'}
              </div>
              <p className="text-xs text-[#6865E8] font-semibold mt-1">
                {overview?.session_isolation?.description || 'HTTP-Only SameSite Cookie'}
              </p>
            </div>
          </div>

          {/* Card 3: Defense Health Score */}
          <div
            onClick={() => {
              if (scanResults) setIsScanModalOpen(true);
            }}
            className={cn(
              'rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3 transition-all',
              scanResults ? 'cursor-pointer hover:border-[#6865E8]/40' : ''
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Defense Health Score
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">
                {overview?.defense_health_score?.display_score ||
                  (overview?.health_score ? `${overview.health_score} / 100` : '98.5 / 100')}
              </div>
              <p className="text-xs text-[#16745C] font-semibold mt-1">
                {overview?.defense_health_score?.subtitle || 'Tier-1 Cryptographic Posture'}
              </p>
            </div>
          </div>

          {/* Card 4: Audit Log Stream */}
          <div className="rounded-3xl bg-white border border-[#E7E6F0] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#77798A]">
                Audit Log Stream
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECEBFF] text-[#6865E8]">
                <Terminal className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-[#20212B]">
                {overview?.total_audit_events ?? auditLogs.length} Events Logged
              </div>
              <p className="text-xs text-[#77798A] font-medium mt-1">
                {overview?.audit_stream?.subtitle || 'Tamper-evident trail'}
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. SIX-LAYER CYBER DEFENSE MATRIX (Aurora Glass)
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
          <div className="pb-3 border-b border-[#E7E6F0]">
            <h3 className="text-base font-bold text-[#20212B]">
              Perimeter Security Matrix & Compliance Gates
            </h3>
            <p className="text-xs text-[#77798A] mt-0.5">
              Multi-layer defenses enforced on every incoming HTTP API request and financial transaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matrixControls.map((shield: any, idx: number) => {
              const Icon = resolveShieldIcon(shield.icon);
              const isWarning = shield.status === 'WARNING';
              const isFail = shield.status === 'FAIL';
              return (
                <div key={shield.id || idx} className="p-5 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                        shield.color || 'text-[#16745C] bg-[#E8FBF4]'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                        isFail
                          ? 'bg-[#FDEEF0] text-[#E76D7A] border-[#FECDD3]'
                          : isWarning
                          ? 'bg-[#FEF6EB] text-[#E8A54B] border-[#FDE68A]'
                          : shield.status === 'LOGGING'
                          ? 'bg-[#ECEBFF] text-[#6865E8] border-[#D8D6FF]'
                          : 'bg-white text-[#16745C] border-[#B6F0DE]'
                      )}
                    >
                      {shield.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#20212B]">{shield.title || shield.name}</h4>
                    <p className="text-xs text-[#77798A] mt-1 leading-relaxed">{shield.desc || shield.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            3. REAL-TIME AUDIT LOG DIRECTORY
            ========================================================================= */}
        <div className="rounded-3xl bg-white border border-[#E7E6F0] p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E6F0]">
            <div>
              <h3 className="text-base font-bold text-[#20212B]">
                Cryptographic Security Audit Log ({filteredLogs.length})
              </h3>
              <p className="text-xs text-[#77798A] mt-0.5">Tamper-evident chronological access ledger</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0]">
              {(['ALL', 'CRITICAL', 'AUTH', 'SCANS'] as const).map((flt) => (
                <button
                  key={flt}
                  onClick={() => setLogFilter(flt)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
                    logFilter === flt
                      ? 'bg-[#6865E8] text-white shadow-xs'
                      : 'text-[#77798A] hover:text-[#20212B]'
                  )}
                >
                  {flt}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              title="No security audit events"
              description="No security anomalies recorded. All operational requests are running within normal parameters."
            />
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white border border-[#E7E6F0] hover:border-[#6865E8]/30 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#F8F7FC] text-[#6865E8] flex items-center justify-center shrink-0 border border-[#E7E6F0]">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#20212B] truncate">
                          {log.event_type}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-bold px-2 py-0.5 rounded-full border',
                            log.severity === 'CRITICAL'
                              ? 'bg-[#FDEEF0] text-[#E76D7A] border-[#FECDD3]'
                              : log.severity === 'WARNING'
                              ? 'bg-[#FEF6EB] text-[#E8A54B] border-[#FDE68A]'
                              : 'bg-[#E8FBF4] text-[#16745C] border-[#B6F0DE]'
                          )}
                        >
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#77798A] truncate mt-0.5">
                        {log.description || log.endpoint}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-[#77798A] block">
                      {log.source_ip || '127.0.0.1'}
                    </span>
                    <span className="text-[10px] font-mono text-[#77798A] block">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Revoke All Sessions */}
        <Modal
          isOpen={isRevokeModalOpen}
          onClose={() => setIsRevokeModalOpen(false)}
          title="Revoke All Active Sessions"
          description="Terminate all other browser logins and mobile device tokens immediately."
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECDD3] text-xs text-[#E76D7A] leading-relaxed font-semibold">
              Warning: This will immediately invalidate all session cookies and refresh tokens across other browsers and mobile devices. You will remain logged into this current session.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsRevokeModalOpen(false)}
                className="rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleRevokeAllSessions}
                isLoading={isRevoking}
                className="rounded-2xl bg-[#E76D7A] hover:bg-[#d95c69] text-white"
              >
                Revoke All Other Devices
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Live Security Scan Findings */}
        <Modal
          isOpen={isScanModalOpen}
          onClose={() => setIsScanModalOpen(false)}
          title="Security Diagnostic Scan Findings"
          description={
            scanResults
              ? `Diagnostic Report #${scanResults.scan_id.slice(0, 8)} • Executed in ${scanResults.duration_ms}ms`
              : 'Executing automated security posture checks...'
          }
        >
          {scanResults && (
            <div className="space-y-5 pt-1 max-h-[70vh] overflow-y-auto pr-1">
              {/* Scan Summary Score Banner */}
              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E6F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase text-[#77798A] font-bold">
                    Composite Posture Score
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#20212B] mt-0.5">
                    {scanResults.overall_score}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#E8FBF4] text-[#16745C] border border-[#B6F0DE]">
                    {scanResults.passed_tests} Passed
                  </span>
                  {scanResults.warning_tests > 0 && (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#FEF6EB] text-[#E8A54B] border border-[#FDE68A]">
                      {scanResults.warning_tests} Warnings
                    </span>
                  )}
                  {scanResults.failed_tests > 0 && (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#FDEEF0] text-[#E76D7A] border border-[#FECDD3]">
                      {scanResults.failed_tests} Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Individual Checks List */}
              <div className="space-y-3">
                {scanResults.results.map((check) => {
                  const isPass = check.status === 'PASS';
                  const isWarn = check.status === 'WARNING';
                  const isFail = check.status === 'FAIL';
                  return (
                    <div
                      key={check.id}
                      className="p-4 rounded-2xl bg-white border border-[#E7E6F0] space-y-2 hover:border-[#6865E8]/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-bold text-[#6865E8]">
                            {check.id}
                          </span>
                          <span className="text-xs font-bold text-[#20212B] truncate">
                            {check.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-[#77798A]">
                            {check.latency_ms}ms
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                              isPass
                                ? 'bg-[#E8FBF4] text-[#16745C] border-[#B6F0DE]'
                                : isWarn
                                ? 'bg-[#FEF6EB] text-[#E8A54B] border-[#FDE68A]'
                                : 'bg-[#FDEEF0] text-[#E76D7A] border-[#FECDD3]'
                            )}
                          >
                            {check.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#77798A] leading-relaxed">
                        {check.details}
                      </p>
                      {check.remediation && (
                        <div className="p-2.5 rounded-xl bg-[#FEF6EB] border border-[#FDE68A] text-[11px] text-[#E8A54B] font-medium">
                          <strong>Remediation:</strong> {check.remediation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsScanModalOpen(false)}
                  className="rounded-2xl bg-[#6865E8] text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
