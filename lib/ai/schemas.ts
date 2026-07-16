import { z } from "zod"

// Mirrors lib/types.ts's Exercise/AIWorkoutPlan/FoodItem/AIMealPlan shapes.
// The AI commits to this structure at generation time via generateObject-
// backed tools, instead of the old approach (lib/ai-parser.ts) of scraping
// structure out of free-text prose after the fact.

export const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.number(),
  weight: z.number().optional(),
  duration: z.number().optional(),
  notes: z.string().optional(),
})

export const workoutPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(["strength", "cardio", "flexibility", "mixed"]),
  duration: z.number().describe("Total workout duration in minutes"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  targetMuscleGroups: z.array(z.string()).optional(),
  exercises: z.array(exerciseSchema),
})

export const foodItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
})

export const mealPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  dailyCalories: z.number(),
  dietaryNotes: z.array(z.string()).optional(),
  meals: z.array(
    z.object({
      name: z.string().describe("e.g. Breakfast, Lunch, Dinner, Snack"),
      foods: z.array(foodItemSchema),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  ),
})

export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>
export type MealPlanInput = z.infer<typeof mealPlanSchema>
