import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { BadgeStatus } from "@/app/api/progress/badges/route"
import type { ProgressEntry } from "@/lib/types"

async function fetchBadges(): Promise<BadgeStatus[]> {
  const res = await fetch("/api/progress/badges")
  if (!res.ok) throw new Error("Failed to fetch progress badges")
  const { badges } = await res.json()
  return badges
}

export function useProgressBadges() {
  return useQuery({ queryKey: ["progress-badges"], queryFn: fetchBadges })
}

async function fetchProgressEntries(limit?: number): Promise<ProgressEntry[]> {
  const res = await fetch(limit ? `/api/progress?limit=${limit}` : "/api/progress")
  if (!res.ok) throw new Error("Failed to fetch progress entries")
  const { entries } = await res.json()
  return entries
}

export type CreateProgressEntryInput = Omit<ProgressEntry, "id" | "created_at">

async function createProgressEntry(input: CreateProgressEntryInput): Promise<ProgressEntry> {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to create progress entry")
  }
  const { entry } = await res.json()
  return entry
}

export function useProgressEntries(limit?: number) {
  return useQuery({ queryKey: ["progress-entries", limit ?? "all"], queryFn: () => fetchProgressEntries(limit) })
}

export function useCreateProgressEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProgressEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress-entries"] })
    },
  })
}
