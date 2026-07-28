"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Dumbbell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { WorkoutPlanTemplates } from "@/components/workout-plan-templates"
import { useCreateWorkout, useWorkouts } from "@/lib/hooks/use-workouts"
import { AIWorkoutPlan, Exercise, Workout } from "@/lib/types"

type DraftExercise = Omit<Exercise, "id"> & { id: string }

export function WorkoutInput() {
  const { toast } = useToast()
  const { data: workoutHistory = [] } = useWorkouts()
  const createWorkout = useCreateWorkout()

  const [name, setName] = useState("")
  const [type, setType] = useState<Workout["type"] | "">("")
  const [duration, setDuration] = useState(0)
  const [exercises, setExercises] = useState<DraftExercise[]>([])
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: "",
    sets: 1,
    reps: 1,
    weight: 0,
  })

  const addExercise = () => {
    if (!newExercise.name) {
      toast({
        title: "Error",
        description: "Please enter an exercise name",
        variant: "destructive",
      })
      return
    }

    const exercise: DraftExercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      sets: newExercise.sets || 1,
      reps: newExercise.reps || 1,
      weight: newExercise.weight,
      duration: newExercise.duration,
      notes: newExercise.notes,
    }

    setExercises((prev) => [...prev, exercise])
    setNewExercise({ name: "", sets: 1, reps: 1, weight: 0 })

    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to your workout`,
    })
  }

  // Prefill the log form from an AI-generated plan. Values are editable --
  // the plan is a starting point, not a locked record.
  const applyPlan = (plan: AIWorkoutPlan) => {
    setName(plan.title)
    setType((["strength", "cardio", "flexibility", "mixed"] as const).includes(plan.type as Workout["type"])
      ? (plan.type as Workout["type"])
      : "mixed")
    setDuration(plan.duration)
    setExercises(
      plan.exercises.map((ex, i) => ({
        id: `${Date.now()}-${i}`,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        duration: ex.duration,
        notes: ex.notes,
      })),
    )
    toast({
      title: "Template loaded",
      description: `"${plan.title}" filled in below -- edit anything, then save.`,
    })
  }

  const removeExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId))
  }

  const saveWorkout = () => {
    if (!name || !type || exercises.length === 0) {
      toast({
        title: "Error",
        description: "Please add a workout name, type, and at least one exercise",
        variant: "destructive",
      })
      return
    }

    createWorkout.mutate(
      {
        name,
        type,
        duration,
        exercises: exercises.map(({ id: _id, ...rest }) => rest),
      },
      {
        onSuccess: () => {
          setName("")
          setType("")
          setDuration(0)
          setExercises([])
          toast({
            title: "Workout Saved!",
            description: "Your workout has been logged successfully",
          })
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save your workout. Please try again.",
            variant: "destructive",
          })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Workout Tracking</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Current Workout Form */}
          <Card>
            <CardHeader>
              <CardTitle>New Workout</CardTitle>
              <CardDescription>Track your exercises, sets, reps, and weights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workout-name">Workout Name</Label>
                  <Input
                    id="workout-name"
                    placeholder="e.g., Upper Body Strength"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workout-type">Workout Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as Workout["type"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={duration || ""}
                  onChange={(e) => setDuration(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Exercise Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Exercise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise-name">Exercise Name</Label>
                <Input
                  id="exercise-name"
                  placeholder="e.g., Bench Press"
                  value={newExercise.name || ""}
                  onChange={(e) => setNewExercise((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    value={newExercise.sets || ""}
                    onChange={(e) => setNewExercise((prev) => ({ ...prev, sets: Number.parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    value={newExercise.reps || ""}
                    onChange={(e) => setNewExercise((prev) => ({ ...prev, reps: Number.parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.5"
                    value={newExercise.weight || ""}
                    onChange={(e) =>
                      setNewExercise((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration-ex">Duration (min)</Label>
                  <Input
                    id="duration-ex"
                    type="number"
                    min="0"
                    value={newExercise.duration || ""}
                    onChange={(e) =>
                      setNewExercise((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this exercise..."
                  value={newExercise.notes || ""}
                  onChange={(e) => setNewExercise((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button onClick={addExercise} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </CardContent>
          </Card>

          {/* Current Exercises List */}
          {exercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Exercises</CardTitle>
                <CardDescription>
                  {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} added
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight && exercise.weight > 0 && ` @ ${exercise.weight} lbs`}
                          {exercise.duration && exercise.duration > 0 && ` for ${exercise.duration} min`}
                        </div>
                        {exercise.notes && <div className="text-xs text-muted-foreground mt-1">{exercise.notes}</div>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={saveWorkout} className="w-full mt-4" disabled={createWorkout.isPending}>
                  {createWorkout.isPending ? "Saving..." : "Save Workout"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Workout History */}
          {workoutHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Workouts</CardTitle>
                <CardDescription>Your logged workout history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workoutHistory.slice(0, 5).map((workout) => (
                    <div key={workout.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{workout.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {workout.type} • {workout.exercises.length} exercises
                            {workout.duration > 0 && ` • ${workout.duration} min`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(workout.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <WorkoutPlanTemplates onUse={applyPlan} />
        </div>
      </div>
    </div>
  )
}
