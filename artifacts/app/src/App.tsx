import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Clipboard, Download, CheckCheck, X, AlertCircle, WandSparkles } from "lucide-react";
import { cleanTranscript } from "@/lib/cleanTranscript";
import { ModeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

function TranscriptCleaner() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith('.vtt') && !file.name.endsWith('.txt')) {
      setError("Please select a .vtt or .txt file.");
      return;
    }
    
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = (e.target?.result as string) ?? "";
      // Normalize to \n
      content = content.replace(/\r\n/g, "\n");
      setInputText(content);
      setOutputText("");
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
      setFileName(null);
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
    try {
      const cleaned = cleanTranscript(inputText);
      setOutputText(cleaned);
    } catch (err) {
      setError("Failed to clean transcript. The file format might be unsupported.");
    }
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
    a.download = "cleaned_transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFile = () => {
    setFileName(null);
    setInputText("");
    setOutputText("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const inputWordCount = inputText ? inputText.split(/\s+/).filter(Boolean).length : 0;
  const outputWordCount = outputText ? outputText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <WandSparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">TranscriptClean</span>
        </div>
        <ModeToggle />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-10 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Clean your transcript instantly.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            A precise tool for researchers and writers. Paste your <span className="font-medium text-foreground">.vtt</span> or <span className="font-medium text-foreground">.txt</span> file, and we'll strip timestamps, merge speaker lines, and format the text beautifully.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="relative">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={() => setError(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6 transition-colors duration-200">
          <div
            className={`relative transition-all duration-200 ${isDragging ? "ring-2 ring-inset ring-primary bg-primary/5" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex flex-col items-center gap-3 text-primary">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="font-medium text-lg tracking-tight">Drop transcript here</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {fileName && (
              <div className="px-4 pt-4">
                <Badge variant="secondary" className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-full font-medium">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{fileName}</span>
                  <button onClick={handleClearFile} className="ml-1 hover:bg-muted p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors" data-testid="button-clear-file">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              </div>
            )}

            <Textarea
              className="w-full min-h-[220px] px-4 py-4 text-base bg-transparent resize-y border-0 focus-visible:ring-0 rounded-none placeholder:text-muted-foreground font-mono leading-relaxed"
              placeholder="Paste raw transcript here, or drag and drop a .vtt / .txt file…"
              value={inputText}
              data-testid="textarea-input"
              onChange={(e) => { 
                setInputText(e.target.value); 
                if (outputText) setOutputText(""); 
                if (fileName && e.target.value === "") setFileName(null);
              }}
            />
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-choose-file"
              >
                <Upload className="w-3.5 h-3.5" />
                Choose file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vtt,.txt"
                className="hidden"
                data-testid="input-file"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {inputWordCount > 0 && (
                <span className="text-xs text-muted-foreground font-medium tabular-nums" data-testid="text-input-word-count">
                  {inputWordCount.toLocaleString()} words
                </span>
              )}
            </div>
            <Button
              onClick={handleClean}
              disabled={!inputText.trim()}
              size="sm"
              className="h-9 gap-2 font-medium px-5"
              data-testid="button-clean"
            >
              <WandSparkles className="w-4 h-4" />
              Clean transcript
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {outputText && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              data-testid="section-output"
            >
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight">Cleaned Result</span>
                  <Badge variant="secondary" className="text-xs font-medium tabular-nums rounded-full px-2" data-testid="text-output-word-count">
                    {outputWordCount.toLocaleString()} words
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={copied ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleCopy}
                    className={`h-8 gap-1.5 text-xs font-medium transition-all ${copied ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" : ""}`}
                    data-testid="button-copy"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy text"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 gap-1.5 text-xs font-medium"
                    data-testid="button-download"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .txt
                  </Button>
                </div>
              </div>
              <Textarea
                readOnly
                className="w-full min-h-[280px] px-4 py-4 text-base bg-transparent resize-y border-0 focus-visible:ring-0 rounded-none font-mono leading-relaxed selection:bg-primary/20"
                value={outputText}
                data-testid="textarea-output"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={TranscriptCleaner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="transcript-clean-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
