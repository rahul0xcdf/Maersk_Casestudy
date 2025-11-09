'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, MessageCircle, Database, Trash2, X } from 'lucide-react'
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
  const [pendingVisualization, setPendingVisualization] = useState<{
    sql: string
    explanation: string
    data: any[]
    columns: string[]
    visualizationType: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
    executionTime?: number
    cached?: boolean
  } | null>(null)
  const [showVisualization, setShowVisualization] = useState(false)
  const [currentVisualization, setCurrentVisualization] = useState<{
    sql: string
    explanation: string
    data: any[]
    columns: string[]
    visualizationType: 'table' | 'bar' | 'line' | 'pie' | 'map' | 'metric'
    executionTime?: number
    cached?: boolean
  } | null>(null)

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

  // Debug: Log visualization state changes
  useEffect(() => {
    console.log('Visualization state:', {
      showVisualization,
      hasCurrentVisualization: !!currentVisualization,
      hasPendingVisualization: !!pendingVisualization
    })
  }, [showVisualization, currentVisualization, pendingVisualization])

  // Clear chat history
  const clearChat = () => {
    setMessages([])
    setPendingVisualization(null)
    setShowVisualization(false)
    setCurrentVisualization(null)
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

    const userInput = input.trim().toLowerCase()
    
    // Check if user is responding to visualization prompt
    if (pendingVisualization) {
      console.log('Pending visualization exists, checking user response:', userInput)
      if (userInput === 'yes' || userInput === 'y' || userInput.startsWith('yes')) {
        console.log('User said yes, showing visualization', pendingVisualization)
        // Show visualization - use functional update to ensure state is set correctly
        setCurrentVisualization({ ...pendingVisualization })
        setShowVisualization(true)
        setPendingVisualization(null)
        
        const userMessage: ChatMessage = {
          role: 'user',
          content: input,
          timestamp: new Date()
        }
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'Opening visualization panel...',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage, assistantMessage])
        setInput('')
        return
      } else if (userInput === 'no' || userInput === 'n' || userInput.startsWith('no')) {
        console.log('User said no, dismissing visualization')
        // Don't show visualization
        setPendingVisualization(null)
        
        const userMessage: ChatMessage = {
          role: 'user',
          content: input,
          timestamp: new Date()
        }
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'Got it! The data is available if you change your mind. Feel free to ask another question.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage, assistantMessage])
        setInput('')
        return
      }
    }

    // Clear previous visualization when starting a new query
    if (pendingVisualization) {
      setPendingVisualization(null)
    }
    if (showVisualization) {
      setShowVisualization(false)
      setCurrentVisualization(null)
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
      console.log('Response data:', { 
        queryMode, 
        hasData: data.data !== undefined, 
        dataLength: data.data?.length, 
        isConversational: data.isConversational,
        error: data.error 
      })
      
      if (queryMode) {
        // Analytics Mode - check if it's conversational or has data
        // Only treat as conversational if there's no data AND it's marked as conversational
        const hasData = data.data !== undefined && Array.isArray(data.data) && data.data.length > 0
        const isConversationalOnly = data.isConversational && !hasData
        
        if (isConversationalOnly) {
          console.log('Treating as conversational response (no data)')
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
        } else if (hasData) {
          // Query response with data visualization - ask user first
          console.log('Query has data, asking user for visualization:', data.data.length, 'rows', {
            sql: data.sql,
            columns: data.columns,
            visualizationType: data.visualizationType
          })
          
          const queryResult = {
            sql: data.sql || '',
            explanation: data.explanation || '',
            data: data.data,
            columns: data.columns || [],
            visualizationType: data.visualizationType || 'table',
            executionTime: data.executionTime,
            cached: data.cached
          }
          
          // Store pending visualization
          setPendingVisualization(queryResult)
          
          // Ask user if they want to see visualization
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: `${data.explanation || 'I found the data you requested.'}\n\n**Would you like to see the visualization and SQL query?** (Type "yes" or "no")`,
            timestamp: new Date(),
            cached: data.cached
          }
          setMessages(prev => [...prev, assistantMessage])
          
          if (data.cached) {
            toast.success('Results loaded from cache')
          } else {
            toast.success(`Query executed in ${data.executionTime}ms`)
          }
        } else if (data.sql && data.sql.trim() !== '') {
          // Has SQL but no data - might be an empty result set, still show the query
          console.log('Query has SQL but no data, showing SQL anyway')
          const queryResult = {
            sql: data.sql,
            explanation: data.explanation || 'Query executed but returned no results.',
            data: [],
            columns: data.columns || [],
            visualizationType: data.visualizationType || 'table',
            executionTime: data.executionTime,
            cached: data.cached
          }
          
          setPendingVisualization(queryResult)
          
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: `${data.explanation || 'Query executed but returned no results.'}\n\n**Would you like to see the SQL query?** (Type "yes" or "no")`,
            timestamp: new Date(),
            cached: data.cached
          }
          setMessages(prev => [...prev, assistantMessage])
        } else {
          // Fallback: no data and no SQL
          console.log('Unexpected data structure:', data)
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.explanation || data.message || 'Received response but unable to process visualization.',
            timestamp: new Date(),
            cached: data.cached
          }
          setMessages(prev => [...prev, assistantMessage])
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
    <div className={`flex gap-4 h-full overflow-hidden ${className}`}>
      {/* Chat Section */}
      <Card className={`flex flex-col h-full transition-all duration-300 ${showVisualization ? 'flex-1 min-w-0' : 'flex-1'}`}>
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

      {/* Visualization Panel */}
      {showVisualization && currentVisualization && (
        <motion.div
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 500, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-shrink-0 w-[500px] h-full"
        >
          <Card className="flex flex-col h-full w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
              <CardTitle className="text-lg">Visualization & SQL</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowVisualization(false)
                  setCurrentVisualization(null)
                }}
                className="h-8 w-8 p-0"
                title="Close visualization"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0">
              <QueryResult {...currentVisualization} />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}