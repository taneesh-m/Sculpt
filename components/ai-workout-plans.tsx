"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Dumbbell, Clock, Target, Eye } from "lucide-react"
import { useAIWorkoutPlans, useDeleteAIPlan } from "@/lib/hooks/use-ai-plans"
import { useToast } from "@/hooks/use-toast"

export function AIWorkoutPlans() {
  const { toast } = useToast()
  const { data: plans } = useAIWorkoutPlans()
  const deletePlanMutation = useDeleteAIPlan("workout")

  const deletePlan = (planId: string) => {
    deletePlanMutation.mutate(planId, {
      onSuccess: () => {
        toast({
          title: "Plan Deleted",
          description: "The workout plan has been removed.",
        })
      },
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-blue-100 text-blue-800'
      case 'cardio':
        return 'bg-purple-100 text-purple-800'
      case 'flexibility':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            AI Generated Workout Plans
          </CardTitle>
          <CardDescription>
            Workout plans created by AI will appear here. Ask the AI for a workout plan in the chat!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Generated Workout Plans</h3>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {plan.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{plan.title}</DialogTitle>
                        <DialogDescription>
                          {plan.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge className={getTypeColor(plan.type)}>
                            {plan.type}
                          </Badge>
                          <Badge className={getDifficultyColor(plan.difficulty)}>
                            {plan.difficulty}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {plan.duration} min
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Exercises:</h4>
                          <div className="space-y-2">
                            {plan.exercises.map((exercise, index) => (
                              <div key={exercise.id} className="p-3 bg-muted rounded-lg">
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} reps
                                  {exercise.weight && ` @ ${exercise.weight} lbs`}
                                  {exercise.notes && ` - ${exercise.notes}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePlan(plan.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge className={getTypeColor(plan.type)}>
                  {plan.type}
                </Badge>
                <Badge className={getDifficultyColor(plan.difficulty)}>
                  {plan.difficulty}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {plan.duration} min
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {plan.exercises.length} exercises
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Generated on {new Date(plan.date).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 