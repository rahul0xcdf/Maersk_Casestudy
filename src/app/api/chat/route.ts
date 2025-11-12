import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, generateChatCacheKey } from '@/lib/gemini';
import { getCachedData, setCachedData } from '@/lib/redis';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Generate cache key from question (same as query API)
function generateQueryCacheKey(question: string): string {
  const hash = crypto.createHash('sha256').update(question.toLowerCase().trim()).digest('hex')
  return `query:${hash}`
}

export async function POST(request: NextRequest) {
  try {
    const { question, includeData, history } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if this is a greeting - skip cache for greetings to avoid stale responses
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)$/i.test(question.trim())
    
    // Generate cache key for chat responses
    const cacheKey = generateChatCacheKey(question, includeData ? 'with-data' : undefined);
    
    if (!isGreeting) {
      // First, check if there's a cached query result (from Analytics Mode)
      const queryCacheKey = generateQueryCacheKey(question);
      const cachedQueryResponse = await getCachedData<any>(queryCacheKey);
      
      if (cachedQueryResponse && cachedQueryResponse.data !== undefined) {
        // Convert query response to human-friendly chat format
        let responseText = '';
        
        // Start with a natural explanation if available
        if (cachedQueryResponse.explanation) {
          responseText = cachedQueryResponse.explanation;
        }
        
        if (cachedQueryResponse.data && cachedQueryResponse.data.length > 0) {
          // Format metrics in a natural, conversational way
          if (cachedQueryResponse.visualizationType === 'metric' && cachedQueryResponse.data.length === 1) {
            const metric = cachedQueryResponse.data[0];
            const value = Object.values(metric)[0];
            const label = Object.keys(metric)[0];
            
            // Format numbers with commas for readability
            const formattedValue = typeof value === 'number' 
              ? value.toLocaleString() 
              : value;
            
            // Create a natural sentence
            if (!responseText || responseText.trim() === '') {
              // If no explanation, create one from the metric
              const labelLower = label.toLowerCase();
              if (labelLower.includes('count') || labelLower.includes('total')) {
                responseText = `There are **${formattedValue}** ${labelLower.replace(/^(total|count of|number of)\s*/i, '').replace(/\s+/g, ' ')} in the dataset.`;
              } else {
                responseText = `The **${label}** is **${formattedValue}**.`;
              }
            } else {
              // If explanation mentions counting/rows/products, create a natural summary
              const explanationLower = responseText.toLowerCase();
              if (explanationLower.includes('count') && explanationLower.includes('product')) {
                responseText = `There are **${formattedValue}** products in the dataset.`;
              } else if (explanationLower.includes('count') && explanationLower.includes('row')) {
                // Extract what is being counted from the explanation
                const match = explanationLower.match(/counts?\s+(?:the\s+)?(?:total\s+)?(?:number\s+of\s+)?(?:rows?\s+in\s+the\s+)?['"]?(\w+)/);
                if (match && match[1]) {
                  const entity = match[1].replace(/^olist_/, '');
                  responseText = `There are **${formattedValue}** ${entity} in the dataset.`;
                } else {
                  responseText = `There are **${formattedValue}** items in the dataset.`;
                }
              } else {
                // Append the metric value naturally
                responseText += `\n\nThe result is **${formattedValue}**.`;
              }
            }
          } else if (cachedQueryResponse.data.length === 1) {
            // Single row result - format it naturally
            const row = cachedQueryResponse.data[0];
            const keys = Object.keys(row);
            
            if (keys.length === 1) {
              const key = keys[0];
              const value = row[key];
              const formattedValue = typeof value === 'number' 
                ? value.toLocaleString() 
                : value;
              
              if (!responseText || responseText.trim() === '') {
                responseText = `The **${key}** is **${formattedValue}**.`;
              } else {
                responseText += `\n\nThe result is **${formattedValue}**.`;
              }
            } else {
              // Multiple columns - format as a summary
              if (!responseText || responseText.trim() === '') {
                responseText = 'Here are the results:';
              }
              responseText += '\n\n' + JSON.stringify(row, null, 2);
            }
          } else {
            // Multiple rows - provide a summary
            const rowCount = cachedQueryResponse.data.length;
            const formattedCount = rowCount.toLocaleString();
            
            if (!responseText || responseText.trim() === '') {
              responseText = `Found **${formattedCount}** result${rowCount === 1 ? '' : 's'}.`;
            } else {
              responseText += `\n\nFound **${formattedCount}** result${rowCount === 1 ? '' : 's'}.`;
            }
            
            // Show a few sample rows if there aren't too many
            if (rowCount <= 5) {
              responseText += '\n\n' + JSON.stringify(cachedQueryResponse.data, null, 2);
            } else {
              responseText += `\n\nHere are the first few results:\n\n` + JSON.stringify(cachedQueryResponse.data.slice(0, 3), null, 2);
            }
          }
        } else {
          // No data found
          if (!responseText || responseText.trim() === '') {
            responseText = 'No results found for your query.';
          } else {
            responseText += '\n\nNo matching data was found.';
          }
        }
        
        return NextResponse.json({
          response: { text: responseText },
          cached: true
        });
      }
      
      // Then check chat cache
      const cachedResponse = await getCachedData(cacheKey);
      if (cachedResponse) {
        return NextResponse.json({
          response: cachedResponse,
          cached: true
        });
      }
    }

    let context = '';

    // If data is requested, fetch some sample data from Supabase
    if (includeData) {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .limit(10);

        if (!error && orders && orders.length > 0) {
          context = `Here's some sample order data from the Brazilian E-Commerce dataset:\n${JSON.stringify(orders, null, 2)}\n\nUse this data to help answer the user's question.`;
        }
      } catch (error) {
        console.error('Supabase error:', error);
        // Continue without data if there's an error
      }
    }

    // Build conversation context from recent history (if provided)
    if (Array.isArray(history) && history.length > 0) {
      const historyText = history
        .slice(-10)
        .map((m: any) => {
          const role = m.role === 'assistant' ? 'Assistant' : 'User'
          return `${role}: ${String(m.content || '').trim()}`
        })
        .join('\n')
      context = context
        ? `${historyText}\n\n${context}`
        : historyText
    }

    // Generate response using Gemini with context from history/data
    const response = await generateChatResponse(question, context);

    // Cache the response for 1 hour (3600 seconds)
    await setCachedData(cacheKey, response, { ttl: 3600 });

    return NextResponse.json({
      response,
      cached: false
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Return detailed error message to help with debugging
    return NextResponse.json(
      { 
        error: 'Failed to process your request',
        message: error?.message || 'Unknown error',
        hint: 'Check your GOOGLE_AI_API_KEY and GEMINI_MODEL_NAME in .env.local'
      },
      { status: 500 }
    );
  }
}