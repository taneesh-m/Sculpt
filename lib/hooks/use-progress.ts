import { useQuery } from "@tanstack/react-query"
import type { BadgeStatus } from "@/app/api/progress/badges/route"

async function fetchBadges(): Promise<BadgeStatus[]> {
  const res = await fetch("/api/progress/badges")
  if (!res.ok) throw new Error("Failed to fetch progress badges")
  const { badges } = await res.json()
  return badges
}

export function useProgressBadges() {
  return useQuery({ queryKey: ["progress-badges"], queryFn: fetchBadges })
}
