"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, Clock, Target, Dumbbell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AIWorkoutPlans } from "@/components/ai-workout-plans"
import { StorageManager } from "@/lib/storage"
import { Exercise, Workout } from "@/lib/types"

export function WorkoutInput() {
  const { toast } = useToast()
  const [currentWorkout, setCurrentWorkout] = useState<Partial<Workout>>({
    name: "",
    type: "",
    duration: 0,
    exercises: [],
  })
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: "",
    sets: 1,
    reps: 1,
    weight: 0,
  })
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([])

  // Load workout history from storage
  useEffect(() => {
    const savedHistory = StorageManager.getWorkoutHistory()
    setWorkoutHistory(savedHistory)
  }, [])

  const addExercise = () => {
    if (!newExercise.name) {
      toast({
        title: "Error",
        description: "Please enter an exercise name",
        variant: "destructive",
      })
      return
    }

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      sets: newExercise.sets || 1,
      reps: newExercise.reps || 1,
      weight: newExercise.weight,
      duration: newExercise.duration,
      notes: newExercise.notes,
    }

    setCurrentWorkout((prev) => ({
      ...prev,
      exercises: [...(prev.exercises || []), exercise],
    }))

    setNewExercise({
      name: "",
      sets: 1,
      reps: 1,
      weight: 0,
    })

    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to your workout`,
    })
  }

  const removeExercise = (exerciseId: string) => {
    setCurrentWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises?.filter((ex) => ex.id !== exerciseId) || [],
    }))
  }

  const saveWorkout = async () => {
    if (!currentWorkout.name || !currentWorkout.exercises?.length) {
      toast({
        title: "Error",
        description: "Please add a workout name and at least one exercise",
        variant: "destructive",
      })
      return
    }

    const workout: Workout = {
      id: Date.now().toString(),
      name: currentWorkout.name,
      type: currentWorkout.type || "General",
      duration: currentWorkout.duration || 0,
      exercises: currentWorkout.exercises,
      date: new Date(),
    }

    // Save to storage
    const updatedHistory = [workout, ...workoutHistory]
    setWorkoutHistory(updatedHistory)
    StorageManager.saveWorkoutHistory(updatedHistory)

    // Reset form
    setCurrentWorkout({
      name: "",
      type: "",
      duration: 0,
      exercises: [],
    })

    toast({
      title: "Workout Saved!",
      description: "Your workout has been logged successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Workout Tracking</h2>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log">Log Workout</TabsTrigger>
          <TabsTrigger value="ai-plans">AI Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-6">
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
                    value={currentWorkout.name || ""}
                    onChange={(e) => setCurrentWorkout((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workout-type">Workout Type</Label>
                  <Select
                    value={currentWorkout.type || ""}
                    onValueChange={(value) => setCurrentWorkout((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="general">General Fitness</SelectItem>
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
                  value={currentWorkout.duration || ""}
                  onChange={(e) =>
                    setCurrentWorkout((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 0 }))
                  }
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
          {currentWorkout.exercises && currentWorkout.exercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Exercises</CardTitle>
                <CardDescription>
                  {currentWorkout.exercises.length} exercise{currentWorkout.exercises.length !== 1 ? "s" : ""} added
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentWorkout.exercises.map((exercise) => (
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
                <Button onClick={saveWorkout} className="w-full mt-4">
                  Save Workout
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
                          {workout.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-plans">
          <AIWorkoutPlans />
        </TabsContent>
      </Tabs>
    </div>
  )
}
