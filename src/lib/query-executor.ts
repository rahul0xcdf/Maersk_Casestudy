import { supabaseAdmin } from './supabase'

// Execute SQL query using Supabase RPC function
export async function executeSQL(sql: string): Promise<{ data: any[]; columns: string[] }> {
  try {
    // Clean the SQL - remove trailing semicolons and extra whitespace
    let cleanedSQL = sql.trim()
    
    // Remove trailing semicolon if present (RPC function handles single queries)
    if (cleanedSQL.endsWith(';')) {
      cleanedSQL = cleanedSQL.slice(0, -1).trim()
    }
    
    // Ensure it's a single statement (take first statement if multiple)
    const statements = cleanedSQL.split(';').filter(s => s.trim().length > 0)
    if (statements.length > 1) {
      console.warn('Multiple SQL statements detected, using first one only')
      cleanedSQL = statements[0].trim()
    }
    
    // Try to use RPC function first
    // Note: The RPC function expects 'query_text' parameter (see db/rpc-function.sql)
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query_text: cleanedSQL
    })

    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`)
    }

    // If data is an array, use it directly
    if (Array.isArray(data)) {
      const columns = data.length > 0 ? Object.keys(data[0]) : []
      return { data, columns }
    }

    // If data is a JSON string, parse it
    if (typeof data === 'string') {
      const parsed = JSON.parse(data)
      const columns = parsed.length > 0 ? Object.keys(parsed[0]) : []
      return { data: parsed, columns }
    }

    return { data: [], columns: [] }
  } catch (error: any) {
    console.error('Query execution error:', error)
    throw error
  }
}

// Execute a simplified query using Supabase query builder (fallback)
export async function executeSimpleQuery(table: string, filters: any = {}): Promise<any[]> {
  try {
    let query = supabaseAdmin.from(table).select('*')

    // Apply filters
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Simple query execution error:', error)
    throw error
  }
}

