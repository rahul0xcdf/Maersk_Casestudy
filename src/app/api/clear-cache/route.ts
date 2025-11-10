import { NextResponse } from 'next/server'
import { deleteCachedData } from '@/lib/redis'
import crypto from 'crypto'

// Helper to generate cache key (same as in query route)
function generateCacheKey(question: string): string {
  const hash = crypto.createHash('sha256').update(question.toLowerCase().trim()).digest('hex')
  return `query:${hash}`
}

// Helper to generate chat cache key (same as in chat route)
function generateChatCacheKey(prompt: string, context?: string): string {
  const baseString = context ? `${prompt}:${context}` : prompt
  return `chat:${Buffer.from(baseString).toString('base64')}`
}

export async function POST(request: Request) {
  try {
    const { question, mode } = await request.json()
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Delete cache based on mode
    if (mode === 'query' || mode === 'analytics') {
      const cacheKey = generateCacheKey(question)
      await deleteCachedData(cacheKey)
      return NextResponse.json({ 
        success: true, 
        message: 'Cache cleared for analytics query',
        key: cacheKey
      })
    } else {
      const cacheKey = generateChatCacheKey(question)
      await deleteCachedData(cacheKey)
      return NextResponse.json({ 
        success: true, 
        message: 'Cache cleared for chat response',
        key: cacheKey
      })
    }
  } catch (error: any) {
    console.error('Clear cache error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache', message: error.message },
      { status: 500 }
    )
  }
}

// Clear all cache (use with caution)
export async function DELETE() {
  try {
    const redis = (await import('@/lib/redis')).default
    
    // Get all keys matching patterns using SCAN
    // Upstash Redis REST API supports SCAN with pattern matching
    let deletedCount = 0
    let cursor = 0
    
    // Helper function to scan and delete keys
    const scanAndDelete = async (pattern: string): Promise<number> => {
      let count = 0
      let scanCursor = 0
      
      do {
        try {
          // Upstash Redis SCAN syntax: scan(cursor, { match: pattern, count: number })
          const result = await redis.scan(scanCursor, { match: pattern, count: 100 })
          scanCursor = typeof result[0] === 'number' ? result[0] : parseInt(result[0] as string, 10)
          const keys = Array.isArray(result[1]) ? result[1] as string[] : []
          
          if (keys.length > 0) {
            // Delete keys in batches
            await redis.del(...keys)
            count += keys.length
          }
          
          // If cursor is 0, we're done
          if (scanCursor === 0) break
        } catch (scanError: any) {
          console.error(`Error scanning pattern ${pattern}:`, scanError)
          // If SCAN is not supported, try alternative approach
          if (scanError.message?.includes('SCAN') || scanError.message?.includes('not supported')) {
            console.warn('SCAN not supported, using alternative method')
            // Fallback: return 0 and log that manual clearing may be needed
            return 0
          }
          throw scanError
        }
      } while (scanCursor !== 0)
      
      return count
    }
    
    // Clear query:* pattern
    deletedCount += await scanAndDelete('query:*')
    
    // Clear chat:* pattern
    deletedCount += await scanAndDelete('chat:*')
    
    return NextResponse.json({ 
      success: true,
      message: deletedCount > 0 
        ? `All cache cleared successfully (${deletedCount} entries)`
        : 'Cache cleared (or no cache entries found)',
      deletedCount
    })
  } catch (error: any) {
    console.error('Clear all cache error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clear cache', 
        message: error.message,
        hint: 'You may need to clear cache manually via Upstash dashboard or Redis CLI'
      },
      { status: 500 }
    )
  }
}

