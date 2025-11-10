'use client'

import { ChatUI } from '@/components/ChatUI'
import { MessageCircle, Github, Linkedin } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
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
        <div className="flex-1">
          <ChatUI className="h-[calc(100vh-200px)]" />
        </div>
      </div>
      <footer className="py-6 px-4 text-center border-t">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              Built the tool by <span className="font-semibold text-foreground">Rahul R</span>
            </p>
            <a
              href="https://github.com/rahul0xcdf/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
              aria-label="GitHub"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/rahul0xcdf/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

