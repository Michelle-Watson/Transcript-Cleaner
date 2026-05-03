import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Clipboard, Download, Moon, Sparkles, CheckCheck, X } from "lucide-react";

function cleanTranscript(raw: string): string {
  let text = raw;

  // Remove WEBVTT header and cue numbers (lines that are just digits)
  text = text.replace(/^WEBVTT\s*/m, "");
  text = text.replace(/^\d+\s*$/gm, "");

  // Remove timestamps (e.g. 00:00:03.220 --> 00:00:21.379 or 0:00 --> 0:00)
  text = text.replace(/\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*-->\s*\d{1,2}:\d{2}(:\d{2})?(\.\d+)?/g, "");

  // Remove remaining standalone arrows
  text = text.replace(/--> /g, "");
  text = text.replace(/-->/g, "");

  // Replace ellipsis characters with commas
  text = text.replace(/…/g, ",");
  text = text.replace(/\.\.\./g, ",");

  // Remove blank lines and collect
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Merge consecutive speaker lines
  const speakerPattern = /^(.+?):\s+(.*)$/;
  const merged: string[] = [];
  let currentSpeaker: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const match = speakerPattern.exec(line);
    if (match) {
      const speaker = match[1];
      const content = match[2];
      if (currentSpeaker === speaker) {
        currentContent.push(content);
      } else {
        if (currentSpeaker !== null) {
          merged.push(`${currentSpeaker}: ${currentContent.join(" ")}`);
          if (speaker !== currentSpeaker) merged.push("");
        }
        currentSpeaker = speaker;
        currentContent = [content];
      }
    } else {
      if (currentSpeaker !== null) {
        currentContent.push(line);
      }
    }
  }
  if (currentSpeaker !== null) {
    merged.push(`${currentSpeaker}: ${currentContent.join(" ")}`);
  }

  return merged.join("\n").trim();
}

export function Dark() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputText((e.target?.result as string) ?? "");
      setOutputText("");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClean = () => {
    setOutputText(cleanTranscript(inputText));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned-transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFile = () => {
    setFileName(null);
    setInputText("");
    setOutputText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const wordCount = outputText ? outputText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-[#0f1117] font-['Inter']">
      {/* Header */}
      <header className="bg-[#181b25] border-b border-white/[0.07] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">TranscriptClean</span>
        </div>
        <button className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
          <Moon className="w-4 h-4" />
          <span>Dark</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            Clean your transcript in seconds
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
            Paste or upload a <span className="font-medium text-slate-200">.vtt</span> or <span className="font-medium text-slate-200">.txt</span> file.
            We'll strip timestamps, remove arrows, fix ellipses, and merge consecutive speaker lines automatically.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-[#181b25] rounded-2xl border border-white/[0.07] overflow-hidden mb-4">
          <div
            className={`relative transition-all duration-200 ${isDragging ? "ring-2 ring-inset ring-violet-500/60" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-violet-900/30 z-10 flex items-center justify-center rounded-2xl pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-violet-400" />
                  <span className="text-violet-300 font-medium text-sm">Drop your file here</span>
                </div>
              </div>
            )}

            {/* File pill */}
            {fileName && (
              <div className="px-4 pt-4">
                <div className="inline-flex items-center gap-2 bg-violet-900/40 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full border border-violet-500/30">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                  <button onClick={handleClearFile} className="ml-1 hover:text-violet-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <textarea
              className="w-full min-h-[220px] px-4 py-4 text-sm text-slate-200 bg-transparent resize-none outline-none placeholder:text-slate-600 font-mono leading-relaxed"
              placeholder="Paste your transcript here, or drag and drop a .vtt / .txt file…"
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setOutputText(""); setFileName(null); }}
            />
          </div>

          {/* Toolbar */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10"
              >
                <Upload className="w-3.5 h-3.5" />
                Choose file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vtt,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {inputText && (
                <span className="text-xs text-slate-600 ml-1">
                  {inputText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              )}
            </div>
            <button
              onClick={handleClean}
              disabled={!inputText.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Clean transcript
            </button>
          </div>
        </div>

        {/* Steps hint */}
        {!outputText && (
          <div className="flex items-center justify-center gap-6 py-2 text-xs text-slate-600 mb-2">
            {["Paste or upload", "Click Clean", "Copy or download"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/5 text-slate-500 flex items-center justify-center font-semibold text-[10px]">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output card */}
        {outputText && (
          <div className="bg-[#181b25] rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">Cleaned transcript</span>
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{wordCount.toLocaleString()} words</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${copied ? "bg-emerald-900/40 text-emerald-400 border-emerald-600/30" : "text-slate-400 border-white/[0.08] hover:bg-white/5"}`}
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy cleaned text"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </button>
              </div>
            </div>
            <textarea
              readOnly
              className="w-full min-h-[280px] px-4 py-4 text-sm text-slate-300 bg-transparent resize-y outline-none font-mono leading-relaxed"
              value={outputText}
            />
          </div>
        )}
      </main>
    </div>
  );
}
