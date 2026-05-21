"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mounted } from "@/components/Mounted";

const EXAMPLES = [
  {
    title: "Pricing Card",
    prompt:
      "a modern pricing card with 3 tiers, highlight popular plan, SaaS style",
    component: (
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="border rounded-xl p-2">
          <p className="font-semibold">Starter</p>
          <p>$9</p>
        </div>

        <div className="border rounded-xl p-2 bg-primary text-primary-foreground">
          <p className="font-semibold">Pro</p>
          <p>$29</p>
        </div>

        <div className="border rounded-xl p-2">
          <p className="font-semibold">Enterprise</p>
          <p>$99</p>
        </div>
      </div>
    ),
  },
  {
    title: "User Card",
    prompt:
      "a user profile card with avatar, name, role, stats and follow button",
    component: (
      <div className="flex items-center gap-2 border rounded-xl p-2">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="flex-1">
          <p className="text-sm font-semibold">John Doe</p>
          <p className="text-xs text-muted-foreground">Frontend Dev</p>
        </div>
        <button className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
          Follow
        </button>
      </div>
    ),
  },
  {
    title: "Login Form",
    prompt:
      "a modern login form with email, password, remember me and clean UI",
    component: (
      <div className="space-y-2 border rounded-xl p-2">
        <input
          className="w-full border rounded p-1 text-xs"
          placeholder="Email"
        />
        <input
          className="w-full border rounded p-1 text-xs"
          placeholder="Password"
        />
        <button className="w-full bg-primary text-primary-foreground text-xs py-1 rounded">
          Sign in
        </button>
      </div>
    ),
  },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ui-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (item: any) => {
    const updated = [item, ...history];
    setHistory(updated);
    localStorage.setItem("ui-history", JSON.stringify(updated));
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    let i = 0;
    const interval = setInterval(() => {
      setResult({
        ...data,
        code: data.code.slice(0, i),
      });

      i++;

      if (i > data.code.length) {
        clearInterval(interval);
        setLoading(false);
        saveToHistory(data);
      }
    }, 8);
  };

  const copyCode = async () => {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
  };

  return (
    <Mounted>
      <div className="min-h-screen bg-background text-foreground">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h1 className="text-xl font-semibold">AI UI Generator</h1>
          <ThemeToggle />
        </div>

        {/* MAIN */}
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Example components
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              {EXAMPLES.map((ex) => (
                <Card
                  key={ex.title}
                  className="p-3 space-y-2 cursor-pointer hover:bg-muted transition"
                  onClick={() => setPrompt(ex.prompt)}
                >
                  <p className="text-sm font-medium">{ex.title}</p>

                  <div className="scale-[0.95] origin-top">{ex.component}</div>

                  <p className="text-[10px] text-muted-foreground">
                    {ex.prompt}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-4 space-y-4">
            <Textarea
              className="min-h-30"
              placeholder="Describe a UI component..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <Button onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate UI"}
            </Button>
          </Card>

          {!result && !loading && (
            <Card className="p-10 text-center text-muted-foreground">
              ✨ Your generated UI will appear here
            </Card>
          )}

          {result && (
            <Card className="p-4 space-y-4">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge>Result</Badge>
                  <Badge variant="secondary">{result.title}</Badge>
                </div>

                <Button size="sm" variant="secondary" onClick={copyCode}>
                  Copy
                </Button>
              </div>

              {/* TABS */}
              <Tabs defaultValue="preview">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <div
                    className="border rounded-xl p-4 bg-muted"
                    dangerouslySetInnerHTML={{
                      __html: result.code,
                    }}
                  />
                </TabsContent>

                <TabsContent value="code" className="mt-4">
                  <pre className="text-xs bg-black text-white p-4 rounded-xl overflow-auto">
                    {result.code}
                  </pre>
                </TabsContent>
              </Tabs>
            </Card>
          )}

          <Card className="p-4 space-y-2">
            <h2 className="font-semibold text-sm">History</h2>

            {history.length === 0 && (
              <p className="text-muted-foreground text-sm">No history yet</p>
            )}

            {history.map((item, i) => (
              <div
                key={i}
                className="p-2 border rounded hover:bg-muted cursor-pointer text-sm"
                onClick={() => setResult(item)}
              >
                {item.title}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Mounted>
  );
}
