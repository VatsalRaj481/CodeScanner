import React, { useState, useEffect, useRef } from 'react';
import { ScanResponse } from '../api/scanner';
import { VulnCard } from './VulnCard';
import { ShieldAlert, AlertOctagon, CheckCircle2, Code, Copy, Download, FileText, ChevronDown, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ScanResultsProps {
  results: ScanResponse | null;
  isLoading: boolean;
  error: string | null;
}

// ── Skeleton loader (Inner panel content only, no duplicate outer frame) ─────
const ScanResultsSkeleton: React.FC = () => (
  <div className="space-y-6 py-2">
    {/* Cold start status notification card */}
    <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-4 flex items-center space-x-3.5 text-xs text-sky-200">
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-sky-300">Auditing code in progress...</p>
        <p className="text-[11px] text-sky-400/90 font-mono">
          If backend is spinning up from cold-start, this may take 30–50s. Automatic retries are active.
        </p>
      </div>
    </div>

    <div className="space-y-6 animate-pulse">
      <div className="flex items-center space-x-5 pb-6 border-b border-slate-800/80">
        <div className="w-28 h-28 rounded-full bg-slate-800/50 shrink-0" />
        <div className="space-y-2.5 flex-1">
          <div className="h-3 bg-slate-800/50 rounded w-1/4" />
          <div className="h-5 bg-slate-800/50 rounded w-1/2" />
          <div className="h-3 bg-slate-800/50 rounded w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-800/30 rounded-xl" />
        ))}
      </div>
      <div className="space-y-4 pt-2">
        <div className="h-3.5 bg-slate-800/40 rounded w-1/4" />
        <div className="h-28 bg-slate-800/20 rounded-xl border border-slate-800/40" />
        <div className="h-28 bg-slate-800/20 rounded-xl border border-slate-800/40" />
      </div>
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
export const ScanResults: React.FC<ScanResultsProps> = ({ results, isLoading, error }) => {
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);

  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const currentScoreRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth ease-out animation for Risk Score ring
  useEffect(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (!results) {
      currentScoreRef.current = 0;
      setAnimatedScore(0);
      return;
    }

    const rawTarget = Number(results.score);
    const target = isNaN(rawTarget) ? 0 : Math.min(100, Math.max(0, Math.round(rawTarget)));

    const step = () => {
      const current = currentScoreRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.4) {
        currentScoreRef.current = target;
        setAnimatedScore(target);
        animFrameRef.current = null;
      } else {
        const next = current + diff * 0.15;
        currentScoreRef.current = next;
        const clampedVal = Math.min(100, Math.max(0, Math.round(next)));
        setAnimatedScore(clampedVal);
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [results?.score]);

  // Toggle multi-select severity filter
  const toggleSeverityFilter = (sev: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  // State for expanded file accordions in batch mode
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const toggleFileAccordion = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: prev[filename] !== undefined ? !prev[filename] : false,
    }));
  };

  // Generate Markdown report summary
  const generateMarkdownReport = (res: ScanResponse) => {
    const vList = res.vulnerabilities || [];
    const counts = {
      critical: vList.filter((v) => v.severity.toLowerCase() === 'critical').length,
      high:     vList.filter((v) => v.severity.toLowerCase() === 'high').length,
      medium:   vList.filter((v) => v.severity.toLowerCase() === 'medium').length,
      low:      vList.filter((v) => ['low', 'info'].includes(v.severity.toLowerCase())).length,
    };

    let md = `# 🛡️ AI Security Scanner Audit Report\n\n`;
    md += `**Overall Security Score:** ${res.score}/100\n`;
    md += `**Risk Level:** ${res.risk_level.toUpperCase()}\n`;
    if (res.total_files) {
      md += `**Total Files Scanned:** ${res.total_files}\n`;
    }
    md += `**Total Vulnerabilities Flagged:** ${vList.length}\n\n`;

    md += `## Severity Summary\n`;
    md += `- **Critical:** ${counts.critical}\n`;
    md += `- **High:** ${counts.high}\n`;
    md += `- **Medium:** ${counts.medium}\n`;
    md += `- **Low / Info:** ${counts.low}\n\n`;

    if (res.file_results && res.file_results.length > 0) {
      md += `## Per-File Breakdown\n\n`;
      res.file_results.forEach((fr) => {
        md += `### 📄 ${fr.filename} (Score: ${fr.score}/100, Risk: ${fr.risk_level.toUpperCase()})\n`;
        if (fr.vulnerabilities.length === 0) {
          md += `*No security issues identified in this file.*\n\n`;
        } else {
          fr.vulnerabilities.forEach((v, idx) => {
            md += `#### ${idx + 1}. [${v.severity.toUpperCase()}] ${v.title} (${v.cwe_id})\n`;
            md += `- **Description:** ${v.description}\n`;
            md += `- **Why it's risky:** ${v.why_risky}\n`;
            md += `- **Fix:** ${v.fix_explanation}\n\n`;
          });
        }
      });
    } else {
      md += `## Detailed Findings\n\n`;
      if (vList.length === 0) {
        md += `*No vulnerabilities identified in this audit.*\n`;
      } else {
        vList.forEach((v, idx) => {
          md += `### ${idx + 1}. [${v.severity.toUpperCase()}] ${v.title}\n`;
          md += `- **CWE ID:** ${v.cwe_id}\n`;
          md += `- **Category:** ${v.category}\n`;
          if (v.line_numbers && v.line_numbers.length > 0) {
            md += `- **Line Numbers:** Line ${v.line_numbers.join(', ')}\n`;
          }
          md += `- **Description:** ${v.description}\n`;
          md += `- **Why it's risky:** ${v.why_risky}\n`;
          md += `- **Recommended Fix Explanation:** ${v.fix_explanation}\n\n`;
          md += `\`\`\`code\n${v.fix_code}\n\`\`\`\n\n`;
        });
      }
    }

    return md;
  };

  const handleCopyReport = () => {
    if (!results) return;
    const md = generateMarkdownReport(results);
    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!results) return;
    const md = generateMarkdownReport(results);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
  };

  const handleExportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    let y = 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('AI Security Scanner Audit Report', 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Overall Security Score: ${results.score}/100`, 14, y);
    y += 6;
    doc.text(`Risk Level: ${results.risk_level.toUpperCase()}`, 14, y);
    y += 6;
    if (results.total_files) {
      doc.text(`Total Files Scanned: ${results.total_files}`, 14, y);
      y += 6;
    }
    doc.text(`Total Vulnerabilities: ${results.vulnerabilities?.length || 0}`, 14, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Vulnerability Findings:', 14, y);
    y += 8;

    const vList = results.vulnerabilities || [];
    vList.forEach((v, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const prefix = v.filename ? `[${v.filename}] ` : '';
      doc.text(`${idx + 1}. ${prefix}[${v.severity.toUpperCase()}] ${v.title} (${v.cwe_id})`, 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(`Description: ${v.description}`, 180);
      doc.text(descLines, 14, y);
      y += descLines.length * 4.5 + 4;

      const fixLines = doc.splitTextToSize(`Fix: ${v.fix_explanation}`, 180);
      doc.text(fixLines, 14, y);
      y += fixLines.length * 4.5 + 6;
    });

    doc.save(`security-audit-report-${Date.now()}.pdf`);
    setIsExportDropdownOpen(false);
  };

  // Helper theme function for risk score gauge
  const getScoreTheme = (score: number) => {
    if (score >= 85) return { text: 'text-emerald-400', stroke: '#34D399', ring: 'rgba(52,211,153,0.15)', bg: 'bg-emerald-950/30 border-emerald-800/30' };
    if (score >= 60) return { text: 'text-amber-400',   stroke: '#FBBF24', ring: 'rgba(251,191,36,0.15)',  bg: 'bg-amber-950/30 border-amber-800/30' };
    if (score >= 35) return { text: 'text-orange-400',  stroke: '#FB923C', ring: 'rgba(251,146,60,0.15)',  bg: 'bg-orange-950/30 border-orange-800/30' };
    return               { text: 'text-rose-400',    stroke: '#F87171', ring: 'rgba(248,113,113,0.15)', bg: 'bg-rose-950/30 border-rose-800/30' };
  };

  // Persistent Outer Panel Container Wrapper
  const PanelWrapper: React.FC<{ children: React.ReactNode; headerTitle?: string }> = ({
    children,
    headerTitle = 'Audit Report',
  }) => (
    <div className="flex flex-col h-full panel-elevated rounded-2xl overflow-hidden">
      <div className="relative z-20 flex items-center justify-between px-4 py-3 glass-panel border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <svg className="animate-spin w-4 h-4 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <ShieldAlert className="w-4 h-4 text-slate-300" />
          )}
          <span className="type-caption text-slate-300 font-semibold uppercase tracking-wider">
            {headerTitle}
          </span>
          {isLoading && (
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              Scanning...
            </span>
          )}
        </div>

        {/* Toolbar: Copy Report & Export Buttons (only when results exist) */}
        {results && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReport}
              type="button"
              title="Copy report summary in Markdown format"
              className="flex items-center space-x-1.5 bg-slate-900/80 hover:bg-slate-800/80 text-xs font-medium text-slate-300 hover:text-white border border-slate-800 rounded-xl px-2.5 py-1.5 transition-all btn-press cursor-pointer"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-[11px]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Copy Report</span>
                </>
              )}
            </button>

            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                type="button"
                className="flex items-center space-x-1.5 bg-slate-900/80 hover:bg-slate-800/80 text-xs font-medium text-slate-300 hover:text-white border border-slate-800 rounded-xl px-2.5 py-1.5 transition-all btn-press cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Export</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-[#121824] border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-materialize">
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all btn-press flex items-center space-x-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export as Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all btn-press flex items-center space-x-2 cursor-pointer border-t border-slate-800/60"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export as PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0B0F17]/30">
        {children}
      </div>
    </div>
  );

  let headerTitle = 'Audit Report';
  if (results) {
    headerTitle = results.file_results ? `Batch Audit Report (${results.file_results.length} Files)` : 'Audit Report';
  } else if (isLoading) {
    headerTitle = 'Auditing Code...';
  }

  // ── Render Content inside persistent PanelWrapper ──
  return (
    <PanelWrapper headerTitle={headerTitle}>
      {/* Live re-scanning progress banner when results exist */}
      {isLoading && results && (
        <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-sky-300 animate-pulse">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-3.5 w-3.5 text-sky-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Analyzing code... updating security findings</span>
          </div>
          <span className="text-[10px] text-sky-400/80 uppercase tracking-wider font-semibold">Live Audit</span>
        </div>
      )}

      {/* Case 1: First scan loading state (no existing results) */}
      {isLoading && !results ? (
        <ScanResultsSkeleton />
      ) : error ? (
        /* Case 2: Error state */
        <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center space-y-4 py-8 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/30 border border-rose-900/30 flex items-center justify-center">
            <AlertOctagon className="w-7 h-7 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h3 className="type-title text-rose-400">Scan Execution Error</h3>
            <p className="text-xs text-slate-300 max-w-sm bg-rose-950/20 px-4 py-3 rounded-xl border border-rose-900/30 font-mono leading-relaxed">
              {error}
            </p>
            <p className="type-caption text-slate-500 font-normal">
              Ensure the backend server is running and accessible.
            </p>
          </div>
        </div>
      ) : !results ? (
        /* Case 3: Empty state */
        <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4 py-12 my-auto animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 shadow-lg shadow-black/40">
            <Code className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="type-title text-slate-200">Ready for Security Audit</h3>
            <p className="type-body text-slate-400 max-w-xs leading-relaxed">
              Paste source code snippet, drag-and-drop multiple files, or upload a .zip archive to begin auditing.
            </p>
          </div>
        </div>
      ) : (
        /* Case 4: Results state */
        (() => {
          const vulns = results.vulnerabilities || [];
          const counts = {
            critical: vulns.filter((v) => v.severity.toLowerCase() === 'critical').length,
            high:     vulns.filter((v) => v.severity.toLowerCase() === 'high').length,
            medium:   vulns.filter((v) => v.severity.toLowerCase() === 'medium').length,
            low:      vulns.filter((v) => ['low', 'info'].includes(v.severity.toLowerCase())).length,
          };

          const filteredVulns = selectedSeverities.length === 0
            ? vulns
            : vulns.filter((v) => {
                const s = v.severity.toLowerCase();
                return selectedSeverities.includes(s) || (selectedSeverities.includes('low') && s === 'info');
              });

          const scoreTheme = getScoreTheme(results.score);
          const CIRC = 326.726;
          const strokeDashoffset = CIRC - (CIRC * Math.max(0, Math.min(100, animatedScore))) / 100;

          return (
            <>
              {/* Score + Summary Card */}
              <div className="card-elevated rounded-2xl p-5 space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-slate-800/80">
                  {/* Risk Score Gauge */}
                  <div className="flex items-center space-x-6">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <defs>
                          <linearGradient id="scoreGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#34D399" />
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#F87171" />
                          </linearGradient>
                        </defs>
                        <circle cx="60" cy="60" r="52" fill="transparent" stroke={scoreTheme.ring} strokeWidth="12" />
                        <circle cx="60" cy="60" r="52" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle
                          cx="60" cy="60" r="52"
                          fill="transparent"
                          stroke={scoreTheme.stroke}
                          strokeWidth="8"
                          strokeDasharray={CIRC}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                        <span className={`text-2xl font-bold font-mono ${scoreTheme.text}`} style={{ letterSpacing: '-0.02em', lineHeight: 1 }}>
                          {Math.min(100, Math.max(0, Math.round(Number(animatedScore) || 0)))}
                        </span>
                        <span className="type-caption text-slate-500 font-semibold uppercase mt-1">
                          Score
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="type-caption text-slate-500 uppercase font-semibold">
                          Risk Level:
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${scoreTheme.bg} ${scoreTheme.text}`}
                          style={{ letterSpacing: '0.06em' }}
                        >
                          {results.risk_level}
                        </span>
                      </div>
                      <h2 className="type-title text-slate-100">
                        {results.score >= 85
                          ? 'Security Status Excellent'
                          : results.score >= 50
                          ? 'Vulnerabilities Identified'
                          : 'Critical Risk Detected'}
                      </h2>
                      <p className="type-body text-slate-400">
                        {results.total_files ? (
                          `Batch audit completed across ${results.total_files} files — ${vulns.length} total issue(s) flagged.`
                        ) : vulns.length === 0 ? (
                          'No critical vulnerabilities found in scanned code.'
                        ) : (
                          `Audit completed — ${vulns.length} issue(s) flagged.`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multi-Select Interactive Severity Badges Filter */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'critical', label: 'Critical', count: counts.critical, color: 'text-rose-400',    bg: 'bg-rose-950/30 border-rose-800/40 shadow-[0_0_12px_rgba(244,63,94,0.12)]' },
                    { id: 'high',     label: 'High',     count: counts.high,     color: 'text-amber-400',   bg: 'bg-amber-950/30 border-amber-800/40 shadow-[0_0_12px_rgba(245,158,11,0.12)]' },
                    { id: 'medium',   label: 'Medium',   count: counts.medium,   color: 'text-yellow-400',  bg: 'bg-yellow-950/30 border-yellow-800/40 shadow-[0_0_12px_rgba(234,179,8,0.12)]' },
                    { id: 'low',      label: 'Low',      count: counts.low,      color: 'text-sky-400',     bg: 'bg-sky-950/30 border-sky-800/40 shadow-[0_0_12px_rgba(56,189,248,0.12)]' },
                  ].map(({ id, label, count, color, bg }) => {
                    const isSelected = selectedSeverities.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleSeverityFilter(id)}
                        className={`${bg} border rounded-xl py-2.5 px-1 text-center space-y-0.5 transition-all btn-press cursor-pointer ${
                          isSelected ? 'ring-2 ring-slate-300 scale-[1.03] shadow-lg shadow-black/40' : 'hover:scale-[1.01] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span className={`type-caption ${color} uppercase font-semibold block flex items-center justify-center space-x-1`}>
                          <span>{label}</span>
                          {isSelected && <Check className="w-3 h-3 text-slate-200 inline-block" />}
                        </span>
                        <span className={`text-base font-bold num ${color}`} style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-File Breakdown (Batch Mode) vs Single Findings List */}
              {results.file_results && results.file_results.length > 0 ? (
                <div className="space-y-4 pt-1">
                  <h3 className="type-caption text-slate-500 uppercase font-semibold flex items-center justify-between">
                    <span>Per-File Breakdown ({results.file_results.length} Files)</span>
                    <span className="font-mono text-slate-400 font-normal">
                      Total Issues: {vulns.length}
                    </span>
                  </h3>

                  {results.file_results.map((fr) => {
                    const isExpanded = expandedFiles[fr.filename] !== false;
                    const fileVulns = fr.vulnerabilities.filter((v) => {
                      if (selectedSeverities.length === 0) return true;
                      const s = v.severity.toLowerCase();
                      return selectedSeverities.includes(s) || (selectedSeverities.includes('low') && s === 'info');
                    });
                    const fileScoreTheme = getScoreTheme(fr.score);

                    return (
                      <div key={fr.filename} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
                        {/* File Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleFileAccordion(fr.filename)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 hover:bg-slate-800/60 border-b border-slate-800/60 transition-all cursor-pointer btn-press"
                        >
                          <div className="flex items-center space-x-3">
                            <Code className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-mono font-semibold text-slate-200">{fr.filename}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${fileScoreTheme.bg} ${fileScoreTheme.text}`}>
                              Score: {fr.score} ({fr.risk_level.toUpperCase()})
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              {fr.vulnerabilities.length} issue(s)
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 rotate-180 transition-transform" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
                            )}
                          </div>
                        </button>

                        {/* File Accordion Body */}
                        {isExpanded && (
                          <div className="p-4 space-y-3 bg-[#0A0E17]/40">
                            {fr.vulnerabilities.length === 0 ? (
                              <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3 text-center text-xs text-emerald-300 font-mono">
                                ✓ No security vulnerabilities detected in {fr.filename}
                              </div>
                            ) : fileVulns.length === 0 ? (
                              <div className="text-xs text-slate-400 text-center py-2 font-mono">
                                No issues in this file match active severity filter.
                              </div>
                            ) : (
                              fileVulns.map((vuln, idx) => (
                                <VulnCard key={vuln.id || `file-${fr.filename}-${idx}`} vulnerability={vuln} />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single File Findings List */
                <div className="space-y-3 pt-1">
                  <h3 className="type-caption text-slate-500 uppercase font-semibold flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>Vulnerability Findings</span>
                      {selectedSeverities.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full lowercase">
                          filters: {selectedSeverities.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-slate-400 font-normal">
                      {selectedSeverities.length > 0 && (
                        <button
                          onClick={() => setSelectedSeverities([])}
                          className="type-caption text-slate-400 hover:text-white underline font-sans cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                      <span>
                        Showing {filteredVulns.length} of {vulns.length}
                      </span>
                    </div>
                  </h3>

                  {vulns.length === 0 ? (
                    <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-6 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.3))' }} />
                      <h4 className="type-title text-emerald-300">Clean Bill of Health</h4>
                      <p className="type-body text-slate-400 max-w-xs mx-auto leading-relaxed">
                        No known security flaws, injection points, or hardcoded secrets were detected in this code snippet.
                      </p>
                    </div>
                  ) : filteredVulns.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                      <p className="type-body text-slate-400">
                        No vulnerabilities matching active filters ({selectedSeverities.join(', ')}).
                      </p>
                      <button
                        onClick={() => setSelectedSeverities([])}
                        className="type-caption text-slate-300 underline hover:text-white cursor-pointer"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    filteredVulns.map((vuln, i) => (
                      <div key={vuln.id || `vuln-${i}`}>
                        <VulnCard vulnerability={vuln} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          );
        })()
      )}
    </PanelWrapper>
  );
};
