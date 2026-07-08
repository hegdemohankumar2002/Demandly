import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redis: Redis | null = null;
let isConnected = false;

/**
 * Get or create a Redis client instance.
 * Falls back gracefully if Redis is not available.
 */
export function getRedis(): Redis | null {
  if (redis && isConnected) return redis;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      connectTimeout: 3000,
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('[REDIS] Connected successfully');
    });

    redis.on('error', (err) => {
      isConnected = false;
      // Silently fail — app works without Redis
      if (err.message.includes('ECONNREFUSED')) {
        console.log('[REDIS] Not available — running without cache');
      }
    });

    redis.on('close', () => {
      isConnected = false;
    });

    redis.connect().catch(() => {
      isConnected = false;
    });

    return redis;
  } catch {
    return null;
  }
}

/**
 * Cache helper — get a value, or compute and store it.
 * Falls back to direct computation if Redis is unavailable.
 */
export async function cacheGet<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const client = getRedis();

  if (client && isConnected) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Redis read failed — fall through to compute
    }
  }

  const value = await compute();

  if (client && isConnected) {
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Redis write failed — ignore
    }
  }

  return value;
}

/**
 * Invalidate a cache key or pattern.
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client || !isConnected) return;

  try {
    if (pattern.includes('*')) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(pattern);
    }
  } catch {
    // Ignore cache invalidation failures
  }
}

/**
 * Store real-time auction state (bid counts, current best price).
 */
export async function setAuctionState(
  poolId: string,
  state: { bidsCount: number; bestBidPrice: number | null; lastBidAt: string }
): Promise<void> {
  const client = getRedis();
  if (!client || !isConnected) return;

  try {
    await client.setex(
      `auction:${poolId}`,
      300, // 5 min TTL
      JSON.stringify(state)
    );
  } catch {}
}

/**
 * Get real-time auction state from Redis.
 */
export async function getAuctionState(
  poolId: string
): Promise<{ bidsCount: number; bestBidPrice: number | null; lastBidAt: string } | null> {
  const client = getRedis();
  if (!client || !isConnected) return null;

  try {
    const data = await client.get(`auction:${poolId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export { isConnected as redisConnected };

export async function closeRedisConnection() {
  if (redis) {
    await redis.quit();
  }
}
