import { describe, expect, it } from "vitest"
import { workoutPlanSchema, mealPlanSchema } from "./schemas"

describe("workoutPlanSchema", () => {
  it("accepts a well-formed plan", () => {
    const result = workoutPlanSchema.safeParse({
      title: "Beginner Strength",
      description: "A simple full-body routine",
      type: "strength",
      duration: 45,
      difficulty: "beginner",
      exercises: [{ name: "Squats", sets: 3, reps: 10 }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid type enum value", () => {
    const result = workoutPlanSchema.safeParse({
      title: "Bad Plan",
      description: "x",
      type: "yoga", // not in the enum
      duration: 30,
      difficulty: "beginner",
      exercises: [],
    })
    expect(result.success).toBe(false)
  })

  it("rejects a plan missing required exercise fields", () => {
    const result = workoutPlanSchema.safeParse({
      title: "Bad Plan",
      description: "x",
      type: "strength",
      duration: 30,
      difficulty: "beginner",
      exercises: [{ name: "Squats" }], // missing sets/reps
    })
    expect(result.success).toBe(false)
  })

  it("rejects a duration that isn't a number", () => {
    const result = workoutPlanSchema.safeParse({
      title: "Bad Plan",
      description: "x",
      type: "strength",
      duration: "45 minutes",
      difficulty: "beginner",
      exercises: [{ name: "Squats", sets: 3, reps: 10 }],
    })
    expect(result.success).toBe(false)
  })
})

describe("mealPlanSchema", () => {
  it("accepts a well-formed plan", () => {
    const result = mealPlanSchema.safeParse({
      title: "High Protein Day",
      description: "x",
      dailyCalories: 2200,
      meals: [
        {
          name: "Breakfast",
          foods: [{ name: "Oats", quantity: 100, unit: "g", calories: 380, protein: 13, carbs: 68, fat: 7 }],
          calories: 380,
          protein: 13,
          carbs: 68,
          fat: 7,
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rejects a meal plan with an incomplete food item", () => {
    const result = mealPlanSchema.safeParse({
      title: "Bad Plan",
      description: "x",
      dailyCalories: 2000,
      meals: [
        {
          name: "Breakfast",
          foods: [{ name: "Oats", calories: 380 }], // missing quantity/unit/protein/carbs/fat
          calories: 380,
          protein: 13,
          carbs: 68,
          fat: 7,
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
