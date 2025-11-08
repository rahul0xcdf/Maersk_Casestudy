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

    // Check cache first
    const cachedResponse = await getCachedData(cacheKey);
    if (cachedResponse) {
      return NextResponse.json({
        response: cachedResponse,
        cached: true
      });
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
        } else {
          // Use mock data if Supabase is not available
          context = `Here's some sample order data from the Brazilian E-Commerce dataset:
[
  {
    "order_id": "0001",
    "customer_id": "customer_1",
    "order_status": "delivered",
    "order_purchase_timestamp": "2017-10-02",
    "price": 199.90,
    "freight_value": 15.50,
    "payment_type": "credit_card",
    "payment_installments": 3,
    "payment_value": 215.40,
    "review_score": 5,
    "product_category_name": "electronics",
    "customer_city": "São Paulo",
    "customer_state": "SP"
  },
  {
    "order_id": "0002",
    "customer_id": "customer_2",
    "order_status": "shipped",
    "order_purchase_timestamp": "2017-11-15",
    "price": 89.99,
    "freight_value": 10.00,
    "payment_type": "boleto",
    "payment_installments": 1,
    "payment_value": 99.99,
    "review_score": 4,
    "product_category_name": "fashion",
    "customer_city": "Rio de Janeiro",
    "customer_state": "RJ"
  }
]

Use this data to help answer the user's question about the Brazilian E-Commerce dataset.`;
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

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}