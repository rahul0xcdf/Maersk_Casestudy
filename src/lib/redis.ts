import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default redis

export interface CacheOptions {
  ttl?: number // Time to live in seconds (default: 3600 = 1 hour)
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    if (data) {
      // Handle case where data might be a string (JSON)
      if (typeof data === 'string') {
        try {
          return JSON.parse(data) as T
        } catch {
          return data as T
        }
      }
      return data as T
    }
    return null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCachedData<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
  try {
    const { ttl = 3600 } = options
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}

// Clear all cache keys matching a pattern (for clearing old mock responses)
export async function clearCachePattern(pattern: string): Promise<number> {
  try {
    // Note: Upstash Redis REST API doesn't support KEYS command directly
    // This is a simplified version - in production, you might want to track keys
    // For now, we'll just return 0 and log a message
    console.log(`Note: Pattern-based cache clearing not fully supported. Pattern: ${pattern}`)
    return 0
  } catch (error) {
    console.error('Redis pattern clear error:', error)
    return 0
  }
}
