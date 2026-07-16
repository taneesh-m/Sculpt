import { describe, expect, it } from "vitest"
import { hasConsecutiveDays } from "./streaks"

function daysAgo(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

describe("hasConsecutiveDays", () => {
  const today = new Date("2026-03-15T12:00:00Z")

  it("returns true when every one of the last N days is present", () => {
    const dates = new Set([daysAgo(today, 0), daysAgo(today, 1), daysAgo(today, 2)])
    expect(hasConsecutiveDays(dates, 3, today)).toBe(true)
  })

  it("returns false when there's a gap day in the middle of the range", () => {
    // Missing "2 days ago" breaks an otherwise-3-day streak.
    const dates = new Set([daysAgo(today, 0), daysAgo(today, 1), daysAgo(today, 3)])
    expect(hasConsecutiveDays(dates, 4, today)).toBe(false)
  })

  it("returns false when today itself is missing, even if the prior days are all present", () => {
    const dates = new Set([daysAgo(today, 1), daysAgo(today, 2), daysAgo(today, 3)])
    expect(hasConsecutiveDays(dates, 4, today)).toBe(false)
  })

  it("handles a streak that crosses a month boundary", () => {
    const base = new Date("2026-04-02T12:00:00Z")
    // April 2, April 1, March 31 -- a 3-day streak spanning March/April.
    const dates = new Set(["2026-04-02", "2026-04-01", "2026-03-31"])
    expect(hasConsecutiveDays(dates, 3, base)).toBe(true)
  })

  it("handles a streak that crosses a year boundary", () => {
    const base = new Date("2027-01-01T12:00:00Z")
    const dates = new Set(["2027-01-01", "2026-12-31", "2026-12-30"])
    expect(hasConsecutiveDays(dates, 3, base)).toBe(true)
  })

  it("returns true for a zero-day requirement regardless of data", () => {
    expect(hasConsecutiveDays(new Set(), 0, today)).toBe(true)
  })
})
