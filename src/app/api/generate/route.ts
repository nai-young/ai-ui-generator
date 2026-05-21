import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const filePath = path.join(process.cwd(), "CLAUDE.md");
  const system = await fs.readFile(filePath, "utf-8");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 800,
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
