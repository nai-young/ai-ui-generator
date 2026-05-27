export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
}

export interface LLMOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

const MAX_TOKENS = 2500;

function getEnv(name: string): string | undefined {
  const val = process.env[name];
  if (!val) return undefined;
  // Strip accidental quotes that users sometimes paste
  return val.trim().replace(/^["']|["']$/g, "");
}

async function callGroq(options: LLMOptions): Promise<LLMResponse | null> {
  const apiKey = getEnv("GROQ_API_KEY");
  if (!apiKey) return null;

  const model = getEnv("GROQ_MODEL") || "llama-3.1-70b-versatile";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.prompt },
        ],
        temperature: 0.3,
        max_tokens: options.maxTokens || MAX_TOKENS,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown");
      console.warn("Groq HTTP error:", res.status, err);
      throw new Error(`Groq API returned ${res.status}. Check your GROQ_API_KEY is valid.`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) {
      console.warn("Groq empty response:", JSON.stringify(data));
      throw new Error("Groq returned an empty response.");
    }

    return {
      text,
      provider: "groq",
      model,
    };
  } catch (e: any) {
    if (e.message?.includes("Groq")) throw e;
    console.warn("Groq network error:", e.message);
    throw new Error(`Groq request failed: ${e.message}`);
  }
}

async function callOpenRouter(options: LLMOptions): Promise<LLMResponse | null> {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return null;

  const model = getEnv("OPENROUTER_MODEL") || "meta-llama/llama-3.1-70b-instruct:free";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "http-referer": getEnv("OPENROUTER_SITE_URL") || "https://ui-generator.vercel.app",
        "x-title": "UI Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.prompt },
        ],
        temperature: 0.3,
        max_tokens: options.maxTokens || MAX_TOKENS,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown");
      console.warn("OpenRouter HTTP error:", res.status, err);
      throw new Error(`OpenRouter API returned ${res.status}. Check your OPENROUTER_API_KEY is valid.`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) {
      console.warn("OpenRouter empty response:", JSON.stringify(data));
      throw new Error("OpenRouter returned an empty response.");
    }

    return {
      text,
      provider: "openrouter",
      model,
    };
  } catch (e: any) {
    if (e.message?.includes("OpenRouter")) throw e;
    console.warn("OpenRouter network error:", e.message);
    throw new Error(`OpenRouter request failed: ${e.message}`);
  }
}

export async function generateWithLLM(options: LLMOptions): Promise<LLMResponse> {
  const hasGroq = !!getEnv("GROQ_API_KEY");
  const hasOpenRouter = !!getEnv("OPENROUTER_API_KEY");

  if (!hasGroq && !hasOpenRouter) {
    throw new Error(
      "No API keys found. Set GROQ_API_KEY or OPENROUTER_API_KEY as environment variables, then redeploy."
    );
  }

  const errors: string[] = [];

  if (hasGroq) {
    try {
      const groq = await callGroq(options);
      if (groq) return groq;
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  if (hasOpenRouter) {
    try {
      const or = await callOpenRouter(options);
      if (or) return or;
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  throw new Error(
    errors.length > 0
      ? `All providers failed:\n${errors.join("\n")}`
      : "All providers returned empty responses."
  );
}
