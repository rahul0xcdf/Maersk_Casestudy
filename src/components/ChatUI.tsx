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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

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

// Helper function to extract table names from SQL
function extractTableNames(sql: string): string[] {
  if (!sql) return []
  // Match table names from FROM and JOIN clauses (handle aliases and schema prefixes)
  const tablePattern = /(?:FROM|JOIN)\s+(?:[a-z_]+\.)?([a-z_]+)(?:\s+[a-z]+)?/gi
  const matches = [...sql.matchAll(tablePattern)]
  const tables = matches
    .map(m => m[1])
    .filter(Boolean)
    .filter(t => !['select', 'where', 'group', 'order', 'limit', 'having'].includes(t.toLowerCase()))
    .map(t => t.replace(/^olist_/, '').replace(/_/g, ' '))
  return [...new Set(tables)] // Remove duplicates
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

    // Detect if this is a data/visualization query even in chat mode
    const isDataQuery = (question: string): boolean => {
      const lowerQuestion = question.toLowerCase()
      
      // Keywords that indicate a data query
      const dataKeywords = [
        'chart', 'graph', 'visualization', 'visualize', 'pie chart', 'bar chart', 
        'line chart', 'table', 'data', 'show me', 'list', 'count', 'how many',
        'total', 'sum', 'average', 'percentage', 'percent', 'revenue', 'sales',
        'orders', 'customers', 'products', 'sellers', 'top', 'bottom', 'highest',
        'lowest', 'by', 'group by', 'aggregate', 'statistics', 'stats'
      ]
      
      // Visualization-specific patterns
      const visualizationPatterns = [
        /(pie|bar|line|chart|graph|visualization|visualize)/i,
        /(show|display|create|generate).*(chart|graph|visualization)/i,
        /(percentage|percent).*(of|for)/i,
        /(top|bottom)\s+\d+/i,
        /(count|total|sum|average|avg).*(by|of|for)/i
      ]
      
      // Check for data keywords
      const hasDataKeyword = dataKeywords.some(keyword => lowerQuestion.includes(keyword))
      
      // Check for visualization patterns
      const hasVisualizationPattern = visualizationPatterns.some(pattern => pattern.test(question))
      
      // Check if asking for specific data
      const isAskingForData = /(show|display|list|get|find|what are|how many|how much)/i.test(question) &&
                              (hasDataKeyword || hasVisualizationPattern)
      
      return hasDataKeyword || hasVisualizationPattern || isAskingForData
    }

    // Auto-detect data queries in chat mode and route to query API
    const shouldUseQueryAPI = queryMode || isDataQuery(input)
    
    // If we detect a data query in chat mode, automatically switch to query mode behavior
    if (!queryMode && isDataQuery(input)) {
      console.log('Detected data query in chat mode, routing to query API')
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
      // Use query API for analytics questions or detected data queries, chat API for general questions
      const endpoint = shouldUseQueryAPI ? '/api/query' : '/api/chat'
      
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
        shouldUseQueryAPI,
        hasData: data.data !== undefined, 
        dataLength: data.data?.length, 
        isConversational: data.isConversational,
        error: data.error 
      })
      
      if (shouldUseQueryAPI) {
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
          
          // Extract table names from SQL for better context
          const tableNames = extractTableNames(data.sql || '')
          const tableInfo = tableNames.length > 0 
            ? `\n\n📊 **Data Source:** ${tableNames.join(', ')}`
            : ''
          
          // Store pending visualization
          setPendingVisualization(queryResult)
          
          // Ask user if they want to see visualization
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: `${data.explanation || 'I found the data you requested.'}${tableInfo}\n\n**Would you like to see the visualization and SQL query?** (Type "yes" or "no")`,
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
          
          // Extract table names from SQL
          const tableNames = extractTableNames(data.sql || '')
          const tableInfo = tableNames.length > 0 
            ? `\n\n📊 **Data Source:** ${tableNames.join(', ')}`
            : ''
          
          setPendingVisualization(queryResult)
          
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: `${data.explanation || 'Query executed but returned no results.'}${tableInfo}\n\n**Would you like to see the SQL query?** (Type "yes" or "no")`,
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
    <div className={`h-full overflow-hidden ${className}`}>
      {showVisualization && currentVisualization ? (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={60} minSize={30} className="min-w-0">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex-shrink-0 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-4 w-4" />
                    AI Assistant
                  </CardTitle>
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      className="text-xs h-7"
                      title="Clear chat history"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0 p-4">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-2">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`rounded-lg p-2.5 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground max-w-[70%]'
                              : 'bg-muted max-w-[70%]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-medium">
                              {message.role === 'user' ? 'You' : 'AI Assistant'}
                            </span>
                            {message.cached && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Cached
                              </Badge>
                            )}
                          </div>
                          {message.content && (
                            <div className="text-xs mb-1.5 leading-relaxed [&>p]:mb-1.5 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-3 [&>ul]:text-xs [&>ol]:list-decimal [&>ol]:ml-3 [&>ol]:text-xs [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded [&>code]:text-[10px] [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:overflow-x-auto [&>pre]:text-[10px] [&>h1]:text-sm [&>h1]:font-bold [&>h2]:text-xs [&>h2]:font-bold [&>h3]:text-[10px] [&>h3]:font-bold [&>strong]:font-bold [&>em]:italic">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                            </div>
                          )}
                          <p className="text-[10px] opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {message.queryResult && (
                          <div className="w-full mt-1.5">
                            <QueryResult {...message.queryResult} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-2.5 bg-muted">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-shrink-0">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the dataset..."
                    className="min-h-[50px] max-h-[100px] resize-none flex-1 text-xs"
                    disabled={isLoading}
                  />
                  <Button
                    variant={queryMode ? "default" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => setQueryMode(!queryMode)}
                    className="h-[50px] text-xs"
                    title={queryMode ? "Switch to Chat Mode" : "Switch to Analytics Mode"}
                  >
                    <Database className="h-3 w-3 mr-1.5" />
                    Analytics
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="h-[50px] px-3 text-xs"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={25} className="min-w-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Card className="flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0 p-4">
                  <CardTitle className="text-sm">Visualization & SQL</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowVisualization(false)
                      setCurrentVisualization(null)
                    }}
                    className="h-7 w-7 p-0"
                    title="Close visualization"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto min-h-0 p-4">
                  <QueryResult {...currentVisualization} />
                </CardContent>
              </Card>
            </motion.div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4" />
                AI Assistant
              </CardTitle>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-xs h-7"
                  title="Clear chat history"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-3 min-h-0 p-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-2">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`rounded-lg p-2.5 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground max-w-[70%]'
                          : 'bg-muted max-w-[70%]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-medium">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        {message.cached && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Cached
                          </Badge>
                        )}
                      </div>
                      {message.content && (
                        <div className="text-xs mb-1.5 leading-relaxed [&>p]:mb-1.5 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:ml-3 [&>ul]:text-xs [&>ol]:list-decimal [&>ol]:ml-3 [&>ol]:text-xs [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded [&>code]:text-[10px] [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded [&>pre]:overflow-x-auto [&>pre]:text-[10px] [&>h1]:text-sm [&>h1]:font-bold [&>h2]:text-xs [&>h2]:font-bold [&>h3]:text-[10px] [&>h3]:font-bold [&>strong]:font-bold [&>em]:italic">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                        </div>
                      )}
                      <p className="text-[10px] opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.queryResult && (
                      <div className="w-full mt-1.5">
                        <QueryResult {...message.queryResult} />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-2.5 bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-shrink-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the dataset..."
                className="min-h-[50px] max-h-[100px] resize-none flex-1 text-xs"
                disabled={isLoading}
              />
              <Button
                variant={queryMode ? "default" : "outline"}
                size="sm"
                type="button"
                onClick={() => setQueryMode(!queryMode)}
                className="h-[50px] text-xs"
                title={queryMode ? "Switch to Chat Mode" : "Switch to Analytics Mode"}
              >
                <Database className="h-3 w-3 mr-1.5" />
                Analytics
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="h-[50px] px-3 text-xs"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}