/**
 * Chat and Analytics Response Handlers
 * 
 * This module handles:
 * - Detecting query types (data queries vs conversational)
 * - Formatting responses for simple numeric queries
 * - Processing chat and analytics responses
 */

export interface QueryResult {
  sql: string
  explanation: string
  data: any[]
  columns: string[]
  visualizationType: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
  executionTime?: number
  cached?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  cached?: boolean
  queryResult?: QueryResult
}

/**
 * Extract table names from SQL query
 */
export function extractTableNames(sql: string): string[] {
  if (!sql) return []
  // Match table names from FROM and JOIN clauses (handle aliases and schema prefixes)
  const tablePattern = /(?:FROM|JOIN)\s+(?:[a-z_]+\.)?([a-z_]+)(?:\s+[a-z]+)?/gi
  const matches = [...sql.matchAll(tablePattern)]
  const tables = matches
    .map(m => m[1])
    .filter(Boolean)
    .filter(t => !['select', 'where', 'group', 'order', 'limit', 'having'].includes(t.toLowerCase()))
    .map(t => t.replace(/^olist_/, '').replace(/_/g, ' '))
  return [...new Set(tables)] // Remove duplicates
}

/**
 * Check if a query result is a simple numeric answer (single value/metric)
 */
export function isSimpleNumericQuery(data: any[], visualizationType: string): boolean {
  // Simple query if:
  // 1. Single row with single column (metric)
  // 2. Visualization type is 'metric'
  // 3. Single row with 1-2 columns (simple count/value)
  if (data.length === 0) return false
  
  if (data.length === 1) {
    const row = data[0]
    const keys = Object.keys(row)
    // Single value or metric type
    if (keys.length === 1 || visualizationType === 'metric') {
      return true
    }
  }
  
  return false
}

/**
 * Generate a short SQL explanation from SQL query
 */
export function generateShortSQLExplanation(sql: string): string {
  if (!sql || sql.trim() === '') {
    return ''
  }
  
  const sqlLower = sql.toLowerCase().trim()
  
  // Extract table name
  const tableMatch = sqlLower.match(/from\s+([a-z_]+)/i)
  const tableName = tableMatch ? tableMatch[1].replace(/^olist_/, '').replace(/_/g, ' ') : 'the dataset'
  
  // Detect operation type
  if (sqlLower.includes('count(*)') || sqlLower.includes('count(')) {
    return `This data was retrieved by counting rows in the ${tableName} table.`
  }
  
  if (sqlLower.includes('sum(')) {
    return `This data was retrieved by summing values from the ${tableName} table.`
  }
  
  if (sqlLower.includes('avg(') || sqlLower.includes('average')) {
    return `This data was retrieved by calculating averages from the ${tableName} table.`
  }
  
  if (sqlLower.includes('max(') || sqlLower.includes('min(')) {
    return `This data was retrieved by finding the maximum/minimum values from the ${tableName} table.`
  }
  
  // Generic fallback
  return `This data was retrieved from the ${tableName} table.`
}

/**
 * Format a simple numeric response into a clear, conversational answer
 * Format: Metric first, then short SQL explanation
 */
export function formatSimpleNumericResponse(data: any[], explanation: string, sql?: string): string {
  if (data.length === 0) {
    return explanation || 'No data found.'
  }
  
  const row = data[0]
  const keys = Object.keys(row)
  
  if (keys.length === 1) {
    const key = keys[0]
    const value = row[key]
    const formattedValue = typeof value === 'number' 
      ? value.toLocaleString() 
      : String(value)
    
    // Create a simple, clear answer
    const keyLower = key.toLowerCase()
    
    // Build the metric answer (first part)
    let metricAnswer = ''
    
    if (keyLower.includes('count') || keyLower.includes('total') || keyLower.includes('number')) {
      // Extract what's being counted - first try from key, then from SQL
      let entity = keyLower
        .replace(/^(total|count of|number of|count)\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^rows?\s+in\s+the\s+/i, '')
        .replace(/^values?\s+in\s+the\s+/i, '')
      
      // If entity is empty or generic, try to extract from SQL
      if ((!entity || entity === 'rows' || entity === 'values') && sql) {
        const tableMatch = sql.toLowerCase().match(/from\s+([a-z_]+)/i)
        if (tableMatch) {
          entity = tableMatch[1].replace(/^olist_/, '').replace(/_/g, ' ')
        }
      }
      
      // Create natural response
      if (entity && entity.length > 0 && entity !== 'rows' && entity !== 'values') {
        metricAnswer = `There are **${formattedValue}** ${entity} in the dataset.`
      } else {
        metricAnswer = `There are **${formattedValue}** items in the dataset.`
      }
    } else {
      // Simple value response
      metricAnswer = `The **${key}** is **${formattedValue}**.`
    }
    
    // Add short SQL explanation at the end
    const sqlExplanation = sql ? generateShortSQLExplanation(sql) : ''
    
    if (sqlExplanation) {
      return `${metricAnswer}\n\n_${sqlExplanation}_`
    }
    
    return metricAnswer
  }
  
  // Fallback to explanation or simple summary
  if (explanation && explanation.length < 200) {
    return explanation
  }
  return 'Here are the results.'
}

/**
 * Detect if user is asking to analyze a visualization
 */
export function isVisualizationAnalysisRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase()
  
  // Patterns that indicate user wants to analyze/understand a visualization
  const analysisPatterns = [
    /(what|tell me|explain|describe|analyze|analyze|insight|observation|trend|pattern)/i,
    /(what does|what shows|what indicates|what means)/i,
    /(can you|please).*(explain|analyze|describe|tell).*(chart|graph|visualization|data|result)/i,
    /(what.*(see|notice|observe|find).*(in|from|about))/i,
    /(summary|conclusion|takeaway|key point)/i
  ]
  
  // Check if question contains analysis keywords and references to visualization/data
  const hasAnalysisPattern = analysisPatterns.some(pattern => pattern.test(question))
  const referencesVisualization = /(chart|graph|visualization|data|result|table|this|it)/i.test(question)
  
  return hasAnalysisPattern && referencesVisualization
}

/**
 * Generate insights from visualization data
 */
export function generateVisualizationInsights(
  data: any[],
  columns: string[],
  visualizationType: string
): string {
  if (!data || data.length === 0) {
    return 'No data available to analyze.'
  }
  
  const insights: string[] = []
  
  // For metric visualizations
  if (visualizationType === 'metric' && data.length === 1) {
    const row = data[0]
    const numericKeys = columns.filter(col => typeof row[col] === 'number')
    const stringKeys = columns.filter(col => typeof row[col] === 'string')
    
    numericKeys.forEach(key => {
      const value = row[key]
      const formattedValue = typeof value === 'number' 
        ? value.toLocaleString() 
        : String(value)
      insights.push(`The **${key.replace(/_/g, ' ')}** is **${formattedValue}**.`)
    })
    
    stringKeys.forEach(key => {
      insights.push(`The **${key.replace(/_/g, ' ')}** is **${row[key]}**.`)
    })
  }
  
  // For bar/line/pie charts
  if (['bar', 'line', 'pie'].includes(visualizationType) && columns.length >= 2) {
    const categoryCol = columns[0]
    const valueCol = columns[1]
    
    // Find top value
    const sortedData = [...data].sort((a, b) => {
      const aVal = Number(a[valueCol] || 0)
      const bVal = Number(b[valueCol] || 0)
      return bVal - aVal
    })
    
    if (sortedData.length > 0) {
      const top = sortedData[0]
      const topValue = typeof top[valueCol] === 'number' 
        ? top[valueCol].toLocaleString() 
        : top[valueCol]
      insights.push(`The highest value is **${topValue}** for **${top[categoryCol]}**.`)
    }
    
    // Calculate total if applicable
    if (visualizationType === 'pie' || visualizationType === 'bar') {
      const total = data.reduce((sum, row) => sum + (Number(row[valueCol]) || 0), 0)
      if (total > 0) {
        insights.push(`The total is **${total.toLocaleString()}**.`)
      }
    }
    
    // Find trends for line charts
    if (visualizationType === 'line' && data.length > 1) {
      const first = Number(data[0][valueCol] || 0)
      const last = Number(data[data.length - 1][valueCol] || 0)
      if (first !== last) {
        const trend = last > first ? 'increasing' : 'decreasing'
        const change = Math.abs(((last - first) / first) * 100).toFixed(1)
        insights.push(`The trend shows a **${trend}** pattern with a **${change}%** change from start to end.`)
      }
    }
  }
  
  // For tables
  if (visualizationType === 'table') {
    insights.push(`The table contains **${data.length}** rows with **${columns.length}** columns.`)
    
    // Analyze numeric columns
    const numericCols = columns.filter(col => 
      data.length > 0 && typeof data[0][col] === 'number'
    )
    
    numericCols.forEach(col => {
      const values = data.map(row => Number(row[col]) || 0).filter(v => !isNaN(v))
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = sum / values.length
        const max = Math.max(...values)
        const min = Math.min(...values)
        
        insights.push(
          `For **${col.replace(/_/g, ' ')}**: average is **${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}**, ` +
          `ranging from **${min.toLocaleString()}** to **${max.toLocaleString()}**.`
        )
      }
    })
  }
  
  return insights.length > 0 
    ? insights.join('\n\n')
    : 'The visualization shows the requested data. Would you like more specific insights?'
}

/**
 * Detect if a question is a data/analytics query (vs conversational)
 */
export function isDataQuery(question: string): boolean {
  const lowerQuestion = question.toLowerCase()
  
  // Keywords that indicate a data query
  const dataKeywords = [
    'chart', 'graph', 'visualization', 'visualize', 'pie chart', 'bar chart', 
    'line chart', 'table', 'data', 'show me', 'list', 'count', 'how many',
    'total', 'sum', 'average', 'percentage', 'percent', 'revenue', 'sales',
    'orders', 'customers', 'products', 'sellers', 'top', 'bottom', 'highest',
    'lowest', 'by', 'group by', 'aggregate', 'statistics', 'stats'
  ]
  
  // Visualization-specific patterns
  const visualizationPatterns = [
    /(pie|bar|line|chart|graph|visualization|visualize)/i,
    /(show|display|create|generate).*(chart|graph|visualization)/i,
    /(percentage|percent).*(of|for)/i,
    /(top|bottom)\s+\d+/i,
    /(count|total|sum|average|avg).*(by|of|for)/i
  ]
  
  // Check for data keywords
  const hasDataKeyword = dataKeywords.some(keyword => lowerQuestion.includes(keyword))
  
  // Check for visualization patterns
  const hasVisualizationPattern = visualizationPatterns.some(pattern => pattern.test(question))
  
  // Check if asking for specific data
  const isAskingForData = /(show|display|list|get|find|what are|how many|how much)/i.test(question) &&
                          (hasDataKeyword || hasVisualizationPattern)
  
  return hasDataKeyword || hasVisualizationPattern || isAskingForData
}

/**
 * Check if user input is responding to a visualization prompt
 */
export function isVisualizationResponse(userInput: string): 'yes' | 'no' | null {
  const lowerInput = userInput.trim().toLowerCase()
  
  if (lowerInput === 'yes' || lowerInput === 'y' || lowerInput.startsWith('yes')) {
    return 'yes'
  }
  
  if (lowerInput === 'no' || lowerInput === 'n' || lowerInput.startsWith('no')) {
    return 'no'
  }
  
  return null
}

/**
 * Process analytics/query API response
 */
export function processAnalyticsResponse(
  data: any,
  queryResult: QueryResult
): {
  message: ChatMessage
  isSimple: boolean
  shouldPromptForVisualization: boolean
} {
  const hasData = data.data !== undefined && Array.isArray(data.data) && data.data.length > 0
  const isConversationalOnly = data.isConversational && !hasData
  
  // Conversational response (no SQL/data)
  if (isConversationalOnly) {
    return {
      message: {
        role: 'assistant',
        content: data.explanation || data.message || 'No response',
        timestamp: new Date(),
        cached: data.cached
      },
      isSimple: false,
      shouldPromptForVisualization: false
    }
  }
  
  // Query response with data
  if (hasData) {
    const isSimple = isSimpleNumericQuery(data.data, data.visualizationType || 'table')
    
    if (isSimple) {
      // Simple query - show answer directly, no visualization prompt
      // Format: Metric first, then short SQL explanation
      const simpleAnswer = formatSimpleNumericResponse(
        data.data, 
        data.explanation || '', 
        data.sql || queryResult.sql
      )
      
      return {
        message: {
          role: 'assistant',
          content: simpleAnswer,
          timestamp: new Date(),
          cached: data.cached,
          queryResult: queryResult // Store query result for Analytics button
        },
        isSimple: true,
        shouldPromptForVisualization: false
      }
    } else {
      // Complex query - analyze visualization data and include SQL summary
      const insights = generateVisualizationInsights(
        queryResult.data,
        queryResult.columns,
        queryResult.visualizationType
      )
      const tableNames = extractTableNames(data.sql || '')
      const sqlSummary = generateShortSQLExplanation(data.sql || queryResult.sql)

      const sections: string[] = []

      if (insights && insights.trim().length > 0) {
        sections.push(`**Insights**\n${insights}`)
      } else if (data.explanation) {
        sections.push(data.explanation)
      }

      if (tableNames.length > 0) {
        sections.push(`📊 **Data Source:** ${tableNames.join(', ')}`)
      }

      if (sqlSummary) {
        sections.push(`_${sqlSummary}_`)
      }

      if (sections.length === 0 && data.explanation) {
        sections.push(data.explanation)
      }

      const content = sections.join('\n\n')

      return {
        message: {
          role: 'assistant',
          content: content || 'Here are the results.',
          timestamp: new Date(),
          cached: data.cached,
          queryResult
        },
        isSimple: false,
        shouldPromptForVisualization: false
      }
    }
  }
  
  // Has SQL but no data - might be an empty result set
  if (data.sql && data.sql.trim() !== '') {
    const tableNames = extractTableNames(data.sql || '')
    const sqlSummary = generateShortSQLExplanation(data.sql || queryResult.sql)

    const sections: string[] = [
      data.explanation || 'Query executed but returned no results.'
    ]

    if (tableNames.length > 0) {
      sections.push(`📊 **Data Source:** ${tableNames.join(', ')}`)
    }

    if (sqlSummary) {
      sections.push(`_${sqlSummary}_`)
    }
    
    return {
      message: {
        role: 'assistant',
        content: sections.join('\n\n'),
        timestamp: new Date(),
        cached: data.cached,
        queryResult
      },
      isSimple: false,
      shouldPromptForVisualization: false
    }
  }
  
  // Fallback: no data and no SQL
  return {
    message: {
      role: 'assistant',
      content: data.explanation || data.message || 'Received response but unable to process visualization.',
      timestamp: new Date(),
      cached: data.cached
    },
    isSimple: false,
    shouldPromptForVisualization: false
  }
}

/**
 * Process chat API response
 */
export function processChatResponse(data: any): ChatMessage {
  if (data.error) {
    return {
      role: 'assistant',
      content: `Error: ${data.message || data.error}\n\n${data.hint ? `Hint: ${data.hint}` : ''}`,
      timestamp: new Date()
    }
  }
  
  let responseContent = data.response?.text || data.message || 'No response'
  
  // Check if response is explaining how to query rather than providing actual data
  const isExplanatoryResponse = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    // Patterns that indicate the response is explaining how to query, not providing data
    const explanatoryPatterns = [
      /you can use/i,
      /you can query/i,
      /use the .* function/i,
      /use .* sql/i,
      /to find out/i,
      /you would use/i,
      /you should use/i,
      /you need to/i,
      /you'll need to/i,
      /you can run/i,
      /run a query/i,
      /execute a query/i,
      /write a query/i,
      /create a query/i,
    ]
    
    // Check if response contains explanatory patterns
    const hasExplanatoryPattern = explanatoryPatterns.some(pattern => pattern.test(text))
    
    // Check if response doesn't contain actual data (numbers, counts, results)
    const hasNoData = !/\d+/.test(text) && 
                     !lowerText.includes('result') && 
                     !lowerText.includes('found') &&
                     !lowerText.includes('there are') &&
                     !lowerText.includes('total') &&
                     !lowerText.includes('count')
    
    return hasExplanatoryPattern || (hasNoData && lowerText.includes('query'))
  }
  
  // If response is explanatory and not from cache, suggest using analytics mode
  if (isExplanatoryResponse(responseContent) && !data.cached) {
    responseContent += '\n\n💡 **Tip:** Switch to **Analytics Mode** for detailed queries and actual data results.'
  }
  
  return {
    role: 'assistant',
    content: responseContent,
    timestamp: new Date(),
    cached: data.cached
  }
}

/**
 * Create a query result object from API response
 */
export function createQueryResult(data: any): QueryResult {
  return {
    sql: data.sql || '',
    explanation: data.explanation || '',
    data: data.data || [],
    columns: data.columns || [],
    visualizationType: data.visualizationType || 'table',
    executionTime: data.executionTime,
    cached: data.cached
  }
}

