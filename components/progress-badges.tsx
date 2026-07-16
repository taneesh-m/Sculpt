"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Dumbbell, Salad, Calendar } from "lucide-react"
import { useProgressBadges } from "@/lib/hooks/use-progress"

const ICONS = {
  "first-workout": Dumbbell,
  "nutrition-master": Salad,
  "streak-warrior": Flame,
  "monthly-champion": Calendar,
} as const

export function ProgressBadges() {
  const { data: badges, isLoading } = useProgressBadges()

  if (isLoading || !badges) {
    return <div className="text-muted-foreground">Loading progress...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Progress</h2>
      <p className="text-muted-foreground">Track your fitness journey with achievement badges</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {badges.map((badge) => {
          const Icon = ICONS[badge.id as keyof typeof ICONS] ?? Dumbbell
          return (
            <Card key={badge.id} className={badge.earned ? "border-primary" : "opacity-70"}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {badge.name}
                  </CardTitle>
                  {badge.earned && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                      Earned
                    </Badge>
                  )}
                </div>
                <CardDescription>{badge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {badge.earned ? "Earned!" : "Keep going to earn this badge!"}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
