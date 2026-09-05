"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LineChart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/lib/hooks/use-profile"
import { useCreateProgressEntry, useProgressEntries } from "@/lib/hooks/use-progress"
import { kgToLbDisplay, lbToKg } from "@/lib/units"

const HISTORY_LIMIT = 10

export function ProgressLog() {
  const { toast } = useToast()
  const { data: profile } = useProfile()
  const { data: entries = [] } = useProgressEntries(HISTORY_LIMIT)
  const createEntry = useCreateProgressEntry()

  const isImperial = profile?.unit_system === "imperial"
  const weightUnit = isImperial ? "lb" : "kg"

  const [weight, setWeight] = useState("")
  const [bodyFat, setBodyFat] = useState("")
  const [muscleMass, setMuscleMass] = useState("")
  const [notes, setNotes] = useState("")

  // The form collects whatever unit the user prefers; the API stores kilograms
  // canonically, same as profiles.weight_kg.
  const toKg = (value: string) => {
    const parsed = Number.parseFloat(value)
    if (!Number.isFinite(parsed)) return undefined
    return isImperial ? lbToKg(parsed) : parsed
  }

  const fromKg = (kg: number) => (isImperial ? kgToLbDisplay(kg) : kg)

  const saveEntry = () => {
    const parsedBodyFat = Number.parseFloat(bodyFat)

    const input = {
      weight: toKg(weight),
      muscle_mass: toKg(muscleMass),
      body_fat_percentage: Number.isFinite(parsedBodyFat) ? parsedBodyFat : undefined,
      progress_notes: notes || undefined,
    }

    if (input.weight === undefined && input.muscle_mass === undefined && input.body_fat_percentage === undefined) {
      toast({
        title: "Error",
        description: "Enter at least one measurement to log a check-in",
        variant: "destructive",
      })
      return
    }

    createEntry.mutate(input, {
      onSuccess: () => {
        setWeight("")
        setBodyFat("")
        setMuscleMass("")
        setNotes("")
        toast({
          title: "Check-in Logged!",
          description: "Your measurements have been recorded",
        })
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save your check-in. Please try again.",
          variant: "destructive",
        })
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LineChart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Body Measurements</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Check-in</CardTitle>
          <CardDescription>Log your weight and body composition to track change over time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="progress-weight">Weight ({weightUnit})</Label>
              <Input
                id="progress-weight"
                type="number"
                min="0"
                step="0.1"
                placeholder={isImperial ? "175" : "80"}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress-body-fat">Body Fat (%)</Label>
              <Input
                id="progress-body-fat"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="18"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress-muscle-mass">Muscle Mass ({weightUnit})</Label>
              <Input
                id="progress-muscle-mass"
                type="number"
                min="0"
                step="0.1"
                placeholder={isImperial ? "150" : "68"}
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress-notes">Notes (optional)</Label>
            <Textarea
              id="progress-notes"
              placeholder="How are you feeling? Anything worth remembering about this check-in..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={saveEntry} className="w-full" disabled={createEntry.isPending}>
            {createEntry.isPending ? "Saving..." : "Log Check-in"}
          </Button>
        </CardContent>
      </Card>

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Your last {entries.length} logged measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry) => {
                const stats = [
                  entry.weight != null && `${fromKg(entry.weight)} ${weightUnit}`,
                  entry.body_fat_percentage != null && `${entry.body_fat_percentage}% body fat`,
                  entry.muscle_mass != null && `${fromKg(entry.muscle_mass)} ${weightUnit} muscle`,
                ].filter(Boolean)

                return (
                  <div key={entry.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{stats.join(" • ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {entry.progress_notes && (
                      <div className="text-sm text-muted-foreground mt-1">{entry.progress_notes}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
