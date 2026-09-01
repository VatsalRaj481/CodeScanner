import React, { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Vulnerability } from '../api/scanner';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Copy, ShieldCheck, Tag, FileCode, Columns, Rows, BookOpen, ExternalLink } from 'lucide-react';

interface VulnCardProps {
  vulnerability: Vulnerability;
}

export const VulnCard: React.FC<VulnCardProps> = ({ vulnerability }) => {
  const [isFixExpanded, setIsFixExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSplitView, setIsSplitView] = useState(true);

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

  // Construct vulnerable snippet representation for diff comparison
  const getOldCode = () => {
    const linesStr = vulnerability.line_numbers && vulnerability.line_numbers.length > 0 
      ? `Line ${vulnerability.line_numbers.join(', ')}` 
      : 'Vulnerable Code';
    return `# [${linesStr}] ${vulnerability.title}\n# Category: ${vulnerability.category}\n# Issue: ${vulnerability.description}`;
  };

  // Custom dark theme matching app's design system
  const customDiffStyles = {
    variables: {
      dark: {
        diffViewerBackground: '#080B12',
        diffViewerColor: '#cbd5e1',
        addedBackground: '#064e3b25',
        addedColor: '#34d399',
        removedBackground: '#88133725',
        removedColor: '#f87171',
        wordAddedBackground: '#04785744',
        wordRemovedBackground: '#9f123944',
        addedGutterBackground: '#064e3b33',
        removedGutterBackground: '#88133733',
        gutterBackground: '#0A0E17',
        gutterColor: '#475569',
        gutterBackgroundDark: '#0A0E17',
        highlightBackground: '#1e293b',
        highlightGutterBackground: '#1e293b',
      },
    },
    line: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      lineHeight: '1.5',
    },
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

        {/* RAG Knowledge Base Reference Sources */}
        {vulnerability.sources && vulnerability.sources.length > 0 && (
          <div className="bg-[#090d16]/90 border border-[#1f293d] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Grounded Knowledge Base References</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {vulnerability.sources.map((src, idx) => {
                const cweLabel = src.cwe_id || src.cweId || 'Reference';
                return (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${cweLabel}: ${src.title}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-[#111625] text-cyan-300 hover:text-cyan-200 px-2.5 py-1 rounded-lg border border-[#1f293d] hover:border-cyan-600/50 hover:bg-[#151c2e] transition-all group"
                  >
                    <span className="font-semibold text-cyan-400">{cweLabel}</span>
                    {src.title && (
                      <span className="text-slate-400 max-w-[220px] truncate hidden sm:inline group-hover:text-slate-300">
                        • {src.title}
                      </span>
                    )}
                    <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-400" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Remediation Fix with Side-by-Side Diff */}
      <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/50">
        <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800/60 transition-all">
          <button
            onClick={() => setIsFixExpanded(!isFixExpanded)}
            type="button"
            className="flex items-center space-x-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer btn-press"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Before / After Code Diff</span>
          </button>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle (Split vs Unified) */}
            {isFixExpanded && (
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                type="button"
                title={isSplitView ? "Switch to unified inline diff view" : "Switch to side-by-side split diff view"}
                className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1 rounded-md border border-slate-700/60 transition-all btn-press cursor-pointer"
              >
                {isSplitView ? <Columns className="w-3 h-3 text-slate-400" /> : <Rows className="w-3 h-3 text-slate-400" />}
                <span>{isSplitView ? 'Side-by-Side' : 'Unified'}</span>
              </button>
            )}

            {/* Copy Fix Code Button */}
            <button
              onClick={copyFixCode}
              type="button"
              title="Copy recommended secure code fix"
              className="flex items-center space-x-1 text-[10px] font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1 rounded-md border border-slate-700/60 transition-all btn-press cursor-pointer"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-400 animate-materialize">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">Copied!</span>
                </span>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Copy Fix</span>
                </>
              )}
            </button>

            {/* Expand / Collapse Chevron */}
            <button
              onClick={() => setIsFixExpanded(!isFixExpanded)}
              type="button"
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              {isFixExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Diff Container */}
        {isFixExpanded && (
          <div className="p-4 space-y-3 bg-[#0A0E17]/80 border-t border-slate-800/40 animate-fade-up">
            <p className="type-body text-slate-400">{vulnerability.fix_explanation}</p>

            {/* Diff Viewer */}
            <div className="rounded-xl overflow-hidden border border-slate-800/80 shadow-inner font-mono text-xs">
              <ReactDiffViewer
                oldValue={getOldCode()}
                newValue={vulnerability.fix_code}
                splitView={isSplitView}
                useDarkTheme={true}
                styles={customDiffStyles}
                leftTitle="Vulnerable Snippet / Issue"
                rightTitle="Recommended Secure Fix"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
