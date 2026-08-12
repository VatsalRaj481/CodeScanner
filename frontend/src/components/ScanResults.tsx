import React from 'react';
import { ScanResponse } from '../api/scanner';
import { VulnCard } from './VulnCard';
import { ShieldAlert, AlertOctagon, CheckCircle2, Code } from 'lucide-react';

interface ScanResultsProps {
  results: ScanResponse | null;
  isLoading: boolean;
  error: string | null;
  onLoadDemo: () => void;
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
const ScanResultsSkeleton: React.FC = () => (
  <div className="flex flex-col h-full bg-[#111625]/80 border border-white/[0.07] rounded-2xl overflow-hidden shadow-xl shadow-black/40 animate-pulse">
    <div className="flex items-center px-4 py-3 glass-panel border-b border-white/[0.06]">
      <div className="w-4 h-4 bg-white/[0.06] rounded mr-2" />
      <div className="h-3.5 bg-white/[0.06] rounded w-24" />
    </div>
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center space-x-5 pb-6 border-b border-white/[0.06]">
        <div className="w-20 h-20 rounded-full bg-white/[0.05] shrink-0" />
        <div className="space-y-2.5 flex-1">
          <div className="h-3 bg-white/[0.05] rounded w-1/4" />
          <div className="h-5 bg-white/[0.05] rounded w-1/2" />
          <div className="h-3 bg-white/[0.05] rounded w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <div key={i} className="h-14 bg-white/[0.04] rounded-xl" />)}
      </div>
      <div className="space-y-4 pt-2">
        <div className="h-3.5 bg-white/[0.05] rounded w-1/4" />
        <div className="h-28 bg-white/[0.03] rounded-xl border border-white/[0.05]" />
        <div className="h-28 bg-white/[0.03] rounded-xl border border-white/[0.05]" />
      </div>
    </div>
  </div>
);

// ── Panel wrapper — consistent outer shell ───────────────────────────────────
const PanelWrapper: React.FC<{ children: React.ReactNode; headerTitle?: string }> = ({
  children,
  headerTitle = 'Audit Report',
}) => (
  <div className="flex flex-col h-full bg-[#111625]/80 border border-white/[0.07] rounded-2xl overflow-hidden shadow-xl shadow-black/40">
    <div className="flex items-center justify-between px-4 py-3 glass-panel border-b border-white/[0.06]">
      <div className="flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase" style={{ letterSpacing: '0.06em' }}>
          {headerTitle}
        </span>
      </div>
    </div>
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#090d16]/20">
      {children}
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
export const ScanResults: React.FC<ScanResultsProps> = ({ results, isLoading, error, onLoadDemo }) => {
  if (isLoading) return <ScanResultsSkeleton />;

  // 1. Error state
  if (error) {
    return (
      <PanelWrapper headerTitle="Scan Failed">
        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-4 py-8 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-red-950/30 border border-red-900/20 flex items-center justify-center">
            <AlertOctagon className="w-7 h-7 text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-400" style={{ letterSpacing: '-0.01em' }}>
              Scan Execution Error
            </h3>
            <p className="text-xs text-gray-300 max-w-sm bg-red-950/20 px-4 py-3 rounded-xl border border-red-900/20 font-mono leading-relaxed">
              {error}
            </p>
            <p className="text-[11px] text-gray-500" style={{ letterSpacing: '0.01em' }}>
              Ensure the backend is online.
            </p>
          </div>
        </div>
      </PanelWrapper>
    );
  }

  // 2. Empty state
  if (!results) {
    return (
      <PanelWrapper headerTitle="Audit Report">
        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-4 py-8 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/30 border border-indigo-900/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-900/20">
            <Code className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium text-gray-200" style={{ letterSpacing: '-0.01em' }}>
              Ready for audit
            </h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              Paste your code snippet or load our demo script to scan for vulnerabilities.
            </p>
          </div>
          {/* Apple §1 pointer-down feedback */}
          <button
            onClick={onLoadDemo}
            type="button"
            className="px-4 py-2 bg-white/[0.04] hover:bg-indigo-950/40 text-indigo-400 hover:text-indigo-300 border border-indigo-900/30 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96]"
          >
            Load Demo Code
          </button>
        </div>
      </PanelWrapper>
    );
  }

  // 3. Results state
  const vulns = results.vulnerabilities || [];
  const counts = {
    critical: vulns.filter((v) => v.severity === 'critical').length,
    high:     vulns.filter((v) => v.severity === 'high').length,
    medium:   vulns.filter((v) => v.severity === 'medium').length,
    low:      vulns.filter((v) => v.severity === 'low' || v.severity === 'info').length,
  };

  const getScoreTheme = (score: number) => {
    if (score >= 85) return { text: 'text-green-400',  stroke: '#4ade80', ring: 'rgba(74,222,128,0.15)',  bg: 'bg-green-950/20 border-green-900/20' };
    if (score >= 60) return { text: 'text-amber-400',  stroke: '#fbbf24', ring: 'rgba(251,191,36,0.15)',  bg: 'bg-amber-950/20 border-amber-900/20' };
    if (score >= 35) return { text: 'text-orange-400', stroke: '#fb923c', ring: 'rgba(251,146,60,0.15)',  bg: 'bg-orange-950/20 border-orange-900/20' };
    return               { text: 'text-red-400',    stroke: '#f87171', ring: 'rgba(248,113,113,0.15)', bg: 'bg-red-950/20 border-red-900/20' };
  };

  const scoreTheme = getScoreTheme(results.score);
  // r=42 → circumference = 2π×42 ≈ 263.9
  const CIRC = 263.9;
  const strokeDashoffset = CIRC - (CIRC * results.score) / 100;

  return (
    <PanelWrapper headerTitle="Audit Report">
      {/* ── Score + summary card ── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-5 animate-fade-up">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-white/[0.06]">
          {/* Circular score gauge */}
          <div className="flex items-center space-x-5">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Outer glow ring */}
                <circle cx="50" cy="50" r="42" fill="transparent" stroke={scoreTheme.ring} strokeWidth="10" />
                {/* Track */}
                <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                {/* Progress — Apple §4: ease-in-out spring feel with 1s ease-out */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="transparent"
                  stroke={scoreTheme.stroke}
                  strokeWidth="7"
                  strokeDasharray={CIRC}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Apple §15: tabular numerals, tight leading at large size */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-xl font-bold num ${scoreTheme.text}`} style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {results.score}
                </span>
                <span className="text-[9px] text-gray-500 font-semibold uppercase mt-0.5" style={{ letterSpacing: '0.08em' }}>
                  Score
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 uppercase font-semibold" style={{ letterSpacing: '0.06em' }}>
                  Risk Level:
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${scoreTheme.bg} ${scoreTheme.text}`}
                  style={{ letterSpacing: '0.06em' }}>
                  {results.risk_level}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-100" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {results.score >= 85
                  ? 'Security Status Excellent'
                  : results.score >= 50
                  ? 'Vulnerabilities Identified'
                  : 'Critical Risk Detected'}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                {vulns.length === 0
                  ? 'No critical vulnerabilities found in scanned code.'
                  : `Audit completed — ${vulns.length} issue(s) flagged.`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Severity summary badges — Apple §15 tabular nums ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Critical', count: counts.critical, color: 'text-red-400',    bg: 'bg-red-950/20 border-red-900/20' },
            { label: 'High',     count: counts.high,     color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/20' },
            { label: 'Medium',   count: counts.medium,   color: 'text-amber-400',  bg: 'bg-amber-950/20 border-amber-900/20' },
            { label: 'Low',      count: counts.low,      color: 'text-blue-400',   bg: 'bg-blue-950/20 border-blue-900/20' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`${bg} border rounded-xl py-3 text-center space-y-0.5`}>
              <span className={`text-[10px] ${color} uppercase font-semibold block`} style={{ letterSpacing: '0.05em' }}>
                {label}
              </span>
              <span className={`text-lg font-bold num ${color}`} style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vulnerability cards list ── */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase flex items-center justify-between" style={{ letterSpacing: '0.06em' }}>
          <span>Vulnerability Findings</span>
          <span className="font-mono text-gray-600 font-normal">Total: {vulns.length}</span>
        </h3>

        {vulns.length === 0 ? (
          <div className="bg-green-950/10 border border-green-900/20 rounded-2xl p-6 text-center space-y-2 animate-fade-up">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.3))' }} />
            <h4 className="text-sm font-semibold text-green-300" style={{ letterSpacing: '-0.01em' }}>
              Clean Bill of Health
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              No known security flaws, injection points, or hardcoded secrets were detected in this code snippet.
            </p>
          </div>
        ) : (
          // Apple §12: staggered materialize entrance on each card
          vulns.map((vuln, i) => (
            <div
              key={vuln.id}
              className="animate-materialize"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <VulnCard vulnerability={vuln} />
            </div>
          ))
        )}
      </div>
    </PanelWrapper>
  );
};
