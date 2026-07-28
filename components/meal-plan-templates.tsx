"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Utensils, Flame, Eye, ClipboardList } from "lucide-react"
import { useAIMealPlans, useDeleteAIPlan } from "@/lib/hooks/use-ai-plans"
import { useToast } from "@/hooks/use-toast"
import type { AIMealPlan } from "@/lib/types"

// Compact side panel of AI-generated meal plans. "Use" hands the plan to the
// parent so it can prefill today's food log with the plan's foods.
export function MealPlanTemplates({ onUse }: { onUse: (plan: AIMealPlan) => void }) {
  const { toast } = useToast()
  const { data: plans = [] } = useAIMealPlans()
  const deletePlanMutation = useDeleteAIPlan("meal")

  const deletePlan = (planId: string) =>
    deletePlanMutation.mutate(planId, {
      onSuccess: () => toast({ title: "Plan deleted", description: "The meal plan has been removed." }),
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="h-5 w-5 text-primary" />
          Plan Templates
        </CardTitle>
        <CardDescription>
          {plans.length === 0
            ? "Ask the AI coach for a meal plan and it'll appear here to log from."
            : "Use a plan to prefill today's food log, then tweak and save."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border p-3">
            <div className="font-medium">{plan.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {plan.dailyCalories} cal
              </Badge>
              <Badge variant="outline">{plan.meals.length} meals</Badge>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => onUse(plan)}>
                <ClipboardList className="mr-1 h-4 w-4" />
                Use
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" aria-label={`View ${plan.title}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{plan.title}</DialogTitle>
                    <DialogDescription>{plan.description}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {plan.meals.map((meal, i) => (
                      <div key={i} className="rounded-lg bg-muted p-3">
                        <div className="mb-1 font-medium">{meal.name}</div>
                        <div className="space-y-0.5 text-sm">
                          {meal.foods.map((food, fi) => (
                            <div key={fi}>
                              • {food.name}
                              {food.calories > 0 && ` (${food.calories} cal)`}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <DialogClose asChild>
                    <Button className="w-full" onClick={() => onUse(plan)}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Use as template
                    </Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePlan(plan.id)}
                className="text-destructive hover:text-destructive"
                aria-label={`Delete ${plan.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
