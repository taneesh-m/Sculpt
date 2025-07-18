"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Send, Dumbbell, Salad, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { AIParser } from "@/lib/ai-parser"
import { StorageManager } from "@/lib/storage"
import { Message, UserSettings } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const DEFAULT_SETTINGS: UserSettings = {
  name: "Alex",
  age: 28,
  gender: "male",
  height_cm: 175,
  weight_kg: 75,
  activity_level: "moderately_active",
  fitness_goals: ["build muscle", "improve strength", "lose body fat"],
  current_fitness_level: "intermediate",
  medical_conditions: [],
  dietary_restrictions: ["lactose intolerant"],
  preferred_workout_duration: 60,
  workout_frequency: 4,
  available_equipment: ["dumbbells", "barbell", "bench", "pull-up bar"],
  weight_goal: "lose",
  target_weight: 70,
  body_fat_percentage: 18,
  muscle_mass: 60
}

// Function to render markdown-like content
const renderMarkdown = (content: string) => {
  // Split content into lines
  const lines = content.split('\n')
  
  return lines.map((line, index) => {
    // Handle headers (###)
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">
          {line.replace('### ', '')}
        </h3>
      )
    }
    
    // Handle headers (##)
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground">
          {line.replace('## ', '')}
        </h2>
      )
    }
    
    // Handle headers (#)
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-foreground">
          {line.replace('# ', '')}
        </h1>
      )
    }
    
    // Handle bullet points
    if (line.startsWith('- **') && line.includes('**:')) {
      const [title, description] = line.split('**:')
      const cleanTitle = title.replace('- **', '').replace('**', '')
      return (
        <div key={index} className="mb-2">
          <strong className="text-foreground">{cleanTitle}:</strong>
          <span className="ml-2">{description}</span>
        </div>
      )
    }
    
    // Handle bullet points with italics
    if (line.startsWith('- *') && line.includes('*:')) {
      const [title, description] = line.split('*:')
      const cleanTitle = title.replace('- *', '').replace('*', '')
      return (
        <div key={index} className="mb-2">
          <em className="text-foreground">{cleanTitle}:</em>
          <span className="ml-2">{description}</span>
        </div>
      )
    }
    
    // Handle regular bullet points
    if (line.startsWith('- ')) {
      return (
        <div key={index} className="mb-1 ml-4">
          • {line.replace('- ', '')}
        </div>
      )
    }
    
    // Handle bold text (**text**)
    if (line.includes('**')) {
      const parts = line.split('**')
      return (
        <div key={index} className="mb-2">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="text-foreground">{part}</strong>
            ) : (
              <span key={partIndex}>{part}</span>
            )
          )}
        </div>
      )
    }
    
    // Handle italic text (*text*)
    if (line.includes('*') && !line.startsWith('- *')) {
      const parts = line.split('*')
      return (
        <div key={index} className="mb-2">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 1 ? (
              <em key={partIndex} className="text-foreground">{part}</em>
            ) : (
              <span key={partIndex}>{part}</span>
            )
          )}
        </div>
      )
    }
    
    // Handle empty lines
    if (line.trim() === '') {
      return <div key={index} className="h-2" />
    }
    
    // Regular text
    return (
      <div key={index} className="mb-2">
        {line}
      </div>
    )
  })
}

export function ChatInterface() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load user settings and chat messages from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      setUserSettings(JSON.parse(savedSettings))
    }

    // Load saved chat messages
    const savedMessages = StorageManager.getChatMessages()
    if (savedMessages.length > 0) {
      setMessages(savedMessages)
    } else {
      // Initialize with welcome message if no saved messages
      const welcomeMessage: Message = {
        id: "1",
        content: "Hi there! I'm your fitness and nutrition assistant. How can I help you today?",
        role: "assistant",
        agent: "orchestrator",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      StorageManager.saveChatMessages([welcomeMessage])
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages)
    StorageManager.saveChatMessages(newMessages)
  }

  const clearConversation = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: "Hi there! I'm your fitness and nutrition assistant. How can I help you today?",
      role: "assistant",
      agent: "orchestrator",
      timestamp: new Date(),
    }
    saveMessages([welcomeMessage])
    toast({
      title: "Conversation Cleared",
      description: "Starting a new conversation.",
    })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    saveMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      // Send message to backend API with conversation context
      const response = await api.sendMessage(input, updatedMessages) as { content: string; agent: string; timestamp: string }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: "assistant",
        agent: response.agent as "orchestrator" | "workout" | "diet",
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      saveMessages(finalMessages)

      // Try to parse and store AI-generated plans
      const workoutPlan = AIParser.parseWorkoutPlan(response.content)
      console.log('Workout plan parsing result:', workoutPlan)
      if (workoutPlan) {
        StorageManager.saveAIWorkoutPlan(workoutPlan)
        toast({
          title: "Workout Plan Saved!",
          description: "Your AI-generated workout plan has been saved to your workout tab.",
        })
      } else {
        console.log('No workout plan detected in AI response')
      }

      const mealPlan = AIParser.parseMealPlan(response.content)
      console.log('Meal plan parsing result:', mealPlan)
      if (mealPlan) {
        StorageManager.saveAIMealPlan(mealPlan)
        toast({
          title: "Meal Plan Saved!",
          description: "Your AI-generated meal plan has been saved to your diet tab.",
        })
      } else {
        console.log('No meal plan detected in AI response')
      }

    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, there was an error processing your request. Please try again.",
        role: "assistant",
        agent: "orchestrator",
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, errorMessage]
      saveMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const getAgentIcon = (agent?: string) => {
    // Since we now have a unified assistant, always show the AI icon
    return "AI"
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
            className={cn(
              "flex items-start gap-3",
              message.role === "user" 
                ? "justify-end" 
                : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getAgentIcon(message.agent)}
                </AvatarFallback>
              </Avatar>
            )}

            <Card 
              className={cn(
                "p-3 max-w-[80%]",
                message.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}
            >
              <div className="text-sm leading-relaxed">
                {message.role === "assistant" ? renderMarkdown(message.content) : message.content}
              </div>
              <p className={cn(
                "text-xs mt-2",
                message.role === "user" ? "opacity-70" : "text-muted-foreground"
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
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
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
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
