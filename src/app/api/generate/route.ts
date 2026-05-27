import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateWithLLM } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeJsonParse } from "@/lib/parse-json";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Try again in a few minutes.",
        rateLimit,
      },
      { status: 429 }
    );
  }

  const { prompt, format = "react" } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "CLAUDE.md");
  const baseSystem = await fs.readFile(filePath, "utf-8");

  let system = baseSystem;

  if (format === "html") {
    system = `
You are an expert frontend developer. Your job is to generate beautiful, modern UI components based on user requests.

## Goal
Build a UI generator that turns user prompts into standalone HTML components.

## Rules
- Always return valid semantic HTML5 with embedded CSS (in a <style> tag or inline).
- Keep UI modern, SaaS-style.
- Use only standard HTML and CSS. No external libraries.
- No JavaScript required unless specifically asked.
- Output ONLY valid JSON.
- No markdown.
- No explanations.
- No extra text.

JSON format:
{
  "title": string,
  "description": string,
  "code": string (complete HTML string)
}

## UI REQUIREMENTS:
- Modern design
- Responsive by default
- Clean spacing
- Good typography
- Self-contained HTML (works when opened in a browser)

## Code style
- Pure HTML5
- Semantic tags
- Clean structure
- No unnecessary comments
`;
  }

  try {
    const result = await generateWithLLM({
      system,
      prompt,
      maxTokens: 4000,
    });

    const parsed = safeJsonParse(result.text);

    return NextResponse.json({
      ...parsed,
      _meta: {
        provider: result.provider,
        model: result.model,
      },
      rateLimit,
    });
  } catch (err: any) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate component", rateLimit },
      { status: 500 }
    );
  }
}
