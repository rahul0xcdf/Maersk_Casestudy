import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Google AI Studio (using API key)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Helper function to list available models (for debugging)
export async function listAvailableModels() {
  try {
    const models = await genAI.listModels()
    return models
  } catch (error: any) {
    console.error('Error listing models:', error?.message || error)
    return null
  }
}

// Use gemini-pro for Google AI Studio (most stable)
// If this doesn't work, check available models at /api/models
const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-pro'

console.log(`Using Gemini model: ${modelName}`)

const model = genAI.getGenerativeModel({
  model: modelName,
});

export interface ChatResponse {
  text: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export async function generateChatResponse(
  prompt: string,
  context?: string
): Promise<ChatResponse> {
  try {
    // Build a better prompt for conversational responses
    const systemPrompt = `You are a helpful AI assistant for a Brazilian E-Commerce analytics tool. 
The tool analyzes the Olist dataset which contains 100k+ orders from 2016-2018.

Your role:
- Answer questions about the dataset and how to use the analytics tool
- Provide helpful explanations about e-commerce analytics
- Guide users on what questions they can ask
- Be friendly, concise, and helpful

When users ask greetings (hi, hello, etc.), respond warmly and explain what you can help with.
When users ask about the dataset, provide informative answers.
When users ask how to use the tool, explain the analytics features.`

    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext: ${context}\n\nUser Question: ${prompt}\n\nPlease provide a helpful, conversational response.`
      : `${systemPrompt}\n\nUser Question: ${prompt}\n\nPlease provide a helpful, conversational response.`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return {
      text,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      }
    };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      statusText: error?.statusText,
      model: modelName,
      stack: error?.stack
    });
    
    // Throw the error so it can be handled by the API route
    throw new Error(`Gemini API error: ${error?.message || 'Unknown error'}. Model: ${modelName}`);
  }
}

// Helper function to generate cache key for chat responses
export function generateChatCacheKey(prompt: string, context?: string): string {
  const baseString = context ? `${prompt}:${context}` : prompt;
  return `chat:${Buffer.from(baseString).toString('base64')}`;
}