'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, MessageCircle, Database, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { QueryResult } from '@/components/QueryResult'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  cached?: boolean
  queryResult?: {
    sql: string
    explanation: string
    data: any[]
    columns: string[]
    visualizationType: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
    executionTime?: number
    cached?: boolean
  }
}

interface ChatUIProps {
  className?: string
}

const STORAGE_KEY = 'chat-history'

// Helper function to check if localStorage is available
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Helper function to save messages to localStorage
function saveMessagesToStorage(messages: ChatMessage[]): void {
  if (!isLocalStorageAvailable()) return
  
  try {
    const serialized = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString()
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
  } catch (error) {
    console.error('Failed to save chat history to localStorage:', error)
    // localStorage might be full or disabled - fail silently
  }
}

// Helper function to load messages from localStorage
function loadMessagesFromStorage(): ChatMessage[] {
  if (!isLocalStorageAvailable()) return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  } catch (error) {
    console.error('Failed to load chat history from localStorage:', error)
    return []
  }
}

export function ChatUI({ className = '' }: ChatUIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [queryMode, setQueryMode] = useState(false) // Toggle between chat and query mode (default: chat)
  const [mounted, setMounted] = useState(false)

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load messages from localStorage on mount (only on client)
  useEffect(() => {
    if (!mounted) return
    const savedMessages = loadMessagesFromStorage()
    if (savedMessages.length > 0) {
      setMessages(savedMessages)
    }
  }, [mounted])

  // Save messages to localStorage whenever they change (only on client)
  useEffect(() => {
    if (!mounted || messages.length === 0) return
    saveMessagesToStorage(messages)
  }, [messages, mounted])

  // Clear chat history
  const clearChat = () => {
    setMessages([])
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(STORAGE_KEY)
        toast.success('Chat history cleared')
      } catch (error) {
        console.error('Failed to clear chat history from localStorage:', error)
        toast.error('Failed to clear chat history')
      }
    } else {
      toast.success('Chat history cleared')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) {
      toast.error('Please enter a question')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Use query API for analytics questions, chat API for general questions
      const endpoint = queryMode ? '/api/query' : '/api/chat'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get response')
      }

      const data = await response.json()
      
      if (queryMode) {
        // Analytics Mode - check if it's conversational or has data
        if (data.isConversational || (!data.data || data.data.length === 0)) {
          // Conversational response (no SQL/data)
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.explanation || data.message || 'No response',
            timestamp: new Date(),
            cached: data.cached
          }
          setMessages(prev => [...prev, assistantMessage])
          
          if (data.cached) {
            toast.success('Response loaded from cache')
          }
        } else if (data.data !== undefined) {
          // Query response with data visualization
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.explanation || 'Here are the results:',
            timestamp: new Date(),
            cached: data.cached,
            queryResult: {
              sql: data.sql,
              explanation: data.explanation,
              data: data.data,
              columns: data.columns,
              visualizationType: data.visualizationType,
              executionTime: data.executionTime,
              cached: data.cached
            }
          }
          setMessages(prev => [...prev, assistantMessage])
          
          if (data.cached) {
            toast.success('Results loaded from cache')
          } else {
            toast.success(`Query executed in ${data.executionTime}ms`)
          }
        }
      } else {
        // Chat response
        if (data.error) {
          // Show error message
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `Error: ${data.message || data.error}\n\n${data.hint ? `Hint: ${data.hint}` : ''}`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          toast.error(data.message || data.error)
        } else {
          let responseContent = data.response?.text || data.message || 'No response'
          
          // Check if response is explaining how to query rather than providing actual data
          const isExplanatoryResponse = (text: string): boolean => {
            const lowerText = text.toLowerCase()
            // Patterns that indicate the response is explaining how to query, not providing data
            const explanatoryPatterns = [
              /you can use/i,
              /you can query/i,
              /use the .* function/i,
              /use .* sql/i,
              /to find out/i,
              /you would use/i,
              /you should use/i,
              /you need to/i,
              /you'll need to/i,
              /you can run/i,
              /run a query/i,
              /execute a query/i,
              /write a query/i,
              /create a query/i,
            ]
            
            // Check if response contains explanatory patterns
            const hasExplanatoryPattern = explanatoryPatterns.some(pattern => pattern.test(text))
            
            // Check if response doesn't contain actual data (numbers, counts, results)
            const hasNoData = !/\d+/.test(text) && 
                             !lowerText.includes('result') && 
                             !lowerText.includes('found') &&
                             !lowerText.includes('there are') &&
                             !lowerText.includes('total') &&
                             !lowerText.includes('count')
            
            return hasExplanatoryPattern || (hasNoData && lowerText.includes('query'))
          }
          
          // If response is explanatory and not from cache, suggest using analytics mode
          if (isExplanatoryResponse(responseContent) && !data.cached) {
            responseContent += '\n\n💡 **Tip:** Switch to **Analytics Mode** for detailed queries and actual data results.'
          }
          
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            cached: data.cached
          }
          setMessages(prev => [...prev, assistantMessage])
          
          if (data.cached) {
            toast.success('Response loaded from cache')
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      toast.error(error.message || 'Failed to get response. Please try again.')
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try rephrasing your question.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs"
              title="Clear chat history"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground max-w-[50%]'
                      : 'bg-muted max-w-[50%]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    {message.cached && (
                      <Badge variant="secondary" className="text-xs">
                        Cached
                      </Badge>
                    )}
                  </div>
                  {message.content && (
                    <div className="text-sm mb-2 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:overflow-x-auto [&>h1]:text-lg [&>h1]:font-bold [&>h2]:text-base [&>h2]:font-bold [&>h3]:text-sm [&>h3]:font-bold [&>strong]:font-bold [&>em]:italic">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  <p className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.queryResult && (
                  <div className="w-full mt-2">
                    <QueryResult {...message.queryResult} />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the dataset..."
            className="min-h-[60px] resize-none flex-1"
            disabled={isLoading}
          />
          <Button
            variant={queryMode ? "default" : "outline"}
            size="default"
            type="button"
            onClick={() => setQueryMode(!queryMode)}
            className="h-[60px]"
            title={queryMode ? "Switch to Chat Mode" : "Switch to Analytics Mode"}
          >
            <Database className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="h-[60px] px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}