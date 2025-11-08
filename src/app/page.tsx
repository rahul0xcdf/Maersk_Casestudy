'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatUI } from '@/components/ChatUI'
import { MessageCircle } from 'lucide-react'

export default function Home() {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChatUI className="h-[calc(100vh-200px)]" />
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Try asking these questions:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    "Which product category sold the most in Q4 2018?"
                  </div>
                  <div className="p-2 bg-muted rounded">
                    "Show average delivery time by state"
                  </div>
                  <div className="p-2 bg-muted rounded">
                    "Which sellers have the highest review scores?"
                  </div>
                  <div className="p-2 bg-muted rounded">
                    "What's the total revenue by payment method?"
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dataset Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span>2016-2018</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orders:</span>
                  <span>100k+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markets:</span>
                  <span>Multiple</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coverage:</span>
                  <span>Brazil</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}