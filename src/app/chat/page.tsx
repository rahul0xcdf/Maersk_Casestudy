'use client'

import { ChatUI } from '@/components/ChatUI'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <MessageCircle className="h-10 w-10" />
            Brazilian E-Commerce Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl">
            Ask questions about the Brazilian E-Commerce Olist dataset using natural language. 
            Get instant answers with visualizations powered by AI.
          </p>
        </div>

        {/* Main Content */}
        <div>
          <ChatUI className="h-[calc(100vh-200px)]" />
        </div>
      </div>
    </div>
  )
}

