import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
      openRouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
      groqModel: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
      openRouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-70b-instruct:free",
    },
  });
}
