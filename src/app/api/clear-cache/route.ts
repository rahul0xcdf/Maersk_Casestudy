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
    // Note: This would require implementing a pattern-based delete
    // For now, just return a message
    return NextResponse.json({ 
      message: 'To clear all cache, you can use Redis CLI or Upstash dashboard',
      hint: 'Cache keys are: query:* and chat:*'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear cache', message: error.message },
      { status: 500 }
    )
  }
}

