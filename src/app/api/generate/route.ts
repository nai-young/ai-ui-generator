import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const { prompt, format = "react" } = await req.json();

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

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `${system}

USER REQUEST:
${prompt}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;

  return NextResponse.json(JSON.parse(text));
}
