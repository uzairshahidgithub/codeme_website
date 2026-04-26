import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

// Login: 5 attempts per 15 minutes per identifier (IP or email)
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: false,
  prefix: 'codemo:rl:login',
})

// Email verification resend: 1 per 60s per email
export const resendRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '60 s'),
  analytics: false,
  prefix: 'codemo:rl:resend',
})

// Email verification resend per hour: 5 per hour per email
export const resendHourlyRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: false,
  prefix: 'codemo:rl:resend:h',
})

// General API rate limit: 60 per minute per IP
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: false,
  prefix: 'codemo:rl:api',
})

export type RateLimitResult = {
  success: boolean
  remaining: number
  reset: number
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<RateLimitResult> {
  const { success, remaining, reset } = await limiter.limit(identifier)
  return { success, remaining, reset }
}
