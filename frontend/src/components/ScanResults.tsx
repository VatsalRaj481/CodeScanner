import React from 'react';
import { ScanResponse } from '../api/scanner';
import { VulnCard } from './VulnCard';
import { ShieldCheck, ShieldAlert, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ScanResultsProps {
  results: ScanResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ results, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
          <ShieldAlert className="w-7 h-7 text-cyan-400 absolute animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-100">Audit in Progress</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Evaluating AST patterns, security risks, injection vectors, and cryptographic strength...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#161b22] border border-red-900/50 rounded-xl p-8 text-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-red-500" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-400">Scan Operation Failed</h3>
          <p className="text-sm text-gray-300 max-w-md bg-red-950/40 p-3 rounded-lg border border-red-900/60 font-mono">
            {error}
          </p>
          <p className="text-xs text-gray-400">
            Ensure the FastAPI backend server is running on <code className="text-cyan-400">localhost:8000</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-200">No Analysis Conducted Yet</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Click <strong className="text-cyan-400">&quot;Scan Code&quot;</strong> to trigger AI analysis on your source code snippet.
          </p>
        </div>
      </div>
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
    if (score >= 85) return { text: 'text-green-400', stroke: '#4ade80', bg: 'bg-green-950/30 border-green-800' };
    if (score >= 60) return { text: 'text-amber-400', stroke: '#facc15', bg: 'bg-amber-950/30 border-amber-800' };
    if (score >= 35) return { text: 'text-orange-400', stroke: '#fb923c', bg: 'bg-orange-950/30 border-orange-800' };
    return { text: 'text-red-500', stroke: '#ef4444', bg: 'bg-red-950/30 border-red-800' };
  };

  const scoreTheme = getScoreColor(results.score);
  const strokeDashoffset = 283 - (283 * results.score) / 100;

  return (
    <div className="space-y-6">
      {/* Header Dashboard Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#30363d]">
          {/* Circular Security Score Gauge */}
          <div className="flex items-center space-x-5">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-[#21262d]"
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
                <span className={`text-2xl font-bold font-mono ${scoreTheme.text}`}>{results.score}</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase">Score</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Overall Risk Level:</span>
                <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border ${scoreTheme.bg} ${scoreTheme.text}`}>
                  {results.risk_level}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-100">
                {results.score >= 85 ? 'Security Status Excellent' : results.score >= 50 ? 'Vulnerabilities Identified' : 'Critical Risk Detected'}
              </h2>
              <p className="text-xs text-gray-400">
                {vulns.length === 0 ? 'No critical vulnerabilities found in scanned code.' : `Audit completed with ${vulns.length} issue(s) flagged.`}
              </p>
            </div>
          </div>
        </div>

        {/* Severity Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0d1117] border border-red-900/40 rounded-lg p-3 text-center space-y-1">
            <span className="text-[11px] text-red-400 uppercase font-semibold block">Critical</span>
            <span className="text-xl font-bold font-mono text-red-400">{counts.critical}</span>
          </div>
          <div className="bg-[#0d1117] border border-orange-900/40 rounded-lg p-3 text-center space-y-1">
            <span className="text-[11px] text-orange-400 uppercase font-semibold block">High</span>
            <span className="text-xl font-bold font-mono text-orange-400">{counts.high}</span>
          </div>
          <div className="bg-[#0d1117] border border-amber-900/40 rounded-lg p-3 text-center space-y-1">
            <span className="text-[11px] text-amber-400 uppercase font-semibold block">Medium</span>
            <span className="text-xl font-bold font-mono text-amber-400">{counts.medium}</span>
          </div>
          <div className="bg-[#0d1117] border border-blue-900/40 rounded-lg p-3 text-center space-y-1">
            <span className="text-[11px] text-blue-400 uppercase font-semibold block">Low / Info</span>
            <span className="text-xl font-bold font-mono text-blue-400">{counts.low}</span>
          </div>
        </div>
      </div>

      {/* Vulnerability Cards List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span>Vulnerability Findings</span>
          <span className="text-xs font-mono text-gray-400 font-normal">Total: {vulns.length}</span>
        </h3>

        {vulns.length === 0 ? (
          <div className="bg-[#161b22] border border-green-900/40 rounded-xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h4 className="text-base font-semibold text-green-300">Clean Bill of Health</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No known security flaws, injection points, or hardcoded secrets were detected in this code snippet.
            </p>
          </div>
        ) : (
          vulns.map((vuln) => <VulnCard key={vuln.id} vulnerability={vuln} />)
        )}
      </div>
    </div>
  );
};
