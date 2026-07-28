// Fixed option sets for the onboarding wizard. Kept limited/enumerated (with
// an "Other" free-text escape hatch on the multi-selects) rather than open
// free-response, so downstream AI personalization gets predictable values.

export const FITNESS_GOAL_OPTIONS = [
  "Weight loss",
  "Muscle gain",
  "General fitness",
  "Strength",
  "Endurance",
  "Flexibility & mobility",
  "Athletic performance",
]

export const EQUIPMENT_OPTIONS = [
  "None / bodyweight only",
  "Dumbbells",
  "Barbell",
  "Resistance bands",
  "Kettlebells",
  "Pull-up bar",
  "Cardio machine",
  "Full gym access",
]

export const DIETARY_OPTIONS = [
  "No restrictions",
  "High protein",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Paleo",
  "Gluten-free",
  "Dairy-free",
  "Low carb",
]

export const FITNESS_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const

export const WEIGHT_GOAL_OPTIONS = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain weight" },
  { value: "gain", label: "Gain weight" },
] as const

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / prefer not to say" },
] as const

export const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
] as const

export const FREQUENCY_OPTIONS = [
  { value: 2, label: "2 days / week" },
  { value: 3, label: "3 days / week" },
  { value: 4, label: "4 days / week" },
  { value: 5, label: "5 days / week" },
  { value: 6, label: "6+ days / week" },
] as const
