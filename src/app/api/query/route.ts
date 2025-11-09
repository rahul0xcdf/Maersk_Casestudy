import { NextRequest, NextResponse } from 'next/server'
import { generateSQLFromQuestion } from '@/lib/sql-generator'
import { getCachedData, setCachedData } from '@/lib/redis'
import { executeSQL } from '@/lib/query-executor'
import crypto from 'crypto'

export interface QueryResponse {
  sql: string
  //lol
  explanation: string
  data: any[]
  columns: string[]
  visualizationType: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
  cached: boolean
  executionTime?: number
  isConversational?: boolean
}

// Generate cache key from question
function generateCacheKey(question: string): string {
  const hash = crypto.createHash('sha256').update(question.toLowerCase().trim()).digest('hex')
  return `query:${hash}`
}

export async function POST(request: NextRequest) {
  let question: string = ''
  
  try {
    const body = await request.json()
    question = body.question

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    // Check if this is a greeting - skip cache for greetings to avoid stale responses
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)$/i.test(question.trim())
    
    // Check cache first (skip for greetings)
    const cacheKey = generateCacheKey(question)
    if (!isGreeting) {
      const cachedResponse = await getCachedData<QueryResponse>(cacheKey)
      
      if (cachedResponse) {
        return NextResponse.json({
          ...cachedResponse,
          cached: true
        })
      }
    }

    const startTime = Date.now()

    // Generate SQL from question using Gemini
    const sqlResult = await generateSQLFromQuestion(question)

    // If no SQL was generated (conversational response), return it directly
    if (!sqlResult.sql || sqlResult.sql.trim() === '') {
      return NextResponse.json({
        sql: '',
        explanation: sqlResult.explanation,
        data: [],
        columns: [],
        visualizationType: 'table' as const,
        cached: false,
        executionTime: Date.now() - startTime,
        isConversational: true
      })
    }

    // Execute SQL query on Supabase
    let queryData: any[] = []
    let columns: string[] = []
    
    try {
      const result = await executeSQL(sqlResult.sql)
      queryData = result.data
      columns = result.columns
      
    } catch (error: any) {
      console.error('Query execution error:', error)
      console.error('Generated SQL:', sqlResult.sql)
      console.error('Error stack:', error.stack)
      
      // Return error with SQL for debugging
      return NextResponse.json(
        {
          error: 'Failed to execute query',
          message: error.message,
          sql: sqlResult.sql,
          explanation: sqlResult.explanation,
          hint: 'Make sure the execute_sql RPC function is set up in Supabase. See db/rpc-function.sql'
        },
        { status: 500 }
      )
    }

    const executionTime = Date.now() - startTime

    const response: QueryResponse = {
      sql: sqlResult.sql,
      explanation: sqlResult.explanation,
      data: queryData,
      columns,
      visualizationType: sqlResult.visualizationType || 'table',
      cached: false,
      executionTime
    }

    // Cache the response for 1 hour
    await setCachedData(cacheKey, response, { ttl: 3600 })

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Query API error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      question: question?.substring(0, 100)
    })
    
    return NextResponse.json(
      {
        error: 'Failed to process your query',
        message: error.message,
        hint: 'Check the server logs for more details'
      },
      { status: 500 }
    )
  }
}

