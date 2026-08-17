import React, { useState, useEffect } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ScanResults } from './components/ScanResults';
import { ScanHistoryPanel, ScanHistoryItem } from './components/ScanHistoryPanel';
import { scanCodeApi, scanBatchCodeApi, ScanResponse, FileItem } from './api/scanner';
import { ExternalLink, Terminal, History } from 'lucide-react';

import { getDemoSnippet } from './demoSnippets';

export const App: React.FC = () => {
  const [code, setCode] = useState<string>(getDemoSnippet('python'));
  const [language, setLanguage] = useState<string>('python');
  const [batchFiles, setBatchFiles] = useState<FileItem[]>([]);
  const [results, setResults] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Scan history state (persisted in localStorage, max 20 entries)
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Load scan history from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_security_scan_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse scan history from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      try {
        const res = await fetch(apiBaseUrl);
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const saveToHistory = (response: ScanResponse, currentCode: string, currentBatch: FileItem[]) => {
    const vList = response.vulnerabilities || [];
    const counts = {
      critical: vList.filter((v) => v.severity.toLowerCase() === 'critical').length,
      high:     vList.filter((v) => v.severity.toLowerCase() === 'high').length,
      medium:   vList.filter((v) => v.severity.toLowerCase() === 'medium').length,
      low:      vList.filter((v) => ['low', 'info'].includes(v.severity.toLowerCase())).length,
    };

    // Store ONLY truncated preview (first ~100 chars), never full source code!
    let previewText = '';
    if (currentBatch.length > 0) {
      previewText = `Batch (${currentBatch.length} files): ` + currentBatch.map((f) => f.filename).join(', ');
    } else {
      previewText = currentCode.trim().replace(/\s+/g, ' ');
    }
    if (previewText.length > 100) {
      previewText = previewText.slice(0, 97) + '...';
    }

    const historyItem: ScanHistoryItem = {
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      score: response.score,
      risk_level: response.risk_level,
      counts,
      snippet_preview: previewText,
      file_count: response.total_files || (currentBatch.length > 0 ? currentBatch.length : 1),
      results: response,
    };

    setHistory((prev) => {
      const updated = [historyItem, ...prev].slice(0, 20); // Cap at 20 most recent
      try {
        localStorage.setItem('ai_security_scan_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save scan history to localStorage:', e);
      }
      return updated;
    });
    setSelectedHistoryId(historyItem.id);
  };

  const handleScan = async () => {
    setIsHistoryOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      if (batchFiles.length > 0) {
        const response = await scanBatchCodeApi(batchFiles);
        setResults(response);
        saveToHistory(response, code, batchFiles);
      } else {
        if (!code.trim()) {
          setIsLoading(false);
          return;
        }
        const response = await scanCodeApi(code, language);
        setResults(response);
        saveToHistory(response, code, []);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = () => {
    const targetLang = language === 'auto' ? 'python' : language;
    setCode(getDemoSnippet(targetLang));
    setBatchFiles([]);
  };

  const handleSelectHistoryItem = (item: ScanHistoryItem) => {
    setSelectedHistoryId(item.id);
    setResults(item.results);
    setIsHistoryOpen(false); // Switch to audit report view to display selected scan
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSelectedHistoryId(null);
    try {
      localStorage.removeItem('ai_security_scan_history');
    } catch (e) {
      console.error('Failed to clear scan history from localStorage:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-slate-800 selection:text-slate-100">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-slate-800/15 via-slate-900/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ── Top Header Navigation — Glass material (Apple §12) ── */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Shield Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700/60 flex items-center justify-center shadow-md shadow-black/40 shrink-0">
              <svg className="w-5 h-5 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h1 className="type-title text-slate-100 font-semibold leading-tight">
                  AI Security Scanner
                </h1>
                {/* Low-contrast pill v1.0.0 badge immediately after title */}
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal leading-tight">
                Automated static code security and vulnerability auditing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* History Toggle Button */}
            <button
              onClick={() => history.length > 0 && setIsHistoryOpen(!isHistoryOpen)}
              type="button"
              disabled={history.length === 0}
              className={`flex items-center space-x-1.5 text-xs font-medium border px-3 py-1.5 rounded-xl transition-all btn-press ${
                history.length === 0
                  ? 'opacity-50 text-slate-500 border-slate-800 bg-slate-900/40 cursor-not-allowed'
                  : isHistoryOpen
                  ? 'bg-slate-700 text-white border-slate-500 shadow-md cursor-pointer'
                  : 'text-slate-300 hover:text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 cursor-pointer'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History{history.length > 0 ? ` (${history.length})` : ''}</span>
            </button>

            {/* Secondary / Ghost button style for Get Gemini API Key */}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl transition-all btn-press hidden sm:flex"
            >
              <span>Get Gemini API Key</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Application Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Editor Panel */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-[680px]">
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              batchFiles={batchFiles}
              setBatchFiles={setBatchFiles}
              onScan={handleScan}
              onLoadDemo={handleLoadDemo}
              isLoading={isLoading}
            />
          </div>

          {/* Right Results / History Panel */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-[680px]">
            {isHistoryOpen ? (
              <ScanHistoryPanel
                history={history}
                onSelectHistoryItem={handleSelectHistoryItem}
                onClearHistory={handleClearHistory}
                selectedHistoryId={selectedHistoryId}
                onClose={() => setIsHistoryOpen(false)}
              />
            ) : (
              <ScanResults results={results} isLoading={isLoading} error={error} />
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="glass-header border-t border-slate-800/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span className="type-caption text-slate-500 font-normal">AI Security Scanner — Production Ready Static &amp; Dynamic Analysis</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 select-none">
            {/* Multi-ring ambient pulsing status dot */}
            <div className="relative w-2.5 h-2.5 flex items-center justify-center">
              <span
                className={`absolute w-full h-full rounded-full ${
                  backendStatus === 'online'   ? 'bg-emerald-400/60 animate-pulse-ring' :
                  backendStatus === 'checking' ? 'bg-amber-400/60 animate-pulse-ring' :
                  'bg-rose-500/60'
                }`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full relative z-10 ${
                  backendStatus === 'online'   ? 'bg-emerald-400' :
                  backendStatus === 'checking' ? 'bg-amber-400' :
                  'bg-rose-500'
                }`}
              />
            </div>
            <span className="text-slate-400 font-medium font-mono text-[11px] tracking-wider">
              API STATUS:{' '}
              {backendStatus === 'online'   ? 'OPERATIONAL' :
               backendStatus === 'checking' ? 'CONNECTING...' :
               'OFFLINE'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
