import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Clipboard, Download, Sun, Sparkles, CheckCheck, X } from "lucide-react";

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

  // Remove blank lines
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

export function Light() {
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
    <div className="min-h-screen bg-slate-50 font-['Inter']">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">TranscriptClean</span>
        </div>
        <button className="flex items-center gap-1.5 text-slate-500 text-sm hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100">
          <Sun className="w-4 h-4" />
          <span>Light</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
            Clean your transcript in seconds
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl mx-auto">
            Paste or upload a <span className="font-medium text-slate-700">.vtt</span> or <span className="font-medium text-slate-700">.txt</span> file.
            We'll strip timestamps, remove arrows, fix ellipses, and merge consecutive speaker lines automatically.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          {/* Drag overlay hint */}
          <div
            className={`relative transition-all duration-200 ${isDragging ? "ring-2 ring-inset ring-indigo-400" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isDragging && (
              <div className="absolute inset-0 bg-indigo-50/80 z-10 flex items-center justify-center rounded-2xl pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-indigo-500" />
                  <span className="text-indigo-600 font-medium text-sm">Drop your file here</span>
                </div>
              </div>
            )}

            {/* File pill */}
            {fileName && (
              <div className="px-4 pt-4">
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-200">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                  <button onClick={handleClearFile} className="ml-1 hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <textarea
              className="w-full min-h-[220px] px-4 py-4 text-sm text-slate-700 bg-transparent resize-none outline-none placeholder:text-slate-400 font-mono leading-relaxed"
              placeholder="Paste your transcript here, or drag and drop a .vtt / .txt file…"
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setOutputText(""); setFileName(null); }}
            />
          </div>

          {/* Toolbar */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
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
                <span className="text-xs text-slate-400 ml-1">
                  {inputText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              )}
            </div>
            <button
              onClick={handleClean}
              disabled={!inputText.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
              <Sparkles className="w-4 h-4" />
              Clean transcript
            </button>
          </div>
        </div>

        {/* Steps hint (shown when empty) */}
        {!outputText && (
          <div className="flex items-center justify-center gap-6 py-2 text-xs text-slate-400 mb-2">
            {["Paste or upload", "Click Clean", "Copy or download"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-semibold text-[10px]">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output card */}
        {outputText && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">Cleaned transcript</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{wordCount.toLocaleString()} words</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy cleaned text"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </button>
              </div>
            </div>
            <textarea
              readOnly
              className="w-full min-h-[280px] px-4 py-4 text-sm text-slate-700 bg-transparent resize-y outline-none font-mono leading-relaxed"
              value={outputText}
            />
          </div>
        )}
      </main>
    </div>
  );
}
