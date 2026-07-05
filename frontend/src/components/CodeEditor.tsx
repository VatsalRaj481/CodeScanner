import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, Trash2, Code2, ShieldAlert, ChevronDown } from 'lucide-react';

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
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Synchronize scrolling between textarea and line numbers gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLang = LANGUAGES.find((lang) => lang.id === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col h-full bg-[#111625] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#090d16] border-b border-[#1f293d] gap-2">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Source Code Input</span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Custom Select Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
              className="flex items-center justify-between space-x-1.5 bg-[#111625] text-xs text-gray-200 border border-[#1f293d] rounded-lg px-3 py-1.5 hover:bg-[#1f293d]/50 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-mono"
            >
              <span>{selectedLang.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-[#111625] border border-[#1f293d] rounded-lg shadow-xl z-50 overflow-hidden py-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${
                      lang.id === language
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-[#1f293d]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onLoadDemo}
            type="button"
            title="Reload intentionally vulnerable demo snippet"
            className="flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-900/40 rounded-lg px-3 py-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Demo</span>
          </button>

          <button
            onClick={() => setCode('')}
            type="button"
            title="Clear editor"
            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-red-400 bg-[#111625] hover:bg-red-950/30 border border-[#1f293d] hover:border-red-900/40 rounded-lg p-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 flex bg-[#090d16]/40 font-mono text-sm overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="py-4 select-none bg-[#090d16] border-r border-[#1f293d]/50 text-right pr-3 pl-2 text-gray-600 font-mono text-xs w-12 shrink-0 overflow-hidden"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          placeholder="// Paste source code here to analyze security vulnerabilities..."
          spellCheck={false}
          className="w-full h-full p-4 bg-transparent text-gray-200 resize-none focus:outline-none leading-6 font-mono selection:bg-indigo-950/60 overflow-auto"
        />
      </div>

      {/* Editor Footer Action Bar */}
      <div className="p-4 bg-[#111625] border-t border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-400 space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Ready to perform static & AI security checks</span>
        </div>

        <button
          onClick={onScan}
          type="button"
          disabled={isLoading || !code.trim()}
          className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
            isLoading || !code.trim()
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98 shadow-sm'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
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
