import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, generateChatCacheKey } from '@/lib/gemini';
import { getCachedData, setCachedData } from '@/lib/redis';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { question, includeData } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = generateChatCacheKey(question, includeData ? 'with-data' : undefined);

    // Check cache first (but skip for greetings to avoid stale mock responses)
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)$/i.test(question.trim())
    
    if (!isGreeting) {
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

    // Generate response using Gemini
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