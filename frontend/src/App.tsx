import React, { useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { ScanResults } from './components/ScanResults';
import { scanCodeApi, ScanResponse } from './api/scanner';
import { Shield, ExternalLink, Sparkles, Terminal } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex flex-col selection:bg-cyan-900/50">
      {/* Top Header Navigation */}
      <header className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-gray-100 tracking-tight">AI Security Scanner</h1>
                <span className="bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-gray-400">Powered by Google Gemini AI & Automated AST Security Auditing</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Gemini API Key</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Application Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Editor Panel (5 cols on lg, 6 cols on xl) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
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

          {/* Right Results Panel (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <ScanResults results={results} isLoading={isLoading} error={error} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span>AI Security Scanner — Production Ready Static & Dynamic Analysis</span>
          </div>
          <div>
            <span>Backend running on <code className="text-cyan-400 font-mono">localhost:8000</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
};
