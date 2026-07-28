import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Profile } from "@/lib/types"

// A brand-new profile (created by the handle_new_user trigger on signup)
// only has id/email/name/avatar_url set -- every other column can come back
// null until the user fills in their settings. Normalize here so every
// consumer of useProfile() can treat the shape as fully populated.
function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    gender: profile.gender ?? "other",
    activity_level: profile.activity_level ?? "moderately_active",
    current_fitness_level: profile.current_fitness_level ?? "beginner",
    weight_goal: profile.weight_goal ?? "maintain",
    age: profile.age ?? 0,
    height_cm: profile.height_cm ?? 0,
    weight_kg: profile.weight_kg ?? 0,
    preferred_workout_duration: profile.preferred_workout_duration ?? 0,
    workout_frequency: profile.workout_frequency ?? 0,
    target_weight: profile.target_weight ?? 0,
    body_fat_percentage: profile.body_fat_percentage ?? 0,
    muscle_mass: profile.muscle_mass ?? 0,
    fitness_goals: profile.fitness_goals ?? [],
    medical_conditions: profile.medical_conditions ?? [],
    dietary_restrictions: profile.dietary_restrictions ?? [],
    available_equipment: profile.available_equipment ?? [],
    onboarding_completed: profile.onboarding_completed ?? false,
    unit_system: profile.unit_system ?? "metric",
  }
}

async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile")
  if (!res.ok) throw new Error("Failed to fetch profile")
  const { profile } = await res.json()
  return normalizeProfile(profile)
}

async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update profile")
  const { profile } = await res.json()
  return normalizeProfile(profile)
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: fetchProfile })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile)
    },
  })
}
