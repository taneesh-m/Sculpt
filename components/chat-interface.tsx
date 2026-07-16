"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Send, RotateCcw, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useChatHistory, useClearChatHistory } from "@/lib/hooks/use-chat-history"
import { useQueryClient } from "@tanstack/react-query"

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [{ type: "text", text: "Hi there! I'm your fitness and nutrition assistant. How can I help you today?" }],
}

function MessageContent({ message }: { message: UIMessage }) {
  return (
    <>
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <div key={i} className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{part.text}</ReactMarkdown>
            </div>
          )
        }
        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          const toolName = part.type === "dynamic-tool" ? part.toolName : part.type.replace("tool-", "")
          const state = "state" in part ? part.state : undefined
          const label = state === "output-available" ? `Used ${toolName}` : `Using ${toolName}...`
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground italic my-1">
              <Wrench className="h-3 w-3" />
              {label}
            </div>
          )
        }
        return null
      })}
    </>
  )
}

function ChatInterfaceInner({ initialMessages }: { initialMessages: UIMessage[] }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const clearHistory = useClearChatHistory()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    messages: initialMessages,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-plans"] })
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
      queryClient.invalidateQueries({ queryKey: ["diet-logs"] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const clearConversation = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        setMessages([WELCOME_MESSAGE])
        toast({
          title: "Conversation Cleared",
          description: "Starting a new conversation.",
        })
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={clearConversation}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex items-start gap-3", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
            )}

            <Card
              className={cn(
                "p-3 max-w-[80%]",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <div className="text-sm leading-relaxed">
                <MessageContent message={message} />
              </div>
            </Card>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
            </Avatar>
            <Card className="p-3 bg-muted">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            placeholder="Ask about workouts or nutrition..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export function ChatInterface() {
  const { data: history, isLoading } = useChatHistory()

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading chat...</div>
  }

  const initialMessages = history && history.length > 0 ? history : [WELCOME_MESSAGE]

  return <ChatInterfaceInner initialMessages={initialMessages} />
}
