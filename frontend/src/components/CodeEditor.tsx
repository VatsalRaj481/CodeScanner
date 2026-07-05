import React from 'react';
import { Play, RotateCcw, Trash2, Code2, ShieldAlert } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  onScan: () => void;
  onLoadDemo: () => void;
  isLoading: boolean;
}

const LANGUAGES = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'php', label: 'PHP' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  onScan,
  onLoadDemo,
  isLoading,
}) => {
  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-2xl">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0d1117] border-b border-[#30363d] gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Source Code Input</span>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#161b22] text-xs text-gray-200 border border-[#30363d] rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer font-mono"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>

          <button
            onClick={onLoadDemo}
            title="Reload intentionally vulnerable demo snippet"
            className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 rounded-lg px-3 py-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Demo</span>
          </button>

          <button
            onClick={() => setCode('')}
            title="Clear editor"
            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-red-400 bg-gray-800/40 hover:bg-red-950/30 border border-[#30363d] rounded-lg p-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 flex min-h-[400px] lg:min-h-[520px] bg-[#0d1117]/80 font-mono text-sm overflow-hidden">
        {/* Line Numbers */}
        <div className="py-4 select-none bg-[#0d1117] border-r border-[#30363d]/50 text-right pr-3 pl-2 text-gray-600 font-mono text-xs w-12 shrink-0">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste source code here to analyze security vulnerabilities..."
          spellCheck={false}
          className="w-full h-full p-4 bg-transparent text-gray-200 resize-none focus:outline-none leading-6 font-mono selection:bg-cyan-900/50 overflow-y-auto"
        />
      </div>

      {/* Editor Footer Action Bar */}
      <div className="p-4 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-400 space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse-subtle" />
          <span>Ready to perform automated static & AI vulnerability auditing</span>
        </div>

        <button
          onClick={onScan}
          disabled={isLoading || !code.trim()}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 ${
            isLoading || !code.trim()
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing Code...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Scan Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
