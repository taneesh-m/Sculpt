import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Exercise, Workout } from "@/lib/types"

async function fetchWorkouts(): Promise<Workout[]> {
  const res = await fetch("/api/workouts")
  if (!res.ok) throw new Error("Failed to fetch workouts")
  const { workouts } = await res.json()
  return workouts
}

type CreateWorkoutInput = {
  name: string
  type: Workout["type"]
  duration?: number
  notes?: string
  exercises?: Omit<Exercise, "id">[]
}

async function createWorkout(data: CreateWorkoutInput): Promise<Workout> {
  const res = await fetch("/api/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create workout")
  const { workout } = await res.json()
  return workout
}

export function useWorkouts() {
  return useQuery({ queryKey: ["workouts"], queryFn: fetchWorkouts })
}

export function useCreateWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
    },
  })
}
