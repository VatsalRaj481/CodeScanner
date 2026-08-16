import React, { useState } from 'react';
import { Vulnerability } from '../api/scanner';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Copy, ShieldCheck, Tag, FileCode } from 'lucide-react';

interface VulnCardProps {
  vulnerability: Vulnerability;
}

export const VulnCard: React.FC<VulnCardProps> = ({ vulnerability }) => {
  const [isFixExpanded, setIsFixExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-950/50 text-rose-400 border-rose-800/50 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
      case 'high':
        return 'bg-amber-950/50 text-amber-400 border-amber-800/50 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
      case 'medium':
        return 'bg-yellow-950/50 text-yellow-400 border-yellow-800/50 shadow-[0_0_10px_rgba(234,179,8,0.15)]';
      case 'low':
      case 'info':
      default:
        return 'bg-sky-950/50 text-sky-400 border-sky-800/50 shadow-[0_0_10px_rgba(56,189,248,0.15)]';
    }
  };

  const copyFixCode = () => {
    navigator.clipboard.writeText(vulnerability.fix_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill badge with inner/outer glow */}
            <span className={`type-caption uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(vulnerability.severity)}`}>
              {vulnerability.severity}
            </span>
            <span className="text-[10px] font-mono bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800">
              {vulnerability.cwe_id}
            </span>
            {vulnerability.filename && (
              <span className="text-[10px] font-mono bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-800/40 flex items-center gap-1">
                <FileCode className="w-2.5 h-2.5 text-emerald-400" />
                {vulnerability.filename}
              </span>
            )}
            <span className="type-caption text-slate-400 flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/60 font-normal">
              <Tag className="w-2.5 h-2.5" />
              {vulnerability.category}
            </span>
          </div>

          <h3 className="type-title text-slate-100 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${vulnerability.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />
            {vulnerability.title}
          </h3>
        </div>

        {vulnerability.line_numbers && vulnerability.line_numbers.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-1 rounded-md border border-slate-800">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span className="num">Line {vulnerability.line_numbers.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Description & Impact */}
      <div className="space-y-3.5 text-xs text-slate-300">
        <p className="type-body text-slate-300">{vulnerability.description}</p>
        
        {/* Callout box with accent border */}
        <div className="bg-slate-900/80 border-l-2 border-amber-400/80 p-3.5 rounded-r-xl text-xs leading-relaxed text-amber-200/90 space-y-1">
          <span className="type-caption font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
            Why it&apos;s risky
          </span>
          <p className="type-body text-amber-200/80">{vulnerability.why_risky}</p>
        </div>
      </div>

      {/* Collapsible Remediation Fix */}
      <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/50">
        <button
          onClick={() => setIsFixExpanded(!isFixExpanded)}
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 hover:bg-slate-800/60 text-xs font-semibold text-slate-200 border-b border-slate-800/60 transition-all btn-press"
        >
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Recommended Contextual Fix</span>
          </div>
          {isFixExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <div 
          className={`transition-all duration-300 ease-out overflow-hidden ${
            isFixExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.20, 0.64, 1)' }}
        >
          <div className="p-4 space-y-3 bg-[#0A0E17]/60 border-t border-slate-800/40">
            <p className="type-body text-slate-400">{vulnerability.fix_explanation}</p>
            
            <div className="relative group">
              <pre className="p-3.5 bg-[#080B12] border border-slate-800/80 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-5 shadow-inner">
                <code>{vulnerability.fix_code}</code>
              </pre>
              
              <button
                onClick={copyFixCode}
                type="button"
                title="Copy secure code fix"
                className="absolute top-2.5 right-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 p-1.5 rounded-lg border border-slate-700 transition-all opacity-90 hover:opacity-100 flex items-center gap-1 text-[10px] btn-press cursor-pointer"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-emerald-400 animate-materialize">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">Copied!</span>
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                    <span className="font-medium">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
