// Checks whether `dates` (YYYY-MM-DD strings) contains every one of the
// last `days` calendar days, counting back from today. Used by the
// "Nutrition Master" badge (7 consecutive days of diet logging) -- the
// broader activity streak (any event type) is computed in SQL by
// get_user_streaks (supabase/migrations/0009_streak_function.sql).
export function hasConsecutiveDays(dates: Set<string>, days: number, today: Date = new Date()): boolean {
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (!dates.has(d.toISOString().slice(0, 10))) return false
  }
  return true
}
