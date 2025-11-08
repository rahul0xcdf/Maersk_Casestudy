import { VertexAI } from '@google-cloud/vertexai'

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID!,
  location: 'us-central1', // You can change this based on your requirements
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Using the flash model for faster responses
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
    // Build the full prompt with context if provided
    const fullPrompt = context 
      ? `Context: ${context}\n\nUser Question: ${prompt}\n\nPlease provide a helpful response based on the context provided.`
      : prompt;

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
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Fallback response for development/testing
    if (process.env.NODE_ENV === 'development') {
      return {
        text: `I'm a mock AI assistant. You asked: "${prompt}". In production, this would be replaced with a real Gemini AI response.`
      };
    }
    
    throw new Error('Failed to generate AI response');
  }
}

// Helper function to generate cache key for chat responses
export function generateChatCacheKey(prompt: string, context?: string): string {
  const baseString = context ? `${prompt}:${context}` : prompt;
  return `chat:${Buffer.from(baseString).toString('base64')}`;
}