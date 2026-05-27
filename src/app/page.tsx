"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mounted } from "@/components/Mounted";
import { PreviewFrame } from "@/components/PreviewFrame";
import { toast } from "sonner";
import {
  Wand2,
  History,
  Copy,
  Download,
  FileCode2,
  FileType2,
  ChevronRight,
  Sparkles,
  Trash2,
  Wifi,
  WifiOff,
  Timer,
  Loader2,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const EXAMPLES = [
  {
    title: "Pricing tiers",
    prompt:
      "a modern pricing card with 3 tiers, highlight popular plan, SaaS style with clean typography",
  },
  {
    title: "User profile",
    prompt:
      "a user profile card with avatar, name, role, stats and follow button, minimal design",
  },
  {
    title: "Login form",
    prompt:
      "a modern login form with email, password, remember me checkbox and a subtle gradient submit button",
  },
  {
    title: "Settings panel",
    prompt:
      "a settings page with sidebar navigation, toggle switches, and input fields, clean admin UI",
  },
  {
    title: "Notification dropdown",
    prompt:
      "a notification dropdown panel with unread indicators, timestamps, and dismiss actions",
  },
];

interface ProviderInfo {
  name: string;
  available: boolean;
  model?: string;
}

interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  total: number;
}

interface HistoryItem {
  title: string;
  description: string;
  code: string;
  format: "react" | "html";
  createdAt: number;
  provider?: string;
  model?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [generatingFormat, setGeneratingFormat] = useState<"react" | "html">(
    "react",
  );
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [checkingProviders, setCheckingProviders] = useState(true);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ui-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers || []);
      })
      .catch(() => setProviders([]))
      .finally(() => setCheckingProviders(false));
  }, []);

  const fetchRateLimit = useCallback(() => {
    fetch("/api/rate-limit")
      .then((r) => r.json())
      .then((data) => setRateLimit(data))
      .catch(() => setRateLimit(null));
  }, []);

  useEffect(() => {
    fetchRateLimit();
    const interval = setInterval(fetchRateLimit, 10000);
    return () => clearInterval(interval);
  }, [fetchRateLimit]);

  const activeProvider = providers.find((p) => p.available);
  const isRateLimited = rateLimit ? !rateLimit.allowed : false;

  const persistHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("ui-history", JSON.stringify(items));
  }, []);

  const generate = async (format: "react" | "html" = "react") => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setGeneratingFormat(format);
    setActiveTab("preview");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, format }),
      });

      const data = await res.json();

      if (data.rateLimit) {
        setRateLimit(data.rateLimit);
      }

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      const item: HistoryItem = {
        title: data.title || "Untitled",
        description: data.description || "",
        code: data.code || "",
        format,
        createdAt: Date.now(),
        provider: data._meta?.provider,
        model: data._meta?.model,
      };

      let i = 0;
      const interval = setInterval(() => {
        setResult({
          ...item,
          code: item.code.slice(0, i),
        });
        i++;
        if (i > item.code.length) {
          clearInterval(interval);
          setResult(item);
          setLoading(false);
          const updated = [item, ...history].slice(0, 50);
          persistHistory(updated);
        }
      }, 2);
    } catch (err: any) {
      setLoading(false);
      toast.error(
        err.message || "Something went wrong generating the component.",
      );
    }
  };

  const clearHistory = () => {
    persistHistory([]);
    toast.info("History cleared");
  };

  const deleteHistoryItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((_, i) => i !== index);
    persistHistory(updated);
  };

  const copyCode = async () => {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
    toast.success("Copied to clipboard");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const exportReact = () => {
    if (!result?.code) return;
    const filename = `${result.title.toLowerCase().replace(/\s+/g, "-")}.tsx`;
    downloadFile(result.code, filename, "text/typescript");
  };

  const exportHtml = () => {
    if (!result?.code) return;
    const filename = `${result.title.toLowerCase().replace(/\s+/g, "-")}.html`;
    downloadFile(result.code, filename, "text/html");
  };

  const syntaxLang = result?.format === "html" ? "html" : "tsx";

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <Mounted>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* HEADER */}
        <header className="border-b border-border bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-base font-bold">
                C
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight leading-none font-serif">
                  Components
                </h1>
                <p className="text-sm text-muted-foreground leading-none mt-1">
                  UI generator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!checkingProviders && (
                <div
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  title={
                    activeProvider
                      ? `Using ${activeProvider.name} (${activeProvider.model})`
                      : "No provider available"
                  }
                >
                  {activeProvider ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline">
                        {activeProvider.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-destructive" />
                      <span className="hidden sm:inline">Offline</span>
                    </>
                  )}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-64 border-r border-border bg-card/20 flex-col hidden md:flex overflow-hidden">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                <History className="w-4 h-4" />
                Recent
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 !display-flex flex-col">
              <div className="p-2 space-y-1">
                {history.length === 0 && (
                  <div className="px-3 py-10 text-center">
                    <p className="text-base text-muted-foreground leading-relaxed">
                      No history yet.
                      <br />
                      Generate something to get started.
                    </p>
                  </div>
                )}
                {history.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setResult(item);
                      setActiveTab("preview");
                    }}
                    className="text-left group relative px-3 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0 h-6 border-border/60"
                          >
                            {item.format === "html" ? "HTML" : "React"}
                          </Badge>
                          {item.provider && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {item.provider}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryItem(i, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0 mt-0.5"
                      >
                        <Trash2 className="cursor-pointer w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RATE LIMIT — sidebar footer */}
            {rateLimit && (
              <div
                className={`shrink-0 px-4 py-3 border-t border-border text-sm ${
                  isRateLimited
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Timer className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {isRateLimited
                        ? "Limit reached"
                        : `${rateLimit.remaining} of ${rateLimit.total} left`}
                    </span>
                  </div>
                  <span className="text-xs shrink-0">
                    {isRateLimited
                      ? `${Math.ceil(rateLimit.resetInSeconds / 60)}m`
                      : `${Math.ceil(rateLimit.resetInSeconds / 60)}m`}
                  </span>
                </div>
              </div>
            )}
          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
                {/* PROMPT AREA */}
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-medium">
                      What do you want to build?
                    </h2>
                    <p className="text-base text-muted-foreground">
                      Describe a UI component in plain english. Be specific
                      about layout, colors, and interactions.
                    </p>
                  </div>

                  <Card className="p-0 overflow-hidden border border-border shadow-sm">
                    <Textarea
                      className="min-h-[160px] border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4 py-4 bg-transparent"
                      placeholder="e.g. a settings panel with a sidebar, toggle switches for notifications, and a danger zone at the bottom..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          generate("react");
                        }
                      }}
                    />
                    <div className="px-3 sm:px-4 py-3 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {EXAMPLES.map((ex) => (
                          <button
                            key={ex.title}
                            onClick={() => setPrompt(ex.prompt)}
                            className="text-sm px-3 py-1.5 rounded-md bg-background border border-border hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            {ex.title}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-base gap-2 w-full sm:w-auto"
                              disabled={
                                loading || !prompt.trim() || isRateLimited
                              }
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wand2 className="w-4 h-4" />
                              )}
                              {loading
                                ? generatingFormat === "html"
                                  ? "Building HTML..."
                                  : "Building React..."
                                : isRateLimited
                                  ? "Limit reached"
                                  : "Generate"}
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => generate("react")}
                              disabled={
                                loading || !prompt.trim() || isRateLimited
                              }
                              className="text-base gap-2"
                            >
                              <FileCode2 className="w-4 h-4" />
                              As React + Tailwind
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => generate("html")}
                              disabled={
                                loading || !prompt.trim() || isRateLimited
                              }
                              className="text-base gap-2"
                            >
                              <FileType2 className="w-4 h-4" />
                              As plain HTML
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                </section>

                {/* RESULT */}
                {loading && !result && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-base text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span>
                        Generating{" "}
                        {generatingFormat === "html"
                          ? "HTML"
                          : "React component"}
                        ...
                      </span>
                    </div>
                    <Card className="h-72 bg-muted/30 border-dashed border-border" />
                  </div>
                )}

                {result && (
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-medium">{result.title}</h3>
                        <Badge
                          variant="outline"
                          className="text-sm h-7 border-border/60"
                        >
                          {result.format === "html" ? "HTML" : "React"}
                        </Badge>
                        {result.provider && (
                          <span className="text-sm text-muted-foreground capitalize">
                            {result.provider}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 text-base gap-2"
                          onClick={copyCode}
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 text-base gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={exportReact}
                              className="text-base gap-2"
                            >
                              <FileCode2 className="w-4 h-4" />
                              Export as .tsx
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={exportHtml}
                              className="text-base gap-2"
                            >
                              <FileType2 className="w-4 h-4" />
                              Export as .html
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <Tabs
                      value={activeTab}
                      onValueChange={(v) =>
                        setActiveTab(v as "preview" | "code")
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50">
                        <TabsTrigger value="preview" className="text-base h-9">
                          Preview
                        </TabsTrigger>
                        <TabsTrigger value="code" className="text-base h-9">
                          Code
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="preview" className="mt-4">
                        <Card className="p-1 border border-border bg-card/50">
                          {result.format === "html" ? (
                            <div className="rounded-md bg-white dark:bg-[#0c0a09] min-h-[280px] p-6 flex items-center justify-center overflow-auto">
                              <div
                                className="w-full"
                                dangerouslySetInnerHTML={{
                                  __html: result.code,
                                }}
                              />
                            </div>
                          ) : (
                            <PreviewFrame code={result.code} />
                          )}
                        </Card>
                        <p className="text-sm text-muted-foreground mt-3 text-center">
                          Preview rendered in an isolated container. Some
                          interactions may be limited.
                        </p>
                      </TabsContent>

                      <TabsContent value="code" className="mt-4">
                        <Card className="overflow-hidden border border-border">
                          <div className="bg-[#1e1e1e] px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                            <span className="text-sm text-white/40 font-mono">
                              {result.format === "html"
                                ? "component.html"
                                : "Component.tsx"}
                            </span>
                            <span className="text-sm text-white/40">
                              {result.code.length} chars
                            </span>
                          </div>
                          <SyntaxHighlighter
                            language={syntaxLang}
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              borderRadius: 0,
                              fontSize: "14px",
                              lineHeight: "1.6",
                              background: "#1e1e1e",
                              maxHeight: "560px",
                            }}
                            showLineNumbers
                            lineNumberStyle={{
                              fontSize: "12px",
                              color: "#4b5563",
                              minWidth: "2em",
                              paddingRight: "1em",
                            }}
                          >
                            {result.code}
                          </SyntaxHighlighter>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </section>
                )}

                {/* EMPTY STATE */}
                {!result && !loading && (
                  <div className="pt-14 pb-24 text-center space-y-5">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        Ready when you are
                      </p>
                      <p className="text-base text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                        Pick an example above or describe your own component.
                        Press Cmd+Enter to generate quickly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </Mounted>
  );
}
