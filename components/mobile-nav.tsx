"use client"

import { MessageSquare, Award, Dumbbell, Salad, Settings, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  return (
    <div className="flex items-center justify-between p-2">
      <Button
        variant={activeTab === "chat" ? "default" : "ghost"}
        size="icon"
        onClick={() => setActiveTab("chat")}
        className="flex-1"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="sr-only">Chat</span>
      </Button>
      <Button
        variant={activeTab === "workout" ? "default" : "ghost"}
        size="icon"
        onClick={() => setActiveTab("workout")}
        className="flex-1"
      >
        <Dumbbell className="h-4 w-4" />
        <span className="sr-only">Workout</span>
      </Button>
      <Button
        variant={activeTab === "diet" ? "default" : "ghost"}
        size="icon"
        onClick={() => setActiveTab("diet")}
        className="flex-1"
      >
        <Salad className="h-4 w-4" />
        <span className="sr-only">Diet</span>
      </Button>
      <Button
        variant={activeTab === "progress" ? "default" : "ghost"}
        size="icon"
        onClick={() => setActiveTab("progress")}
        className="flex-1"
      >
        <Award className="h-4 w-4" />
        <span className="sr-only">Progress</span>
      </Button>
      <Button
        variant={activeTab === "analytics" ? "default" : "ghost"}
        size="icon"
        onClick={() => setActiveTab("analytics")}
        className="flex-1"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="sr-only">Analytics</span>
      </Button>
      <Button
        variant={activeTab === "settings" ? "default" : "ghost"}
        size="icon"
        onClick={() => setActiveTab("settings")}
        className="flex-1"
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only">Settings</span>
      </Button>
    </div>
  )
}
