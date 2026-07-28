"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, ArrowLeft, ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/multi-select"
import { useToast } from "@/hooks/use-toast"
import { useUpdateProfile } from "@/lib/hooks/use-profile"
import {
  FITNESS_GOAL_OPTIONS,
  EQUIPMENT_OPTIONS,
  DIETARY_OPTIONS,
  FITNESS_LEVEL_OPTIONS,
  WEIGHT_GOAL_OPTIONS,
  GENDER_OPTIONS,
  DURATION_OPTIONS,
  FREQUENCY_OPTIONS,
} from "@/lib/onboarding-options"
import type { Profile } from "@/lib/types"

type OnboardingForm = {
  fitness_goals: string[]
  weight_goal: Profile["weight_goal"] | ""
  gender: Profile["gender"] | ""
  age: string
  height_cm: string
  weight_kg: string
  current_fitness_level: Profile["current_fitness_level"] | ""
  available_equipment: string[]
  preferred_workout_duration: string
  workout_frequency: string
  dietary_restrictions: string[]
}

const STEPS = ["Your goals", "About you", "Training", "Nutrition"]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const updateProfile = useUpdateProfile()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<OnboardingForm>({
    fitness_goals: [],
    weight_goal: "",
    gender: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    current_fitness_level: "",
    available_equipment: [],
    preferred_workout_duration: "",
    workout_frequency: "",
    dietary_restrictions: [],
  })

  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  function validateStep(current: number): string | null {
    switch (current) {
      case 0:
        if (form.fitness_goals.length === 0) return "Pick at least one fitness goal."
        if (!form.weight_goal) return "Select a weight goal."
        return null
      case 1:
        if (!form.gender) return "Select a gender."
        if (!form.age || Number(form.age) <= 0) return "Enter a valid age."
        if (!form.height_cm || Number(form.height_cm) <= 0) return "Enter a valid height."
        if (!form.weight_kg || Number(form.weight_kg) <= 0) return "Enter a valid weight."
        if (!form.current_fitness_level) return "Select your current fitness level."
        return null
      case 2:
        if (form.available_equipment.length === 0) return "Select at least one equipment option."
        if (!form.preferred_workout_duration) return "Select a workout duration."
        if (!form.workout_frequency) return "Select a workout frequency."
        return null
      case 3:
        if (form.dietary_restrictions.length === 0) return "Select at least one dietary option."
        return null
      default:
        return null
    }
  }

  function next() {
    const error = validateStep(step)
    if (error) {
      toast({ title: "Almost there", description: error, variant: "destructive" })
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    const error = validateStep(step)
    if (error) {
      toast({ title: "Almost there", description: error, variant: "destructive" })
      return
    }

    try {
      await updateProfile.mutateAsync({
        fitness_goals: form.fitness_goals,
        weight_goal: form.weight_goal as Profile["weight_goal"],
        gender: form.gender as Profile["gender"],
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        current_fitness_level: form.current_fitness_level as Profile["current_fitness_level"],
        available_equipment: form.available_equipment,
        preferred_workout_duration: Number(form.preferred_workout_duration),
        workout_frequency: Number(form.workout_frequency),
        dietary_restrictions: form.dietary_restrictions,
        onboarding_completed: true,
      })
      toast({ title: "You're all set!", description: "Your profile is ready. Let's get started." })
      router.push("/")
      router.refresh()
    } catch {
      toast({
        title: "Something went wrong",
        description: "We couldn't save your profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isLastStep = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-semibold">Sculpt</span>
          </div>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length} &mdash; this helps your AI coach tailor everything to you.
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-5">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Fitness goals</Label>
                <MultiSelect
                  ariaLabel="Fitness goals"
                  options={FITNESS_GOAL_OPTIONS}
                  selected={form.fitness_goals}
                  onChange={(v) => set("fitness_goals", v)}
                  placeholder="Select your goals..."
                />
              </div>
              <div className="space-y-2">
                <Label>Weight goal</Label>
                <Select value={form.weight_goal} onValueChange={(v) => set("weight_goal", v as Profile["weight_goal"])}>
                  <SelectTrigger aria-label="Weight goal">
                    <SelectValue placeholder="Select a weight goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_GOAL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v as Profile["gender"])}>
                  <SelectTrigger aria-label="Gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="1"
                    value={form.height_cm}
                    onChange={(e) => set("height_cm", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="1"
                    value={form.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current fitness level</Label>
                <Select
                  value={form.current_fitness_level}
                  onValueChange={(v) => set("current_fitness_level", v as Profile["current_fitness_level"])}
                >
                  <SelectTrigger aria-label="Current fitness level">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    {FITNESS_LEVEL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Available equipment</Label>
                <MultiSelect
                  ariaLabel="Available equipment"
                  options={EQUIPMENT_OPTIONS}
                  selected={form.available_equipment}
                  onChange={(v) => set("available_equipment", v)}
                  placeholder="Select your equipment..."
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred workout duration</Label>
                <Select
                  value={form.preferred_workout_duration}
                  onValueChange={(v) => set("preferred_workout_duration", v)}
                >
                  <SelectTrigger aria-label="Workout duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Workout frequency</Label>
                <Select value={form.workout_frequency} onValueChange={(v) => set("workout_frequency", v)}>
                  <SelectTrigger aria-label="Workout frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label>Dietary preferences</Label>
              <MultiSelect
                ariaLabel="Dietary preferences"
                options={DIETARY_OPTIONS}
                selected={form.dietary_restrictions}
                onChange={(v) => set("dietary_restrictions", v)}
                placeholder="Select your preferences..."
              />
              <p className="text-sm text-muted-foreground">
                Pick &ldquo;No restrictions&rdquo; if none apply. Your coach uses this to avoid foods you don&apos;t eat.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {isLastStep ? (
              <Button type="button" onClick={handleSubmit} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Finish"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={next}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
