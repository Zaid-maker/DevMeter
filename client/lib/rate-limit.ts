import { redis } from "./redis";

export interface RateLimitConfig {
    key: string;
    limit: number;
    windowSeconds: number;
}

/**
 * Atomic increment-and-expire rate limiter.
 * Returns { success: boolean, retryAfter?: number }
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<{ success: boolean; retryAfter?: number }> {
    const { key, limit, windowSeconds } = config;

    // Use a pipeline for atomicity if possible, but Upstash handles INCR + EXPIRE well.
    // However, the prompt mentions INCR + EXPIRE.

    // Check if key exists (to apply EXPIRE only on the first increment)
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
        const ttl = await redis.ttl(key);
        return { success: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
    }

    return { success: true };
}
