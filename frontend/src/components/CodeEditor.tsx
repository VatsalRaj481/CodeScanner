import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, Trash2, Code2, ShieldAlert, ChevronDown, Upload, FileCode, Layers, X } from 'lucide-react';
import JSZip from 'jszip';
import { FileItem } from '../api/scanner';

import { getDemoSnippet, isDemoCode } from '../demoSnippets';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  batchFiles: FileItem[];
  setBatchFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
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

const extensionToLanguageMap: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'typescript',
  php: 'php',
  java: 'java',
  go: 'go',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  language,
  setLanguage,
  batchFiles,
  setBatchFiles,
  onScan,
  onLoadDemo,
  isLoading,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleSelectLanguage = (newLangId: string) => {
    setIsDropdownOpen(false);
    setLanguage(newLangId);
    if (isDemoCode(code)) {
      setCode(getDemoSnippet(newLangId));
    }
  };

  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dragError) {
      const timer = setTimeout(() => setDragError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [dragError]);

  const detectLanguageByFilename = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ext && extensionToLanguageMap[ext] ? extensionToLanguageMap[ext] : 'auto';
  };

  // Process dropped or selected files (single file, zip, or multi-file selection)
  const processFileList = async (filesList: FileList | File[]) => {
    setDragError(null);
    const files = Array.from(filesList);
    if (files.length === 0) return;

    const MAX_SINGLE_SIZE = 1 * 1024 * 1024; // 1 MB per file
    const MAX_BATCH_SIZE = 10 * 1024 * 1024;  // 10 MB total batch cap

    // Calculate total size
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_BATCH_SIZE) {
      setDragError('Batch total size exceeds 10 MB limit.');
      return;
    }

    // Check if zip uploaded
    if (files.length === 1 && files[0].name.endsWith('.zip')) {
      try {
        const zipFile = files[0];
        if (zipFile.size > MAX_BATCH_SIZE) {
          setDragError('Zip file exceeds 10 MB limit.');
          return;
        }
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);
        const extractedFiles: FileItem[] = [];

        for (const filename of Object.keys(zipContent.files)) {
          const zipEntry = zipContent.files[filename];
          if (!zipEntry.dir && !filename.startsWith('__MACOSX/') && !filename.startsWith('.')) {
            const ext = filename.split('.').pop()?.toLowerCase();
            if (ext && extensionToLanguageMap[ext]) {
              const fileCode = await zipEntry.async('string');
              if (fileCode.trim()) {
                extractedFiles.push({
                  filename,
                  code: fileCode,
                  language: detectLanguageByFilename(filename),
                });
              }
            }
          }
        }

        if (extractedFiles.length === 0) {
          setDragError('No supported code files (.py, .js, .ts, etc.) found in zip.');
          return;
        }

        setBatchFiles(extractedFiles);
        setCode(`// Zip Archive Loaded: ${zipFile.name}\n// ${extractedFiles.length} file(s) extracted for batch security auditing.`);
        return;
      } catch (err) {
        setDragError('Failed to parse zip archive.');
        return;
      }
    }

    // Single file import
    if (files.length === 1) {
      const singleFile = files[0];
      if (singleFile.size > MAX_SINGLE_SIZE) {
        setDragError('File is too large. Max size is 1 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setBatchFiles([]);
          setCode(text);
          setLanguage(detectLanguageByFilename(singleFile.name));
        }
      };
      reader.onerror = () => setDragError('Failed to read file.');
      reader.readAsText(singleFile);
      return;
    }

    // Multi-file selection
    const batchList: FileItem[] = [];
    for (const file of files) {
      if (file.size > MAX_SINGLE_SIZE) {
        setDragError(`File ${file.name} exceeds 1 MB limit.`);
        return;
      }
      const text = await file.text();
      if (text.trim()) {
        batchList.push({
          filename: file.name,
          code: text,
          language: detectLanguageByFilename(file.name),
        });
      }
    }

    if (batchList.length > 0) {
      setBatchFiles(batchList);
      setCode(`// Batch Mode: ${batchList.length} files selected for audit:\n` + batchList.map((f) => `// - ${f.filename}`).join('\n'));
    }
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
      setIsDragging(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const clearBatchMode = () => {
    setBatchFiles([]);
    setCode('');
  };

  const selectedLang = LANGUAGES.find((lang) => lang.id === language) || LANGUAGES[0];

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-full panel-elevated rounded-2xl overflow-hidden relative"
    >
      {/* Hidden File Input supporting multiple files and zip */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) processFileList(e.target.files);
        }}
        className="hidden"
        multiple
        accept=".py,.js,.jsx,.ts,.tsx,.php,.java,.go,.sql,.sh,.bash,.zip"
      />

      {/* ── Drag-over overlay (Apple §12) ── */}
      {isDragging && (
        <div className="absolute inset-0 z-30 pointer-events-none animate-materialize rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 flex flex-col items-center justify-center space-y-3"
            style={{
              background: 'rgba(11, 15, 23, 0.92)',
              backdropFilter: 'blur(16px) saturate(160%)',
              border: '1.5px dashed rgba(100, 116, 139, 0.5)',
              borderRadius: 'inherit',
            }}
          >
            <Upload className="w-10 h-10 text-slate-300" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
            <p className="type-title text-slate-100">Drop file(s) or .zip to import</p>
            <p className="type-caption text-slate-500 font-mono">Supported: Single file, Multi-file select, or .zip archive (Max 10MB)</p>
          </div>
        </div>
      )}

      {/* ── Editor Header Bar — z-20 stacking context ── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between px-4 py-3 glass-panel border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-slate-400" />
          <span className="type-caption text-slate-400 font-semibold uppercase tracking-wider">
            {batchFiles.length > 0 ? `Batch Audit Mode (${batchFiles.length} files)` : 'Source Code Input'}
          </span>
          {batchFiles.length > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Batch
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Dropdown (Single file mode only) */}
          {batchFiles.length === 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                className="flex items-center justify-between space-x-1.5 bg-slate-900/80 text-xs text-slate-300 border border-slate-800 rounded-xl px-3 py-1.5 hover:bg-slate-800/80 focus:outline-none focus:border-slate-600 transition-all cursor-pointer font-mono btn-press"
              >
                <span>{selectedLang.label}</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200"
                  style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-[#121824] border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-materialize">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.id)}
                      className={`w-full text-left px-3.5 py-1.5 text-xs font-mono transition-all btn-press cursor-pointer ${
                        lang.id === language
                          ? 'bg-slate-700 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Load Demo button */}
          <button
            onClick={onLoadDemo}
            type="button"
            title="Reload intentionally vulnerable demo snippet"
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl px-3 py-1.5 transition-all btn-press cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Load Demo</span>
          </button>

          {/* Upload button (Single, Multi, or Zip) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            title="Upload code file(s) or zip archive"
            className="flex items-center text-xs text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-1.5 transition-all btn-press cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Clear button */}
          <button
            onClick={clearBatchMode}
            type="button"
            title="Clear editor"
            className="flex items-center text-xs text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/40 rounded-xl p-1.5 transition-all btn-press cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Editor Body — JetBrains Mono typography ── */}
      <div className="relative flex-1 flex bg-[#0A0E17]/80 font-mono text-xs overflow-hidden">
        {batchFiles.length > 0 ? (
          <div className="w-full h-full p-4 overflow-y-auto space-y-3 bg-[#0A0E17]/90">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <span className="type-caption text-slate-400 uppercase font-semibold">Batch Files Queue</span>
              <button onClick={clearBatchMode} className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer">
                <X className="w-3 h-3" /> Clear batch
              </button>
            </div>
            {batchFiles.map((item, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2.5">
                  <FileCode className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-200 font-semibold">{item.filename}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                  {item.language}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="py-4 select-none bg-[#090D14]/90 border-r border-slate-800/60 text-right pr-3 pl-2 text-slate-600 font-mono text-xs w-12 shrink-0 overflow-hidden leading-6"
            >
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              placeholder="// Paste, upload, or drag-and-drop code file(s) / .zip archive here to scan..."
              spellCheck={false}
              className="w-full h-full p-4 bg-transparent text-slate-200 resize-none focus:outline-none leading-6 font-mono selection:bg-slate-800 overflow-auto text-xs"
            />
          </>
        )}
      </div>

      {/* ── Editor Footer Action Bar ── */}
      <div className="px-4 py-3 glass-panel border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center text-xs space-x-2">
          {dragError ? (
            <>
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-rose-300 font-medium">{dragError}</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="type-caption text-slate-500 font-normal">
                {batchFiles.length > 0 ? `Ready to audit ${batchFiles.length} batch files` : 'Ready to perform static & AI security checks'}
              </span>
            </>
          )}
        </div>

        {/* Primary Scan Code Button */}
        <button
          onClick={onScan}
          type="button"
          disabled={isLoading || (batchFiles.length === 0 && !code.trim())}
          className={`flex items-center space-x-2 px-5 py-2 rounded-xl font-semibold text-xs transition-all btn-press cursor-pointer ${
            isLoading
              ? 'btn-scanning text-white shadow-lg cursor-wait'
              : (batchFiles.length === 0 && !code.trim())
              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              : 'bg-slate-100 hover:bg-white text-slate-950 shadow-md shadow-slate-900/40 active:scale-[0.97]'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="tracking-wide">Analyzing {batchFiles.length > 0 ? `${batchFiles.length} Files` : 'Code'}...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="tracking-wide">Scan {batchFiles.length > 0 ? `Batch (${batchFiles.length} Files)` : 'Code'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
