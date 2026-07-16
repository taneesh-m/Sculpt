import { z } from "zod"
import { tool } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"

import { searchUsdaFoods } from "@/lib/usda"
import { workoutPlanSchema, mealPlanSchema } from "@/lib/ai/schemas"
import { trackEvent } from "@/lib/analytics/track-event"

// Every tool is built per-request, closed over an already-authenticated,
// RLS-scoped Supabase client and the caller's user id -- there is no way
// for a tool to act on another user's data, since every query still runs
// through the same RLS policies as the rest of the app.
export function buildTools(supabase: SupabaseClient, userId: string) {
  return {
    getUserProfile: tool({
      description: "Get the current user's fitness profile: age, goals, equipment, restrictions, etc.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
        if (error) return { error: "Could not load profile" }
        return data
      },
    }),

    getWorkoutHistory: tool({
      description: "Get the user's recent logged workouts, most recent first.",
      inputSchema: z.object({
        limit: z.number().optional().describe("Max number of workouts to return, default 10"),
      }),
      execute: async ({ limit = 10 }) => {
        const { data, error } = await supabase
          .from("workouts")
          .select("*, exercises (name, sets, reps, weight, duration, notes)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit)
        if (error) return { error: "Could not load workout history" }
        return data
      },
    }),

    logWorkout: tool({
      description: "Log a workout the user just completed or wants recorded.",
      inputSchema: z.object({
        name: z.string(),
        type: z.enum(["strength", "cardio", "flexibility", "mixed"]),
        duration: z.number().optional().describe("Duration in minutes"),
        notes: z.string().optional(),
        exercises: z.array(
          z.object({
            name: z.string(),
            sets: z.number().optional(),
            reps: z.number().optional(),
            weight: z.number().optional(),
            duration: z.number().optional(),
            notes: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ name, type, duration, notes, exercises }) => {
        const { data: workout, error } = await supabase
          .from("workouts")
          .insert([{ user_id: userId, name, type, duration, notes }])
          .select()
          .single()
        if (error) return { error: "Could not log workout" }

        if (exercises.length > 0) {
          await supabase.from("exercises").insert(exercises.map((ex) => ({ ...ex, workout_id: workout.id })))
        }

        await trackEvent(supabase, userId, "workout_logged", { workout_id: workout.id })

        return { success: true, workoutId: workout.id }
      },
    }),

    getDietLogs: tool({
      description: "Get the user's recently logged food/meals, optionally filtered to a specific date (YYYY-MM-DD).",
      inputSchema: z.object({
        date: z.string().optional().describe("ISO date YYYY-MM-DD to filter to, omit for most recent entries"),
      }),
      execute: async ({ date }) => {
        let query = supabase.from("diet_logs").select("*").eq("user_id", userId)
        if (date) {
          query = query.gte("created_at", `${date}T00:00:00`).lt("created_at", `${date}T23:59:59`)
        }
        const { data, error } = await query.order("created_at", { ascending: false }).limit(20)
        if (error) return { error: "Could not load diet logs" }
        return data
      },
    }),

    logDietEntry: tool({
      description: "Log a food item the user ate.",
      inputSchema: z.object({
        food_name: z.string(),
        calories: z.number(),
        protein: z.number().optional(),
        carbs: z.number().optional(),
        fat: z.number().optional(),
        meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
        serving_size: z.string().optional(),
      }),
      execute: async (entry) => {
        const { data, error } = await supabase
          .from("diet_logs")
          .insert([{ ...entry, user_id: userId }])
          .select()
          .single()
        if (error) return { error: "Could not log diet entry" }

        await trackEvent(supabase, userId, "diet_logged", { diet_log_id: data.id })

        return { success: true, dietLogId: data.id }
      },
    }),

    searchNutrition: tool({
      description:
        "Look up real nutrition facts (calories, protein, carbs, fat) for a food by name using the USDA FoodData Central database.",
      inputSchema: z.object({
        query: z.string().describe("Food name to search for, e.g. 'quinoa' or 'grilled chicken breast'"),
      }),
      execute: async ({ query }) => {
        try {
          const results = await searchUsdaFoods(query)
          if (results.length === 0) return { error: `No USDA nutrition data found for "${query}"` }
          return { results }
        } catch (error) {
          return { error: error instanceof Error ? error.message : "USDA lookup failed" }
        }
      },
    }),

    generateWorkoutPlan: tool({
      description: "Create and save a structured, multi-exercise workout plan for the user.",
      inputSchema: workoutPlanSchema,
      execute: async (plan) => {
        const { data, error } = await supabase
          .from("ai_plans")
          .insert([{ user_id: userId, plan_type: "workout", payload: plan }])
          .select()
          .single()
        if (error) return { error: "Could not save workout plan" }

        await trackEvent(supabase, userId, "plan_generated", { plan_type: "workout", plan_id: data.id })

        return { success: true, planId: data.id, plan }
      },
    }),

    generateMealPlan: tool({
      description: "Create and save a structured, multi-meal nutrition plan for the user.",
      inputSchema: mealPlanSchema,
      execute: async (plan) => {
        const { data, error } = await supabase
          .from("ai_plans")
          .insert([{ user_id: userId, plan_type: "meal", payload: plan }])
          .select()
          .single()
        if (error) return { error: "Could not save meal plan" }

        await trackEvent(supabase, userId, "plan_generated", { plan_type: "meal", plan_id: data.id })

        return { success: true, planId: data.id, plan }
      },
    }),
  }
}
