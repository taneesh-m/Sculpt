import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AIMealPlan, AIWorkoutPlan } from "@/lib/types"
import type { WorkoutPlanInput, MealPlanInput } from "@/lib/ai/schemas"

type AiPlanRow<T> = {
  id: string
  plan_type: "workout" | "meal"
  payload: T
  created_at: string
}

async function fetchPlans<T>(planType: "workout" | "meal"): Promise<AiPlanRow<T>[]> {
  const res = await fetch(`/api/ai-plans?type=${planType}`)
  if (!res.ok) throw new Error("Failed to fetch AI plans")
  const { plans } = await res.json()
  return plans
}

async function deletePlan(id: string): Promise<void> {
  const res = await fetch(`/api/ai-plans/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete AI plan")
}

export function useAIWorkoutPlans() {
  const query = useQuery({ queryKey: ["ai-plans", "workout"], queryFn: () => fetchPlans<WorkoutPlanInput>("workout") })
  const plans: AIWorkoutPlan[] = (query.data ?? []).map((row) => ({
    ...row.payload,
    id: row.id,
    date: row.created_at,
    exercises: row.payload.exercises.map((ex, i) => ({ ...ex, id: `${row.id}-${i}` })),
  }))
  return { ...query, data: plans }
}

export function useAIMealPlans() {
  const query = useQuery({ queryKey: ["ai-plans", "meal"], queryFn: () => fetchPlans<MealPlanInput>("meal") })
  const plans: AIMealPlan[] = (query.data ?? []).map((row) => ({
    id: row.id,
    date: row.created_at,
    ...row.payload,
    meals: row.payload.meals.map((meal) => ({
      ...meal,
      // FoodItem.mealType doesn't apply within a meal-plan's food list (the
      // meal name already conveys that); unused by ai-meal-plans.tsx.
      foods: meal.foods.map((food, i) => ({ ...food, id: `${row.id}-${i}`, mealType: "snack" as const })),
    })),
  }))
  return { ...query, data: plans }
}

export function useDeleteAIPlan(planType: "workout" | "meal") {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-plans", planType] })
    },
  })
}
