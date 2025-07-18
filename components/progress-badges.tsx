import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Dumbbell, Salad, Calendar } from "lucide-react"

export function ProgressBadges() {
  // In a real app, these would come from your database
  const badges = [
    {
      id: 1,
      name: "First Workout",
      description: "Completed your first workout",
      earned: true,
      icon: Dumbbell,
      date: "2023-04-01",
    },
    {
      id: 2,
      name: "Nutrition Master",
      description: "Tracked meals for 7 consecutive days",
      earned: true,
      icon: Salad,
      date: "2023-04-08",
    },
    {
      id: 3,
      name: "Streak Warrior",
      description: "Used the app for 14 consecutive days",
      earned: false,
      icon: Flame,
      date: null,
    },
    {
      id: 4,
      name: "Monthly Champion",
      description: "Completed all workout goals for a month",
      earned: false,
      icon: Calendar,
      date: null,
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Progress</h2>
      <p className="text-muted-foreground">Track your fitness journey with achievement badges</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {badges.map((badge) => (
          <Card key={badge.id} className={badge.earned ? "border-primary" : "opacity-70"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <badge.icon className="h-5 w-5 text-primary" />
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
              {badge.earned ? (
                <p className="text-sm text-muted-foreground">Earned on {new Date(badge.date!).toLocaleDateString()}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Keep going to earn this badge!</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
