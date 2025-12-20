"use client";

import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Upload, 
  ChevronDown, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Cpu, 
  Zap,
  FileCode,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

// --- MOCK DATA FOR DEMO PURPOSES ---
const MOCK_REVIEW = {
  score: 72,
  summary: "Good logic, but detected potential performance bottlenecks.",
  issues: [
    { 
      id: 1, 
      type: "critical", 
      line: 14, 
      msg: "Potential infinite loop detected in 'while' condition.", 
      fix: "Add a break condition or increment counter." 
    },
    { 
      id: 2, 
      type: "warning", 
      line: 8, 
      msg: "O(n^2) complexity found. Consider using a Set for lookup.", 
      fix: "Refactor nested loop to hash map." 
    },
    { 
      id: 3, 
      type: "style", 
      line: 22, 
      msg: "Variable 'temp_data' uses snake_case in camelCase codebase.", 
      fix: "Rename to 'tempData'." 
    }
  ]
};

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "go", label: "Go" },
];

export default function EditorPage() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Write your code here or upload a file...\n\nfunction analyzeData(input) {\n  let results = [];\n  for (let i = 0; i < input.length; i++) {\n    for (let j = 0; j < input.length; j++) {\n      if (input[i] === input[j]) {\n        results.push(input[i]);\n      }\n    }\n  }\n  return results;\n}");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);
 
  const EXT_TO_LANG = {
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    hh: "cpp",
    hxx: "cpp",
    go: "go",
  };
  const ACCEPT_EXT = ".js,.mjs,.cjs,.jsx,.py,.java,.cpp,.cc,.cxx,.hpp,.hh,.hxx,.go";
  
  // Fake AI Analysis function
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setReviewResult(null);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    
    setReviewResult(MOCK_REVIEW);
    setIsAnalyzing(false);
  };

  const handleUploadClick = () => {
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const name = file.name || "";
      const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
      const lang = EXT_TO_LANG[ext];

      if (!lang) {
        setUploadError("Unsupported file type. Allowed: JavaScript, Python, Java, C++, Go.");
        // Reset input so the same file can be chosen again
        e.target.value = "";
        return;
      }

      const text = await file.text();
      setLanguage(lang);
      setCode(text);
      setFileName(name);
      setReviewResult(null);
      setUploadError(null);
      // Allow re-selecting the same file
      e.target.value = "";
    } catch (err) {
      setUploadError("Failed to read file. Please try again.");
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: 24,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    theme: "vs-dark",
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      
      {/* --- TOP BAR --- */}
      <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#00ff9d]/10 rounded border border-[#00ff9d]/20">
              <FileCode className="w-5 h-5 text-[#00ff9d]" />
            </div>
            <span className="font-bold tracking-tight">Editor<span className="text-[#00ff9d]">.AI</span></span>
          </div>

          {/* Language Selector */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-[#00ff9d]/50 transition text-sm">
              <span className="w-2 h-2 rounded-full bg-[#00ff9d]"></span>
              {LANGUAGES.find(l => l.id === language)?.label}
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {/* Dropdown (Simplified for Demo) */}
            <div className="absolute top-full left-0 mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 hover:text-[#00ff9d] transition"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hidden file input for uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_EXT}
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>

          {fileName && (
            <span className="text-xs text-gray-500 truncate max-w-[180px]" title={fileName}>
              {fileName}
            </span>
          )}
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`
              flex items-center gap-2 px-6 py-2 text-sm font-bold text-black rounded transition-all shadow-[0_0_15px_rgba(0,255,157,0.2)]
              ${isAnalyzing ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00ff9d] hover:bg-white hover:scale-105'}
            `}
          >
            {isAnalyzing ? (
              <>Analyzing...</>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </header>

      {/* Upload error banner */}
      {uploadError && (
        <div className="px-6 py-2 bg-red-500/10 text-red-400 border-b border-red-500/20 text-sm" aria-live="polite">
          {uploadError}
        </div>
      )}

      {/* --- MAIN SPLIT LAYOUT --- */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: CODE EDITOR */}
        <section className="flex-1 border-r border-white/10 relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val)}
            options={editorOptions}
            // Customizing the editor background to match our theme (optional tweak)
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('cyberpunk', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': '#050505',
                },
              });
            }}
          />
        </section>

        {/* RIGHT: AI REVIEW PANEL */}
        <section className="w-[450px] bg-[#0a0a0a] flex flex-col border-l border-white/5 relative z-10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]">
            <h2 className="font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00ff9d]" />
              AI Review
            </h2>
            {reviewResult && (
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                reviewResult.score > 80 ? 'bg-green-500/10 text-green-400' : 
                reviewResult.score > 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
              }`}>
                Score: {reviewResult.score}/100
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800">
            <AnimatePresence mode="wait">
              
              {/* STATE: IDLE */}
              {!isAnalyzing && !reviewResult && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center text-gray-500"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm">Submit your code to receive <br/> instant AI feedback.</p>
                </motion.div>
              )}

              {/* STATE: ANALYZING */}
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                  {/* Reuse your Orbit CSS class here if available, or a simple spinner */}
                  <div className="orbit-spinner mb-6 scale-75"></div>
                  <p className="text-[#00ff9d] font-mono text-sm animate-pulse tracking-wider">
                    ANALYZING_LOGIC...
                  </p>
                </motion.div>
              )}

              {/* STATE: RESULTS */}
              {reviewResult && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Card */}
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Summary</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {reviewResult.summary}
                    </p>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold">Detected Issues</h3>
                    
                    {reviewResult.issues.map((issue, index) => (
                      <motion.div 
                        key={issue.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg bg-[#050505] border border-white/10 hover:border-white/20 transition group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {issue.type === 'critical' && <XCircle className="w-4 h-4 text-red-500" />}
                            {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                            {issue.type === 'style' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                            <span className={`text-xs font-bold uppercase ${
                              issue.type === 'critical' ? 'text-red-500' : 
                              issue.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                            }`}>
                              {issue.type}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-gray-600">Line {issue.line}</span>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3">{issue.msg}</p>
                        
                        {/* Fix Suggestion Box */}
                        <div className="bg-[#111] p-3 rounded border border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-3 h-3 text-[#00ff9d]" />
                            <span className="text-xs text-[#00ff9d] font-bold">AI Suggestion</span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{issue.fix}</p>
                        </div>

                        <button className="mt-3 w-full py-1.5 text-xs font-bold border border-[#00ff9d]/30 text-[#00ff9d] rounded hover:bg-[#00ff9d]/10 transition opacity-0 group-hover:opacity-100">
                          Auto Fix
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </section>

      </main>
    </div>
  );
}