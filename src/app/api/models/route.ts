import { NextResponse } from 'next/server'
import { listAvailableModels } from '@/lib/gemini'

// API endpoint to list available Gemini models
export async function GET() {
  try {
    const models = await listAvailableModels()
    
    if (!models) {
      return NextResponse.json(
        { error: 'Failed to list models. Check your API key.' },
        { status: 500 }
      )
    }

    // Extract model names
    const modelNames = models.map((m: any) => {
      // Model name format is usually "models/gemini-pro" or similar
      const name = m.name || m.model || ''
      return {
        name: name.replace('models/', ''),
        fullName: name,
        displayName: m.displayName || name,
        description: m.description || '',
        supportedMethods: m.supportedGenerationMethods || []
      }
    })

    return NextResponse.json({
      models: modelNames,
      count: modelNames.length
    })
  } catch (error: any) {
    console.error('Error in models API:', error)
    return NextResponse.json(
      { 
        error: error.message,
        hint: 'Make sure your GOOGLE_AI_API_KEY is set correctly'
      },
      { status: 500 }
    )
  }
}

