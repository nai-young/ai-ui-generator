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

interface HistoryItem {
  title: string;
  description: string;
  code: string;
  format: "react" | "html";
  createdAt: number;
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ui-history");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

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

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const item: HistoryItem = {
        title: data.title || "Untitled",
        description: data.description || "",
        code: data.code || "",
        format,
        createdAt: Date.now(),
      };

      // Typewriter effect
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
    } catch (err) {
      setLoading(false);
      toast.error("Something went wrong generating the component.");
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

  return (
    <Mounted>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* HEADER */}
        <header className="border-b border-border bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                C
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight leading-none font-serif">
                  Components
                </h1>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  UI generator
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-60 border-r border-border bg-card/20 flex flex-col hidden md:flex">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History className="w-3.5 h-3.5" />
                Recent
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {history.length === 0 && (
                  <div className="px-3 py-8 text-center">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No history yet.
                      <br />
                      Generate something to get started.
                    </p>
                  </div>
                )}
                {history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setResult(item);
                      setActiveTab("preview");
                    }}
                    className="w-full text-left group relative px-3 py-2.5 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate pr-4">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 border-border/60"
                          >
                            {item.format === "html" ? "HTML" : "React"}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryItem(i, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-6 space-y-8">
                {/* PROMPT AREA */}
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-medium">
                      What do you want to build?
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Describe a UI component in plain english. Be specific
                      about layout, colors, and interactions.
                    </p>
                  </div>

                  <Card className="p-0 overflow-hidden border border-border shadow-sm">
                    <Textarea
                      className="min-h-30 border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm px-4 py-3 bg-transparent"
                      placeholder="e.g. a settings panel with a sidebar, toggle switches for notifications, and a danger zone at the bottom..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          generate("react");
                        }
                      }}
                    />
                    <div className="px-3 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {EXAMPLES.map((ex) => (
                          <button
                            key={ex.title}
                            onClick={() => setPrompt(ex.prompt)}
                            className="text-[11px] px-2 py-1 rounded-md bg-background border border-border hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            {ex.title}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1"
                              disabled={loading || !prompt.trim()}
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              {loading
                                ? generatingFormat === "html"
                                  ? "Building HTML..."
                                  : "Building React..."
                                : "Generate"}
                              <ChevronRight className="w-3 h-3 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => generate("react")}
                              disabled={loading || !prompt.trim()}
                              className="text-xs gap-2"
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                              As React + Tailwind
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => generate("html")}
                              disabled={loading || !prompt.trim()}
                              className="text-xs gap-2"
                            >
                              <FileType2 className="w-3.5 h-3.5" />
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
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      Generating{" "}
                      {generatingFormat === "html" ? "HTML" : "React component"}
                      ...
                    </div>
                    <Card className="h-64 bg-muted/30 border-dashed border-border" />
                  </div>
                )}

                {result && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{result.title}</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 border-border/60"
                        >
                          {result.format === "html" ? "HTML" : "React"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1.5"
                          onClick={copyCode}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={exportReact}
                              className="text-xs gap-2"
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                              Export as .tsx
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={exportHtml}
                              className="text-xs gap-2"
                            >
                              <FileType2 className="w-3.5 h-3.5" />
                              Export as .html
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50">
                        <TabsTrigger value="preview" className="text-xs h-7">
                          Preview
                        </TabsTrigger>
                        <TabsTrigger value="code" className="text-xs h-7">
                          Code
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="preview" className="mt-3">
                        <Card className="p-1 border border-border bg-card/50">
                          <div className="rounded-md bg-white dark:bg-[#0c0a09] min-h-[240px] p-6 flex items-center justify-center overflow-auto">
                            {result.format === "html" ? (
                              <div
                                className="w-full"
                                dangerouslySetInnerHTML={{
                                  __html: result.code,
                                }}
                              />
                            ) : (
                              <div
                                className="w-full"
                                dangerouslySetInnerHTML={{
                                  __html: result.code,
                                }}
                              />
                            )}
                          </div>
                        </Card>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          Preview rendered in an isolated container. Some
                          interactions may be limited.
                        </p>
                      </TabsContent>

                      <TabsContent value="code" className="mt-3">
                        <Card className="overflow-hidden border border-border">
                          <div className="bg-[#1e1e1e] px-3 py-2 flex items-center justify-between border-b border-white/5">
                            <span className="text-[10px] text-white/40 font-mono">
                              {result.format === "html"
                                ? "component.html"
                                : "Component.tsx"}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {result.code.length} chars
                            </span>
                          </div>
                          <SyntaxHighlighter
                            language={syntaxLang}
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              borderRadius: 0,
                              fontSize: "12px",
                              lineHeight: "1.6",
                              background: "#1e1e1e",
                              maxHeight: "480px",
                            }}
                            showLineNumbers
                            lineNumberStyle={{
                              fontSize: "10px",
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
                  <div className="pt-12 pb-20 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ready when you are
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
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
