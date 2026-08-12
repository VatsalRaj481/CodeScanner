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
        return 'bg-red-950/40 text-red-400 border-red-900/40 shadow-[inset_0_1px_1px_rgba(248,113,113,0.15)]';
      case 'high':
        return 'bg-orange-950/40 text-orange-400 border-orange-900/40 shadow-[inset_0_1px_1px_rgba(251,146,60,0.15)]';
      case 'medium':
        return 'bg-amber-950/40 text-amber-400 border-amber-900/40 shadow-[inset_0_1px_1px_rgba(251,191,36,0.15)]';
      case 'low':
      case 'info':
      default:
        return 'bg-blue-950/40 text-blue-400 border-blue-900/40 shadow-[inset_0_1px_1px_rgba(96,165,250,0.15)]';
    }
  };

  const copyFixCode = () => {
    navigator.clipboard.writeText(vulnerability.fix_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/30 rounded-2xl p-5 shadow-lg shadow-black/10 hover:shadow-black/20 transition-all duration-300 ease-out hover:-translate-y-0.5 space-y-4">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Pill badge with inner glow */}
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(vulnerability.severity)}`}>
              {vulnerability.severity}
            </span>
            <span className="text-[9px] font-mono bg-[#090d16]/80 text-indigo-400 px-2 py-0.5 rounded-md border border-white/[0.06]">
              {vulnerability.cwe_id}
            </span>
            <span className="text-[9px] text-gray-500 flex items-center gap-1 bg-[#090d16]/40 px-2 py-0.5 rounded-md border border-white/[0.04]">
              <Tag className="w-2.5 h-2.5" />
              {vulnerability.category}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2" style={{ letterSpacing: '-0.01em' }}>
            <AlertTriangle className={`w-4 h-4 shrink-0 ${vulnerability.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
            {vulnerability.title}
          </h3>
        </div>

        {vulnerability.line_numbers && vulnerability.line_numbers.length > 0 && (
          <div className="flex items-center gap-1 text-[9px] font-mono text-gray-500 bg-[#090d16]/80 px-2 py-1 rounded-md border border-white/[0.06]">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="num">Line {vulnerability.line_numbers.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Description & Impact */}
      <div className="space-y-3.5 text-xs text-gray-400">
        <p className="leading-relaxed">{vulnerability.description}</p>
        
        {/* Callout box with left border */}
        <div className="bg-[#090d16]/40 border-l-2 border-amber-500/80 p-3.5 rounded-r-xl text-xs leading-relaxed text-amber-200/80 space-y-1">
          <span className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]" style={{ letterSpacing: '0.06em' }}>
            Why it&apos;s risky
          </span>
          <p>{vulnerability.why_risky}</p>
        </div>
      </div>

      {/* Collapsible Remediation Fix */}
      <div className="border border-white/[0.07] rounded-xl overflow-hidden bg-[#090d16]/30">
        {/* Toggle Button — pointer-down feedback */}
        <button
          onClick={() => setIsFixExpanded(!isFixExpanded)}
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold text-indigo-300 border-b border-white/[0.05] transition-all duration-150 active:scale-[0.99]"
        >
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Recommended Contextual Fix</span>
          </div>
          {isFixExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Smooth expand/collapse using grid transition or max-height */}
        <div 
          className={`transition-all duration-300 ease-out overflow-hidden ${
            isFixExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.20, 0.64, 1)' }}
        >
          <div className="p-4 space-y-3 bg-[#090d16]/10 border-t border-white/[0.02]">
            <p className="text-xs text-gray-400 leading-relaxed">{vulnerability.fix_explanation}</p>
            
            <div className="relative group">
              <pre className="p-3 bg-[#090d16]/80 border border-white/[0.06] rounded-xl text-xs font-mono text-green-400 overflow-x-auto leading-5 shadow-inner">
                <code>{vulnerability.fix_code}</code>
              </pre>
              
              {/* Copy Button — pointer-down feedback */}
              <button
                onClick={copyFixCode}
                type="button"
                title="Copy secure code fix"
                className="absolute top-2.5 right-2.5 bg-[#111625]/90 hover:bg-[#1f293d]/90 text-gray-300 p-1.5 rounded-lg border border-white/[0.08] transition-all opacity-90 hover:opacity-100 flex items-center gap-1 text-[10px] active:scale-[0.90] cursor-pointer"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-green-400 animate-pop-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">Copied!</span>
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
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
