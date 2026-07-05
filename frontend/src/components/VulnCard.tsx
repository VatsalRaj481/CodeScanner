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
        return 'bg-red-950/30 text-red-400 border-red-900/30';
      case 'high':
        return 'bg-orange-950/30 text-orange-400 border-orange-900/30';
      case 'medium':
        return 'bg-amber-950/30 text-amber-400 border-amber-900/30';
      case 'low':
      case 'info':
      default:
        return 'bg-blue-950/30 text-blue-400 border-blue-900/30';
    }
  };

  const copyFixCode = () => {
    navigator.clipboard.writeText(vulnerability.fix_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111625] border border-[#1f293d] hover:border-indigo-500/30 rounded-xl p-5 shadow-sm transition-all duration-200 space-y-4">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityBadge(vulnerability.severity)}`}>
              {vulnerability.severity}
            </span>
            <span className="text-[10px] font-mono bg-[#090d16] text-indigo-400 px-2 py-0.5 rounded border border-[#1f293d]">
              {vulnerability.cwe_id}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-[#090d16] px-2 py-0.5 rounded border border-[#1f293d]/50">
              <Tag className="w-3 h-3" />
              {vulnerability.category}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${vulnerability.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
            {vulnerability.title}
          </h3>
        </div>

        {vulnerability.line_numbers && vulnerability.line_numbers.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-[#090d16] px-2 py-1 rounded border border-[#1f293d]">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Line {vulnerability.line_numbers.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Description & Impact */}
      <div className="space-y-2 text-xs text-gray-300">
        <p className="leading-relaxed">{vulnerability.description}</p>
        
        <div className="bg-[#090d16]/80 border-l-2 border-amber-500/80 p-3 rounded-r-lg text-xs leading-relaxed text-amber-200/90 space-y-1">
          <span className="font-semibold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
            Why it&apos;s risky
          </span>
          <p>{vulnerability.why_risky}</p>
        </div>
      </div>

      {/* Collapsible Remediation Fix */}
      <div className="border border-[#1f293d] rounded-lg overflow-hidden bg-[#090d16]">
        <button
          onClick={() => setIsFixExpanded(!isFixExpanded)}
          type="button"
          className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-950/10 hover:bg-indigo-950/20 text-xs font-semibold text-indigo-300 border-b border-[#1f293d] transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Recommended Contextual Fix</span>
          </div>
          {isFixExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isFixExpanded && (
          <div className="p-4 space-y-3 bg-[#090d16]/30">
            <p className="text-xs text-gray-300">{vulnerability.fix_explanation}</p>
            
            <div className="relative group">
              <pre className="p-3 bg-[#090d16] border border-[#1f293d] rounded-lg text-xs font-mono text-green-400 overflow-x-auto leading-5">
                <code>{vulnerability.fix_code}</code>
              </pre>
              <button
                onClick={copyFixCode}
                type="button"
                title="Copy secure code fix"
                className="absolute top-2.5 right-2.5 bg-[#111625] hover:bg-[#1f293d] text-gray-300 p-1.5 rounded-md border border-[#1f293d] transition-all opacity-90 group-hover:opacity-100 flex items-center gap-1 text-[10px]"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-medium">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
