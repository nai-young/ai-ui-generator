import { NextResponse } from "next/server";
import { getRateLimitStatus } from "@/lib/rate-limit";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const status = getRateLimitStatus(ip);
  return NextResponse.json(status);
}
