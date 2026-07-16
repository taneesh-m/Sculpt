"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProgressBadges } from "@/components/progress-badges"
import { ChatInterface } from "@/components/chat-interface"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { WorkoutInput } from "@/components/workout-input"
import { DietInput } from "@/components/diet-input"
import { UserSettings } from "@/components/user-settings"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("chat")

  return (
    <div className="flex min-h-screen flex-col">
      <div className="hidden md:block border-b">
        <MainNav />
      </div>

      <main className="flex-1">
        <Tabs value={activeTab} className="h-full" onValueChange={setActiveTab}>
          <div className="px-4 py-2 border-b">
            <TabsList className="w-full justify-between">
              <TabsTrigger value="chat" className="flex-1">
                Chat
              </TabsTrigger>
              <TabsTrigger value="workout" className="flex-1">
                Workout
              </TabsTrigger>
              <TabsTrigger value="diet" className="flex-1">
                Diet
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex-1">
                Progress
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="workout" className="p-4">
            <WorkoutInput />
          </TabsContent>

          <TabsContent value="diet" className="p-4">
            <DietInput />
          </TabsContent>

          <TabsContent value="progress" className="p-4">
            <ProgressBadges />
          </TabsContent>

          <TabsContent value="analytics" className="p-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings" className="p-4">
            <UserSettings />
          </TabsContent>
        </Tabs>
      </main>

      <div className="md:hidden border-t">
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}
