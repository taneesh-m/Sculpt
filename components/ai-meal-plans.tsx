"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Utensils, Flame, Eye, Target } from "lucide-react"
import { useAIMealPlans, useDeleteAIPlan } from "@/lib/hooks/use-ai-plans"
import { useToast } from "@/hooks/use-toast"

export function AIMealPlans() {
  const { toast } = useToast()
  const { data: plans } = useAIMealPlans()
  const deletePlanMutation = useDeleteAIPlan("meal")

  const deletePlan = (planId: string) => {
    deletePlanMutation.mutate(planId, {
      onSuccess: () => {
        toast({
          title: "Plan Deleted",
          description: "The meal plan has been removed.",
        })
      },
    })
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            AI Generated Meal Plans
          </CardTitle>
          <CardDescription>
            Meal plans created by AI will appear here. Ask the AI for a meal plan in the chat!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Utensils className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Generated Meal Plans</h3>
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
                          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {plan.dailyCalories} calories
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {plan.meals.length} meals
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Daily Meals:</h4>
                          <div className="space-y-3">
                            {plan.meals.map((meal, index) => (
                              <div key={index} className="p-3 bg-muted rounded-lg">
                                <div className="font-medium mb-2">{meal.name}</div>
                                <div className="space-y-1">
                                  {meal.foods.map((food, foodIndex) => (
                                    <div key={foodIndex} className="text-sm">
                                      • {food.name}
                                      {food.calories > 0 && ` (${food.calories} cal)`}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Calories: {meal.calories}</span>
                                  <span>Protein: {meal.protein}g</span>
                                  <span>Carbs: {meal.carbs}g</span>
                                  <span>Fat: {meal.fat}g</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {plan.dietaryNotes && plan.dietaryNotes.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Dietary Notes:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {plan.dietaryNotes.map((note, index) => (
                                <li key={index}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {plan.dailyCalories} calories
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {plan.meals.length} meals
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