export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  total: number;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;

export function checkRateLimit(ip: string): RateLimitStatus {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // Window expired or new IP
    const newEntry = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, newEntry);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetInSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      total: RATE_LIMIT_MAX,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(0, Math.ceil((entry.resetTime - now) / 1000)),
      total: RATE_LIMIT_MAX,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetInSeconds: Math.max(0, Math.ceil((entry.resetTime - now) / 1000)),
    total: RATE_LIMIT_MAX,
  };
}

export function getRateLimitStatus(ip: string): RateLimitStatus {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX,
      resetInSeconds: 0,
      total: RATE_LIMIT_MAX,
    };
  }

  return {
    allowed: entry.count < RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetInSeconds: Math.max(0, Math.ceil((entry.resetTime - now) / 1000)),
    total: RATE_LIMIT_MAX,
  };
}
