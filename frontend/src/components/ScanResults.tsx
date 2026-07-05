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

const ScanResultsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#111625] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center px-4 py-3 bg-[#090d16] border-b border-[#1f293d]">
        <div className="w-4 h-4 bg-gray-800 rounded mr-2" />
        <div className="h-3.5 bg-gray-800 rounded w-24" />
      </div>
      
      {/* Body Skeleton */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center space-x-5 pb-6 border-b border-[#1f293d]">
          <div className="w-20 h-20 rounded-full bg-gray-800 shrink-0" />
          <div className="space-y-2.5 flex-1">
            <div className="h-3 bg-gray-800 rounded w-1/4" />
            <div className="h-5 bg-gray-800 rounded w-1/2" />
            <div className="h-3 bg-gray-800 rounded w-1/3" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="h-14 bg-gray-800/40 rounded-lg" />
          <div className="h-14 bg-gray-800/40 rounded-lg" />
          <div className="h-14 bg-gray-800/40 rounded-lg" />
          <div className="h-14 bg-gray-800/40 rounded-lg" />
        </div>

        <div className="space-y-4 pt-2">
          <div className="h-3.5 bg-gray-800 rounded w-1/4" />
          <div className="h-28 bg-gray-800/30 rounded-xl border border-[#1f293d]/50" />
          <div className="h-28 bg-gray-800/30 rounded-xl border border-[#1f293d]/50" />
        </div>
      </div>
    </div>
  );
};

export const ScanResults: React.FC<ScanResultsProps> = ({
  results,
  isLoading,
  error,
  onLoadDemo,
}) => {
  if (isLoading) {
    return <ScanResultsSkeleton />;
  }

  // Common wrapper to guarantee matched outer layout
  const PanelWrapper = ({ children, headerTitle = "Audit Report" }: { children: React.ReactNode; headerTitle?: string }) => (
    <div className="flex flex-col h-full bg-[#111625] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-[#090d16] border-b border-[#1f293d]">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">{headerTitle}</span>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#090d16]/10">
        {children}
      </div>
    </div>
  );

  // 1. Error state
  if (error) {
    return (
      <PanelWrapper headerTitle="Scan Failed">
        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-4 py-8">
          <AlertOctagon className="w-10 h-10 text-red-500" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-400">Scan Execution Error</h3>
            <p className="text-xs text-gray-300 max-w-sm bg-red-950/20 px-4 py-3 rounded-lg border border-red-900/30 font-mono leading-relaxed">
              {error}
            </p>
            <p className="text-[11px] text-gray-400">
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
        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-4 py-8">
          <div className="w-12 h-12 rounded-lg bg-indigo-950/30 border border-indigo-900/20 flex items-center justify-center text-indigo-400">
            <Code className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-200">Ready for audit</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Paste your code snippet or load our demo script to scan for vulnerabilities.
            </p>
          </div>
          <button
            onClick={onLoadDemo}
            type="button"
            className="px-4 py-2 bg-[#111625] hover:bg-[#1f293d]/50 text-indigo-400 hover:text-indigo-300 border border-indigo-900/40 rounded-lg text-xs font-medium transition-all"
          >
            Load Demo Code
          </button>
        </div>
      </PanelWrapper>
    );
  }

  const vulns = results.vulnerabilities || [];
  const counts = {
    critical: vulns.filter((v) => v.severity === 'critical').length,
    high: vulns.filter((v) => v.severity === 'high').length,
    medium: vulns.filter((v) => v.severity === 'medium').length,
    low: vulns.filter((v) => v.severity === 'low' || v.severity === 'info').length,
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return { text: 'text-green-400', stroke: '#22c55e', bg: 'bg-green-950/20 border-green-900/30' };
    if (score >= 60) return { text: 'text-amber-400', stroke: '#eab308', bg: 'bg-amber-950/20 border-amber-900/30' };
    if (score >= 35) return { text: 'text-orange-400', stroke: '#f97316', bg: 'bg-orange-950/20 border-orange-900/30' };
    return { text: 'text-red-400', stroke: '#ef4444', bg: 'bg-red-950/20 border-red-900/30' };
  };

  const scoreTheme = getScoreColor(results.score);
  const strokeDashoffset = 283 - (283 * results.score) / 100;

  return (
    <PanelWrapper headerTitle="Audit Report">
      {/* Header Dashboard Card */}
      <div className="bg-[#111625] border border-[#1f293d] rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-[#1f293d]">
          {/* Circular Security Score Gauge */}
          <div className="flex items-center space-x-5">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-gray-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={scoreTheme.stroke}
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-xl font-bold font-mono ${scoreTheme.text}`}>{results.score}</span>
                <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Score</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Risk Level:</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${scoreTheme.bg} ${scoreTheme.text}`}>
                  {results.risk_level}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-100">
                {results.score >= 85 ? 'Security Status Excellent' : results.score >= 50 ? 'Vulnerabilities Identified' : 'Critical Risk Detected'}
              </h2>
              <p className="text-xs text-gray-400">
                {vulns.length === 0 ? 'No critical vulnerabilities found in scanned code.' : `Audit completed with ${vulns.length} issue(s) flagged.`}
              </p>
            </div>
          </div>
        </div>

        {/* Severity Summary Badges */}
        <div className="grid grid-cols-4 gap-2.5">
          <div className="bg-[#090d16] border border-[#1f293d] rounded-lg py-2.5 text-center space-y-0.5">
            <span className="text-[10px] text-red-400 uppercase font-medium block tracking-wide">Critical</span>
            <span className="text-lg font-bold font-mono text-red-400">{counts.critical}</span>
          </div>
          <div className="bg-[#090d16] border border-[#1f293d] rounded-lg py-2.5 text-center space-y-0.5">
            <span className="text-[10px] text-orange-400 uppercase font-medium block tracking-wide">High</span>
            <span className="text-lg font-bold font-mono text-orange-400">{counts.high}</span>
          </div>
          <div className="bg-[#090d16] border border-[#1f293d] rounded-lg py-2.5 text-center space-y-0.5">
            <span className="text-[10px] text-amber-400 uppercase font-medium block tracking-wide">Medium</span>
            <span className="text-lg font-bold font-mono text-amber-400">{counts.medium}</span>
          </div>
          <div className="bg-[#090d16] border border-[#1f293d] rounded-lg py-2.5 text-center space-y-0.5">
            <span className="text-[10px] text-blue-400 uppercase font-medium block tracking-wide">Low</span>
            <span className="text-lg font-bold font-mono text-blue-400">{counts.low}</span>
          </div>
        </div>
      </div>

      {/* Vulnerability Cards List */}
      <div className="space-y-4 pt-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Vulnerability Findings</span>
          <span className="font-mono text-gray-400 font-normal">Total: {vulns.length}</span>
        </h3>

        {vulns.length === 0 ? (
          <div className="bg-[#111625] border border-green-900/20 rounded-xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
            <h4 className="text-sm font-semibold text-green-300">Clean Bill of Health</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              No known security flaws, injection points, or hardcoded secrets were detected in this code snippet.
            </p>
          </div>
        ) : (
          vulns.map((vuln) => <VulnCard key={vuln.id} vulnerability={vuln} />)
        )}
      </div>
    </PanelWrapper>
  );
};
