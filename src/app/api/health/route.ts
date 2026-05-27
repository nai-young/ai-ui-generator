import { NextResponse } from "next/server";

export async function GET() {
  const providers = [] as { name: string; available: boolean; model?: string }[];

  providers.push({
    name: "groq",
    available: !!process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
  });

  providers.push({
    name: "openrouter",
    available: !!process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-70b-instruct:free",
  });

  return NextResponse.json({ providers });
}
