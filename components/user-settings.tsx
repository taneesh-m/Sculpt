"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-profile"
import type { UserSettings as UserSettingsType } from "@/lib/types"

export function UserSettings() {
  const { toast } = useToast()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [settings, setSettings] = useState<UserSettingsType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newGoal, setNewGoal] = useState("")
  const [newMedicalCondition, setNewMedicalCondition] = useState("")
  const [newDietaryRestriction, setNewDietaryRestriction] = useState("")
  const [newEquipment, setNewEquipment] = useState("")

  useEffect(() => {
    if (profile) setSettings(profile)
  }, [profile])

  if (isLoading || !settings) {
    return <div className="text-muted-foreground">Loading settings...</div>
  }

  const saveSettings = () => {
    updateProfile.mutate(settings, {
      onSuccess: () => {
        setIsEditing(false)
        toast({
          title: "Settings Saved",
          description: "Your personal information has been updated",
        })
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save your settings. Please try again.",
          variant: "destructive",
        })
      },
    })
  }

  const addArrayItem = (field: keyof UserSettingsType, value: string) => {
    if (!value.trim()) return

    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [field]: [...((prev[field] as string[]) || []), value.trim()],
          }
        : prev,
    )
  }

  const removeArrayItem = (field: keyof UserSettingsType, index: number) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [field]: ((prev[field] as string[]) || []).filter((_, i) => i !== index),
          }
        : prev,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Personal Information</h2>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details and measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                disabled={!isEditing}
                placeholder="Your name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={settings.age}
                  onChange={(e) =>
                    setSettings((prev) => (prev ? { ...prev, age: Number(e.target.value) || 0 } : prev))
                  }
                  disabled={!isEditing}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={settings.gender}
                  onValueChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, gender: value as UserSettingsType["gender"] } : prev))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={settings.height_cm}
                  onChange={(e) =>
                    setSettings((prev) => (prev ? { ...prev, height_cm: Number(e.target.value) || 0 } : prev))
                  }
                  disabled={!isEditing}
                  placeholder="175"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={settings.weight_kg}
                  onChange={(e) =>
                    setSettings((prev) => (prev ? { ...prev, weight_kg: Number(e.target.value) || 0 } : prev))
                  }
                  disabled={!isEditing}
                  placeholder="70"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select
                value={settings.activity_level}
                onValueChange={(value) =>
                  setSettings((prev) =>
                    prev ? { ...prev, activity_level: value as UserSettingsType["activity_level"] } : prev,
                  )
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                  <SelectItem value="extremely_active">Extremely Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Information */}
        <Card>
          <CardHeader>
            <CardTitle>Fitness Information</CardTitle>
            <CardDescription>Your fitness level, goals, and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fitness-level">Fitness Level</Label>
                <Select
                  value={settings.current_fitness_level}
                  onValueChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, current_fitness_level: value as UserSettingsType["current_fitness_level"] } : prev,
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-frequency">Workout Frequency (days/week)</Label>
                <Input
                  id="workout-frequency"
                  type="number"
                  min="1"
                  max="7"
                  value={settings.workout_frequency}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, workout_frequency: Number(e.target.value) || 0 } : prev,
                    )
                  }
                  disabled={!isEditing}
                  placeholder="3"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workout-duration">Preferred Workout Duration (minutes)</Label>
              <Input
                id="workout-duration"
                type="number"
                min="10"
                max="300"
                value={settings.preferred_workout_duration}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, preferred_workout_duration: Number(e.target.value) || 0 } : prev,
                  )
                }
                disabled={!isEditing}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label>Fitness Goals</Label>
              <div className="flex gap-2 flex-wrap">
                {settings.fitness_goals.map((goal, index) => (
                  <Badge key={index} variant="secondary">
                    {goal}
                    {isEditing && (
                      <button
                        onClick={() => removeArrayItem('fitness_goals', index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a fitness goal"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('fitness_goals', newGoal)
                        setNewGoal("")
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      addArrayItem('fitness_goals', newGoal)
                      setNewGoal("")
                    }}
                    disabled={!newGoal.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goals and Targets */}
        <Card>
          <CardHeader>
            <CardTitle>Goals and Targets</CardTitle>
            <CardDescription>Your weight and fitness targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight-goal">Weight Goal</Label>
              <Select
                value={settings.weight_goal}
                onValueChange={(value) =>
                  setSettings((prev) => (prev ? { ...prev, weight_goal: value as UserSettingsType["weight_goal"] } : prev))
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Lose Weight</SelectItem>
                  <SelectItem value="maintain">Maintain Weight</SelectItem>
                  <SelectItem value="gain">Gain Weight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-weight">Target Weight (kg)</Label>
                <Input
                  id="target-weight"
                  type="number"
                  value={settings.target_weight}
                  onChange={(e) =>
                    setSettings((prev) => (prev ? { ...prev, target_weight: Number(e.target.value) || 0 } : prev))
                  }
                  disabled={!isEditing}
                  placeholder="65"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body-fat">Body Fat %</Label>
                <Input
                  id="body-fat"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={settings.body_fat_percentage}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, body_fat_percentage: Number(e.target.value) || 0 } : prev,
                    )
                  }
                  disabled={!isEditing}
                  placeholder="18"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscle-mass">Muscle Mass (kg)</Label>
              <Input
                id="muscle-mass"
                type="number"
                min="0"
                max="200"
                step="0.1"
                value={settings.muscle_mass}
                onChange={(e) =>
                  setSettings((prev) => (prev ? { ...prev, muscle_mass: Number(e.target.value) || 0 } : prev))
                }
                disabled={!isEditing}
                placeholder="60"
              />
            </div>
          </CardContent>
        </Card>

        {/* Equipment and Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment &amp; Restrictions</CardTitle>
            <CardDescription>Available equipment and health considerations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Available Equipment</Label>
              <div className="flex gap-2 flex-wrap">
                {settings.available_equipment.map((equipment, index) => (
                  <Badge key={index} variant="outline">
                    {equipment}
                    {isEditing && (
                      <button
                        onClick={() => removeArrayItem('available_equipment', index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    placeholder="Add equipment"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('available_equipment', newEquipment)
                        setNewEquipment("")
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      addArrayItem('available_equipment', newEquipment)
                      setNewEquipment("")
                    }}
                    disabled={!newEquipment.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Medical Conditions</Label>
              <div className="flex gap-2 flex-wrap">
                {settings.medical_conditions.map((condition, index) => (
                  <Badge key={index} variant="destructive">
                    {condition}
                    {isEditing && (
                      <button
                        onClick={() => removeArrayItem('medical_conditions', index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newMedicalCondition}
                    onChange={(e) => setNewMedicalCondition(e.target.value)}
                    placeholder="Add medical condition"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('medical_conditions', newMedicalCondition)
                        setNewMedicalCondition("")
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      addArrayItem('medical_conditions', newMedicalCondition)
                      setNewMedicalCondition("")
                    }}
                    disabled={!newMedicalCondition.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Dietary Restrictions</Label>
              <div className="flex gap-2 flex-wrap">
                {settings.dietary_restrictions.map((restriction, index) => (
                  <Badge key={index} variant="secondary">
                    {restriction}
                    {isEditing && (
                      <button
                        onClick={() => removeArrayItem('dietary_restrictions', index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newDietaryRestriction}
                    onChange={(e) => setNewDietaryRestriction(e.target.value)}
                    placeholder="Add dietary restriction"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem('dietary_restrictions', newDietaryRestriction)
                        setNewDietaryRestriction("")
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      addArrayItem('dietary_restrictions', newDietaryRestriction)
                      setNewDietaryRestriction("")
                    }}
                    disabled={!newDietaryRestriction.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={updateProfile.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateProfile.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </div>
  )
}
