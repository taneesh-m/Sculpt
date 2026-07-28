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
import { Trash2, Dumbbell, Clock, Eye, ClipboardList } from "lucide-react"
import { useAIWorkoutPlans, useDeleteAIPlan } from "@/lib/hooks/use-ai-plans"
import { useToast } from "@/hooks/use-toast"
import type { AIWorkoutPlan } from "@/lib/types"

// Compact side panel of AI-generated workout plans. "Use" hands the plan to
// the parent so it can prefill the log form with the plan's exercises.
export function WorkoutPlanTemplates({ onUse }: { onUse: (plan: AIWorkoutPlan) => void }) {
  const { toast } = useToast()
  const { data: plans = [] } = useAIWorkoutPlans()
  const deletePlanMutation = useDeleteAIPlan("workout")

  const deletePlan = (planId: string) =>
    deletePlanMutation.mutate(planId, {
      onSuccess: () => toast({ title: "Plan deleted", description: "The workout plan has been removed." }),
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="h-5 w-5 text-primary" />
          Plan Templates
        </CardTitle>
        <CardDescription>
          {plans.length === 0
            ? "Ask the AI coach for a workout plan and it'll appear here to log from."
            : "Use a plan to prefill the form, then tweak and save."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border p-3">
            <div className="font-medium">{plan.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{plan.type}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {plan.duration}m
              </Badge>
              <Badge variant="outline">{plan.exercises.length} ex</Badge>
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
                  <div className="space-y-2">
                    {plan.exercises.map((ex) => (
                      <div key={ex.id} className="rounded-lg bg-muted p-3">
                        <div className="font-medium">{ex.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {ex.sets} sets × {ex.reps} reps
                          {ex.weight ? ` @ ${ex.weight} lbs` : ""}
                          {ex.duration ? ` for ${ex.duration} min` : ""}
                          {ex.notes ? ` — ${ex.notes}` : ""}
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
