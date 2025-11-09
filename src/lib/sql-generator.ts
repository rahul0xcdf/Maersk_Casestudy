import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Google AI Studio (using API key)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Use gemini-pro for Google AI Studio (most stable)
// If this doesn't work, check available models at /api/models
const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-pro'

console.log(`[SQL Generator] Using Gemini model: ${modelName}`)

const model = genAI.getGenerativeModel({
  model: modelName,
});

// Database schema context for SQL generation
const DATABASE_SCHEMA = `
-- Brazilian E-Commerce Olist Dataset Schema

-- Customers table
CREATE TABLE olist_customers (
    customer_id VARCHAR(255) PRIMARY KEY,
    customer_unique_id VARCHAR(255) NOT NULL,
    customer_zip_code_prefix VARCHAR(10),
    customer_city VARCHAR(255),
    customer_state VARCHAR(2)
);

-- Sellers table
CREATE TABLE olist_sellers (
    seller_id VARCHAR(255) PRIMARY KEY,
    seller_zip_code_prefix VARCHAR(10),
    seller_city VARCHAR(255),
    seller_state VARCHAR(2)
);

-- Product category translations
CREATE TABLE product_category_translation (
    product_category_name VARCHAR(255) PRIMARY KEY,
    product_category_name_english VARCHAR(255)
);

-- Products table
CREATE TABLE olist_products (
    product_id VARCHAR(255) PRIMARY KEY,
    product_category_name VARCHAR(255),
    product_name_lenght INTEGER,
    product_description_lenght INTEGER,
    product_photos_qty INTEGER,
    product_weight_g INTEGER,
    product_length_cm INTEGER,
    product_height_cm INTEGER,
    product_width_cm INTEGER,
    FOREIGN KEY (product_category_name) REFERENCES product_category_translation(product_category_name)
);

-- Orders table
CREATE TABLE olist_orders (
    order_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    order_status VARCHAR(50),
    order_purchase_timestamp TIMESTAMP,
    order_approved_at TIMESTAMP,
    order_delivered_carrier_date TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES olist_customers(customer_id)
);

-- Order items table
CREATE TABLE olist_order_items (
    order_id VARCHAR(255) NOT NULL,
    order_item_id INTEGER NOT NULL,
    product_id VARCHAR(255),
    seller_id VARCHAR(255),
    shipping_limit_date TIMESTAMP,
    price DECIMAL(10, 2),
    freight_value DECIMAL(10, 2),
    PRIMARY KEY (order_id, order_item_id),
    FOREIGN KEY (order_id) REFERENCES olist_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES olist_products(product_id),
    FOREIGN KEY (seller_id) REFERENCES olist_sellers(seller_id)
);

-- Order payments table
CREATE TABLE olist_order_payments (
    order_id VARCHAR(255) NOT NULL,
    payment_sequential INTEGER NOT NULL,
    payment_type VARCHAR(50),
    payment_installments INTEGER,
    payment_value DECIMAL(10, 2),
    PRIMARY KEY (order_id, payment_sequential),
    FOREIGN KEY (order_id) REFERENCES olist_orders(order_id)
);

-- Order reviews table
CREATE TABLE olist_order_reviews (
    review_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    review_score INTEGER,
    review_comment_title TEXT,
    review_comment_message TEXT,
    review_creation_date TIMESTAMP,
    review_answer_timestamp TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES olist_orders(order_id)
);

-- Geolocation table
CREATE TABLE olist_geolocation (
    geolocation_zip_code_prefix VARCHAR(10),
    geolocation_lat DECIMAL(10, 8),
    geolocation_lng DECIMAL(11, 8),
    geolocation_city VARCHAR(255),
    geolocation_state VARCHAR(2)
);

-- Materialized view for analytics
CREATE MATERIALIZED VIEW order_summary AS
SELECT 
    o.order_id,
    o.order_status,
    o.order_purchase_timestamp,
    o.order_delivered_customer_date,
    o.order_estimated_delivery_date,
    c.customer_state,
    c.customer_city,
    SUM(oi.price) as total_price,
    SUM(oi.freight_value) as total_freight,
    SUM(oi.price + oi.freight_value) as total_value,
    SUM(op.payment_value) as total_payment,
    MAX(op.payment_type) as payment_type,
    AVG(rev.review_score) as avg_review_score,
    COUNT(DISTINCT oi.product_id) as product_count
FROM olist_orders o
LEFT JOIN olist_customers c ON o.customer_id = c.customer_id
LEFT JOIN olist_order_items oi ON o.order_id = oi.order_id
LEFT JOIN olist_order_payments op ON o.order_id = op.order_id
LEFT JOIN olist_order_reviews rev ON o.order_id = rev.order_id
GROUP BY o.order_id, o.order_status, o.order_purchase_timestamp, 
         o.order_delivered_customer_date, o.order_estimated_delivery_date,
         c.customer_state, c.customer_city;
`

export interface SQLGenerationResult {
  sql: string
  explanation: string
  visualizationType?: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
}

// SQL safety checks - only allow SELECT statements
function validateSQL(sql: string): { valid: boolean; error?: string } {
  const normalizedSQL = sql.trim().toLowerCase()
  
  // Remove SQL comments for validation (they're safe, just remove them for pattern matching)
  const sqlWithoutComments = normalizedSQL
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
  
  // Block dangerous SQL operations
  const dangerousPatterns = [
    /;\s*(drop|delete|update|insert|alter|create|truncate|grant|revoke)/i,
    /union.*select/i,
    /exec\(/i,
    /execute\(/i,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sqlWithoutComments)) {
      return { valid: false, error: 'SQL contains potentially dangerous operations' }
    }
  }
  
  // Only allow SELECT statements
  if (!sqlWithoutComments.trim().startsWith('select')) {
    return { valid: false, error: 'Only SELECT queries are allowed' }
  }
  
  return { valid: true }
}

export async function generateSQLFromQuestion(
  question: string
): Promise<SQLGenerationResult> {
  try {
    // Check if this is a greeting or non-analytics question
    const lowerQuestion = question.toLowerCase().trim()
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)$/i.test(lowerQuestion)
    
    // Data-related keywords that indicate this is a data query
    const dataKeywords = [
      'rows', 'row', 'count', 'number', 'how many', 'how much', 'total', 'sum', 'average', 'avg',
      'max', 'min', 'table', 'data', 'query', 'select', 'show', 'list', 'find', 'get',
      'sales', 'revenue', 'orders', 'products', 'customers', 'sellers', 'payments', 'delivery',
      'category', 'categories', 'state', 'month', 'year', 'quarter', 'geolocation', 'olist_',
      'customer', 'seller', 'order', 'payment', 'review', 'product'
    ]
    
    // Check if question contains data-related keywords
    const hasDataKeywords = dataKeywords.some(keyword => lowerQuestion.includes(keyword))
    
    // Check if question is asking for specific data (numbers, counts, aggregations)
    const isAskingForData = /(how many|how much|count|number of|total|sum|average|rows? in|records? in)/i.test(question)
    
    // Only treat as general question if it doesn't have data keywords and isn't asking for data
    const isGeneralQuestion = /^(what|who|when|where|why|how|explain|tell me|help|can you|what is|what are)/i.test(lowerQuestion) && 
      !hasDataKeywords && 
      !isAskingForData
    
    if (isGreeting || isGeneralQuestion) {
      // Return a conversational response instead of SQL
      return {
        sql: '',
        explanation: isGreeting 
          ? `Hello! 👋 I'm your analytics assistant for the Brazilian E-Commerce Olist dataset. I can help you explore 100k+ orders from 2016-2018. Try asking me questions like:\n\n• "Which product category sold the most in Q4 2018?"\n• "Show average delivery time by state"\n• "What's the total revenue by payment method?"\n• "Which sellers have the highest review scores?"\n\nWhat would you like to explore?`
          : `I'm here to help you analyze the Brazilian E-Commerce dataset! I can generate SQL queries and create visualizations from your questions. Try asking about:\n\n• Sales and revenue trends\n• Product categories and performance\n• Customer and seller analytics\n• Payment methods and delivery times\n• Geographic distribution of orders\n\nWhat specific analysis would you like to see?`,
        visualizationType: 'table'
      }
    }

    const prompt = `You are a SQL expert assistant for a PostgreSQL database containing Brazilian e-commerce data.

Database Schema:
${DATABASE_SCHEMA}

User Question: "${question}"

IMPORTANT INSTRUCTIONS:
1. If the question is a greeting (hi, hello, etc.) or general question not about data analysis, respond conversationally
2. If the question is about analyzing data, generate a valid PostgreSQL SELECT query
3. Use proper JOINs when accessing multiple tables
4. Use appropriate aggregate functions (COUNT, SUM, AVG, MAX, MIN) when needed
5. Format dates properly using DATE_TRUNC(), EXTRACT(), or TO_CHAR() functions
6. Limit results to a reasonable number (use LIMIT 100 for large result sets)
7. Suggest the best visualization type: 'table', 'bar', 'line', 'pie', 'map', or 'metric'
8. Provide a clear, helpful explanation of what the query does

Return your response in the following JSON format:
{
  "sql": "SELECT ...",
  "explanation": "This query...",
  "visualizationType": "bar"
}

If the question is not about data analysis, return:
{
  "sql": "",
  "explanation": "A helpful conversational response",
  "visualizationType": "table"
}

Only return the JSON object, no additional text.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    }
    
    // Try to parse JSON, handle cases where response might not be valid JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', text.substring(0, 500))
      // If JSON parsing fails, try to extract JSON object from text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {
          throw new Error(`Failed to parse JSON response from Gemini. Response: ${text.substring(0, 200)}`)
        }
      } else {
        throw new Error(`Invalid JSON response from Gemini. Response: ${text.substring(0, 200)}`)
      }
    }
    
    // If it's a conversational response (no SQL), return it
    if (!parsed.sql || parsed.sql.trim() === '') {
      return {
        sql: '',
        explanation: parsed.explanation || 'I can help you analyze the Brazilian E-Commerce dataset. What would you like to explore?',
        visualizationType: 'table'
      }
    }
    
    // Clean SQL - remove trailing semicolon for consistency
    let cleanedSQL = parsed.sql.trim()
    if (cleanedSQL.endsWith(';')) {
      cleanedSQL = cleanedSQL.slice(0, -1).trim()
    }
    
    // Validate SQL only if it exists
    const validation = validateSQL(cleanedSQL)
    if (!validation.valid) {
      console.error('SQL validation failed:', validation.error)
      console.error('Generated SQL:', cleanedSQL)
      throw new Error(validation.error || 'Invalid SQL generated')
    }
    
    return {
      sql: cleanedSQL,
      explanation: parsed.explanation || 'Query executed successfully',
      visualizationType: parsed.visualizationType || 'table'
    }
  } catch (error: any) {
    console.error('SQL generation error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      question: question?.substring(0, 100)
    })
    
    // Don't use fallback - throw the error so user sees what went wrong
    throw new Error(`Failed to generate SQL query: ${error?.message || 'Unknown error'}`)
  }
}

// Helper function to detect visualization type from query result
export function detectVisualizationType(
  data: any[],
  columns: string[]
): 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric' {
  if (!data || data.length === 0) {
    return 'table'
  }
  
  // Single row with numeric values = metric
  if (data.length === 1 && columns.some(col => typeof data[0][col] === 'number')) {
    return 'metric'
  }
  
  // Has state or city column = map
  if (columns.some(col => col.includes('state') || col.includes('city'))) {
    return 'map'
  }
  
  // Has date/timestamp column = line chart
  if (columns.some(col => col.includes('date') || col.includes('timestamp') || col.includes('month') || col.includes('year'))) {
    return 'line'
  }
  
  // 2 columns with one numeric = bar chart
  if (columns.length === 2 && typeof data[0][columns[1]] === 'number') {
    return 'bar'
  }
  
  // Multiple rows with one numeric column = pie chart if small, bar if large
  if (data.length <= 10 && columns.some(col => typeof data[0][col] === 'number')) {
    return 'pie'
  }
  
  return 'table'
}

