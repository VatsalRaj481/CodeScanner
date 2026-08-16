import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ScanResponse } from '../api/scanner';
import { History, Trash2, Clock, ChevronRight, AlertTriangle, Layers, X, Check } from 'lucide-react';

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'secure';
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  snippet_preview: string; // Truncated first 100 chars only
  file_count?: number;
  results: ScanResponse;
}

interface ScanHistoryPanelProps {
  history: ScanHistoryItem[];
  onSelectHistoryItem: (item: ScanHistoryItem) => void;
  onClearHistory: () => void;
  selectedHistoryId?: string | null;
  onClose?: () => void;
}

export const ScanHistoryPanel: React.FC<ScanHistoryPanelProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
  selectedHistoryId,
  onClose,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getRiskBadgeClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'bg-rose-950/40 text-rose-400 border-rose-800/40';
      case 'high':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
      case 'medium':
        return 'bg-yellow-950/40 text-yellow-400 border-yellow-800/40';
      case 'low':
      case 'secure':
      default:
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
    }
  };

  // Prepare data for Recharts Trend Chart (chronological order)
  const chartData = [...history].reverse().map((item, idx) => ({
    scanNumber: `#${idx + 1}`,
    score: item.score,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    risk: item.risk_level.toUpperCase(),
  }));

  const handleConfirmClear = () => {
    onClearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full panel-elevated rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 glass-panel border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-300" />
          <span className="type-caption text-slate-300 font-semibold uppercase tracking-wider">
            Audit Scan History ({history.length}/20)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {history.length > 0 && !showClearConfirm && (
            <button
              onClick={() => setShowClearConfirm(true)}
              type="button"
              className="flex items-center space-x-1 bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 rounded-xl px-2.5 py-1 text-xs font-mono transition-all btn-press cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#0B0F17]/40">
        
        {/* Apple Design Destructive Action Confirmation Banner */}
        {showClearConfirm && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3.5 space-y-2 animate-fade-up">
            <div className="flex items-center space-x-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-semibold">Clear all audit scan history?</span>
            </div>
            <p className="type-caption text-slate-400">
              This action will permanently delete all 20 stored scan metadata entries from local storage.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleConfirmClear}
                type="button"
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3 py-1 rounded-lg text-xs transition-all btn-press cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span>Yes, Clear History</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-1 rounded-lg text-xs transition-all btn-press cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-3 py-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="type-title text-slate-300">No Scan History Yet</h4>
              <p className="type-body text-slate-500 max-w-xs text-xs">
                Run single file or batch code scans to track historical security posture trends.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Recharts Risk Score Trend Line Chart ── */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 animate-fade-up">
              <div className="flex items-center justify-between">
                <span className="type-caption text-slate-400 font-semibold uppercase tracking-wider">
                  Security Risk Score Trend
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  Latest: {history[0].score}/100
                </span>
              </div>

              <div className="h-40 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="scanNumber" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#121824',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                      formatter={(val: any) => [`Score: ${val}/100`, 'Security Assessment']}
                      labelFormatter={(label: any) => `Scan ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#34D399"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#scoreAreaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Stored History Scans List ── */}
            <div className="space-y-2.5">
              <span className="type-caption text-slate-500 font-semibold uppercase tracking-wider block px-1">
                Recent Audits
              </span>

              {history.map((item) => {
                const isSelected = selectedHistoryId === item.id;
                const formattedTime = new Date(item.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectHistoryItem(item)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer btn-press flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-400'
                        : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono font-semibold text-slate-300">
                          {formattedTime}
                        </span>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.2 rounded border ${getRiskBadgeClass(item.risk_level)}`}>
                          {item.risk_level}
                        </span>
                        {item.file_count && item.file_count > 1 && (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40 flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {item.file_count} files
                          </span>
                        )}
                      </div>

                      {/* Snippet / Filename Preview Label */}
                      <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">
                        <span className="text-slate-500 font-sans font-semibold">Preview:</span> &quot;{item.snippet_preview}&quot;
                      </p>

                      {/* Issue count breakdown chips */}
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                        {item.counts.critical > 0 && <span className="text-rose-400">{item.counts.critical} crit</span>}
                        {item.counts.high > 0 && <span className="text-amber-400">{item.counts.high} high</span>}
                        {item.counts.medium > 0 && <span className="text-yellow-400">{item.counts.medium} med</span>}
                        {item.counts.low > 0 && <span className="text-sky-400">{item.counts.low} low</span>}
                        {Object.values(item.counts).every((c) => c === 0) && (
                          <span className="text-emerald-400">✓ Secure</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-sm font-bold font-mono text-slate-200">
                        {item.score}/100
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
