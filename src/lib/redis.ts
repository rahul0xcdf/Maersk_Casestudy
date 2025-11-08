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
    return data as T || null
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