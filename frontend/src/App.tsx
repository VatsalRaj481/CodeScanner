import React, { useState, useEffect } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ScanResults } from './components/ScanResults';
import { scanCodeApi, ScanResponse } from './api/scanner';
import { ExternalLink, Terminal } from 'lucide-react';

const DEMO_CODE = `import sqlite3, os, hashlib

DB_PASS = "admin123"
SECRET = "jwt_secret_hardcoded"

def get_user(username):
    conn = sqlite3.connect("app.db")
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM users WHERE name = '{username}'")
    return cur.fetchone()

def run_cmd(user_input):
    os.system("ping " + user_input)

def weak_hash(password):
    return hashlib.md5(password.encode()).hexdigest()`;

export const App: React.FC = () => {
  const [code, setCode] = useState<string>(DEMO_CODE);
  const [language, setLanguage] = useState<string>('python');
  const [results, setResults] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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

  const handleScan = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await scanCodeApi(code, language);
      setResults(response);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = () => {
    setCode(DEMO_CODE);
    setLanguage('python');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col selection:bg-indigo-950/60">
      {/* ── Top Header Navigation — glass material (Apple §12) ── */}
      <header className="glass border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Shield logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {/* Apple §15: tight tracking on heading-weight text */}
                <h1 className="text-sm font-semibold text-gray-100" style={{ letterSpacing: '-0.015em' }}>
                  AI Security Scanner
                </h1>
                <span className="text-[10px] font-mono font-medium text-gray-500 border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 rounded">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-gray-500" style={{ letterSpacing: '0.01em' }}>
                Automated static code security and vulnerability auditing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Apple §1: respond on pointer-down with active:scale */}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-900/40 px-3.5 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.96]"
            >
              <span>Get Gemini API Key</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
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
              onScan={handleScan}
              onLoadDemo={handleLoadDemo}
              isLoading={isLoading}
            />
          </div>

          {/* Right Results Panel */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-[680px]">
            <ScanResults results={results} isLoading={isLoading} error={error} onLoadDemo={handleLoadDemo} />
          </div>
        </div>
      </main>

      {/* ── Footer — glass material (Apple §12) ── */}
      <footer className="glass border-t border-white/[0.06] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-gray-500" />
            <span style={{ letterSpacing: '0.01em' }}>AI Security Scanner — Production Ready Static &amp; Dynamic Analysis</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06] select-none">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'online'   ? 'bg-green-400 animate-pulse-slow' :
                backendStatus === 'checking' ? 'bg-amber-400 animate-pulse-subtle' :
                'bg-red-500'
              }`}
            />
            <span className="text-gray-500 font-medium font-mono text-[11px]" style={{ letterSpacing: '0.06em' }}>
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
