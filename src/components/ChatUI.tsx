'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, MessageCircle, Database, Trash2, X, BarChart3, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { QueryResult } from '@/components/QueryResult'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import {
  extractTableNames,
  isSimpleNumericQuery,
  formatSimpleNumericResponse,
  isDataQuery,
  isVisualizationResponse,
  isVisualizationAnalysisRequest,
  generateVisualizationInsights,
  processAnalyticsResponse,
  processChatResponse,
  createQueryResult,
  type QueryResult as QueryResultType,
  type ChatMessage
} from '@/lib/chat-handlers'

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
  const [pendingVisualization, setPendingVisualization] = useState<QueryResultType | null>(null)
  const [showVisualization, setShowVisualization] = useState(false)
  const [currentVisualization, setCurrentVisualization] = useState<QueryResultType | null>(null)
  const [activeAnalyticsMessageIndex, setActiveAnalyticsMessageIndex] = useState<number | null>(null)
  const [isClearingCache, setIsClearingCache] = useState(false)

  // Example prompts for first-time/empty state
  const examplePrompts: string[] = [
    'Show me revenue trends by month',
    'Which product categories perform best?',
    'What payment methods are most popular?',
    'What are the top customer locations?',
  ]

  // Refs for messages containers to enable auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

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
    setActiveAnalyticsMessageIndex(null)
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

  // Clear Redis cache
  const clearCache = async () => {
    setIsClearingCache(true)
    try {
      const response = await fetch('/api/clear-cache', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear cache')
      }

      toast.success(data.message || `Cache cleared successfully (${data.deletedCount || 0} entries)`)
    } catch (error: any) {
      console.error('Clear cache error:', error)
      toast.error(error.message || 'Failed to clear cache')
    } finally {
      setIsClearingCache(false)
    }
  }

  // Find the latest assistant message with analytics result
  const getLatestAnalyticsMessage = (): { index: number, result: QueryResultType } | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg && msg.role === 'assistant' && msg.queryResult) {
        return { index: i, result: msg.queryResult }
      }
    }
    return null
  }

  // Toggle analytics pane visibility; when opening, show latest result if available
  const toggleAnalyticsPane = () => {
    if (showVisualization) {
      setShowVisualization(false)
      setCurrentVisualization(null)
      setActiveAnalyticsMessageIndex(null)
      return
    }
    const latest = getLatestAnalyticsMessage()
    if (latest) {
      setCurrentVisualization(latest.result)
      setShowVisualization(true)
      setActiveAnalyticsMessageIndex(latest.index)
    } else {
      toast.info('No analytics available yet. Ask a data question first.')
    }
  }

  const handleSubmit = async (e: React.FormEvent, overrideInput?: string) => {
    e.preventDefault()
    
    const effectiveInput = typeof overrideInput === 'string' ? overrideInput : input

    if (!effectiveInput.trim()) {
      toast.error('Please enter a question')
      return
    }

    const userInput = effectiveInput.trim()
    
    // Check if user is responding to visualization prompt
    if (pendingVisualization) {
      const visualizationResponse = isVisualizationResponse(userInput)
      console.log('Pending visualization exists, checking user response:', userInput, visualizationResponse)
      
      if (visualizationResponse === 'yes') {
        console.log('User said yes, showing visualization', pendingVisualization)
        // Show visualization - use functional update to ensure state is set correctly
        setCurrentVisualization({ ...pendingVisualization })
        setShowVisualization(true)
        setPendingVisualization(null)
        
        // Update the last assistant message to include queryResult and set active index
        setMessages(prev => {
          const updated = [...prev]
          const lastMessageIndex = updated.length - 1
          const lastMessage = updated[lastMessageIndex]
          if (lastMessage && lastMessage.role === 'assistant') {
            updated[lastMessageIndex] = {
              ...lastMessage,
              queryResult: pendingVisualization
            }
            setActiveAnalyticsMessageIndex(lastMessageIndex)
          }
          return updated
        })
        
        const userMessage: ChatMessage = {
          role: 'user',
          content: userInput,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        return
      } else if (visualizationResponse === 'no') {
        console.log('User said no, dismissing visualization')
        // Don't show visualization
        setPendingVisualization(null)
        
        const userMessage: ChatMessage = {
          role: 'user',
          content: userInput,
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

    // Check if user is asking to analyze current visualization
    if (showVisualization && currentVisualization && isVisualizationAnalysisRequest(userInput)) {
      const insights = generateVisualizationInsights(
        currentVisualization.data,
        currentVisualization.columns,
        currentVisualization.visualizationType
      )
      
      const userMessage: ChatMessage = {
        role: 'user',
        content: userInput,
        timestamp: new Date()
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: insights,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, userMessage, assistantMessage])
      setInput('')
      return
    }

    // Clear previous visualization when starting a new query
    if (pendingVisualization) {
      setPendingVisualization(null)
    }
    if (showVisualization && !isVisualizationAnalysisRequest(userInput)) {
      setShowVisualization(false)
      setCurrentVisualization(null)
      setActiveAnalyticsMessageIndex(null)
    }


    // Auto-detect data queries in chat mode and route to query API
    const shouldUseQueryAPI = queryMode || isDataQuery(userInput)
    
    // If we detect a data query in chat mode, automatically switch to query mode behavior
    if (!queryMode && isDataQuery(userInput)) {
      console.log('Detected data query in chat mode, routing to query API')
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
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
          question: userInput,
          // Send compact recent history to enable follow-ups
          history: [...messages, { role: 'user', content: userInput, timestamp: new Date() }]
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content })),
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
        // Analytics Mode - process using chat handlers
        const queryResult = createQueryResult(data)
        const processed = processAnalyticsResponse(data, queryResult)
        
        // Store query result in message if it's a simple query
        if (processed.isSimple) {
          processed.message.queryResult = queryResult
        }
        
        // Store pending visualization if we should prompt
        if (processed.shouldPromptForVisualization) {
          setPendingVisualization(queryResult)
        }
        
        setMessages(prev => [...prev, processed.message])
        
        if (data.cached) {
          toast.success('Results loaded from cache')
        } else if (data.executionTime) {
          toast.success(`Query executed in ${data.executionTime}ms`)
        }
      } else {
        // Chat response - process using chat handlers
        const assistantMessage = processChatResponse(data)
        setMessages(prev => [...prev, assistantMessage])
        
        if (data.cached) {
          toast.success('Response loaded from cache')
        }
        
        if (data.error) {
          toast.error(data.message || data.error)
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

  // Handle clicking an example prompt
  const runExample = (prompt: string) => {
    setInput(prompt)
    // Defer to ensure input state updates before submit
    setTimeout(() => {
      // Create a minimal fake event to satisfy signature
      const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent
      handleSubmit(fakeEvent, prompt)
    }, 0)
  }

  return (
    <div className={`overflow-hidden ${className || 'h-full'}`}>
      {showVisualization && currentVisualization ? (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={60} minSize={30} className="min-w-0">
            <Card className="flex flex-col h-full overflow-hidden">
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
              
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0 p-4 overflow-hidden" style={{ height: 0 }}>
                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-2"
                >
                  {messages.length === 0 ? (
                    <div className="mx-auto max-w-3xl">
                      <div className="text-center rounded-lg border p-6 bg-card">
                        <h2 className="text-lg font-semibold mb-2">Welcome to Dataset Chat!</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          Ask me anything about the Brazilian E-Commerce dataset. Try one of these:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {examplePrompts.map((p, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="justify-start text-xs"
                              onClick={() => runExample(p)}
                            >
                              {p}
                            </Button>
                          ))}
                        </div>
                      </div>
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
                          {message.queryResult && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentVisualization(message.queryResult!)
                                  setShowVisualization(true)
                                  setActiveAnalyticsMessageIndex(index)
                                }}
                                className="text-[10px] h-6 px-2"
                              >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Analytics
                              </Button>
                            </div>
                          )}
                          <p className="text-[10px] opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
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
                  <div ref={messagesEndRef} />
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
                    variant={showVisualization ? "default" : "outline"}
                    size="sm"
                    type="button"
                    onClick={toggleAnalyticsPane}
                    className="h-[50px] text-xs"
                    title={showVisualization ? "Hide Analytics" : "Show Analytics"}
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
                      setActiveAnalyticsMessageIndex(null)
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
        <Card className="flex flex-col h-full overflow-hidden">
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
          
          <CardContent className="flex-1 flex flex-col gap-3 min-h-0 p-4 overflow-hidden" style={{ height: 0 }}>
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-2"
            >
              {messages.length === 0 ? (
                <div className="mx-auto max-w-3xl">
                  <div className="text-center rounded-lg border p-6 bg-card">
                    <h2 className="text-lg font-semibold mb-2">Welcome to Dataset Chat!</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ask me anything about the Brazilian E-Commerce dataset. Try one of these:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {examplePrompts.map((p, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="justify-start text-xs"
                          onClick={() => runExample(p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
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
                      {message.queryResult && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentVisualization(message.queryResult!)
                              setShowVisualization(true)
                              setActiveAnalyticsMessageIndex(index)
                            }}
                            className="text-[10px] h-6 px-2"
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Analytics
                          </Button>
                        </div>
                      )}
                      <p className="text-[10px] opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
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
              <div ref={messagesEndRef} />
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
                variant={showVisualization ? "default" : "outline"}
                size="sm"
                type="button"
                onClick={toggleAnalyticsPane}
                className="h-[50px] text-xs"
                title={showVisualization ? "Hide Analytics" : "Show Analytics"}
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
      
      {/* Clear Cache Button - Bottom Right */}
      <Button
        variant="outline"
        size="sm"
        onClick={clearCache}
        disabled={isClearingCache}
        className="fixed bottom-4 right-4 h-8 px-2 text-xs shadow-lg z-50"
        title="Clear Redis Cache"
      >
        {isClearingCache ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            Clear Cache
          </>
        )}
      </Button>
    </div>
  )
}