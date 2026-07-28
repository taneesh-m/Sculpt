// Unit conversion helpers. The database always stores height in centimeters
// and weight in kilograms; these convert to/from the imperial values the UI
// shows when the user prefers imperial. Display conversions round to whole
// units (inches, pounds) so controlled inputs don't jitter while editing.

export type UnitSystem = "metric" | "imperial"

const KG_PER_LB = 0.453592
const CM_PER_IN = 2.54

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}

export function lbToKg(lb: number): number {
  return Math.round(lb * KG_PER_LB * 100) / 100
}

// Whole pounds, for display in a numeric input.
export function kgToLbDisplay(kg: number): number {
  return Math.round(kgToLb(kg))
}

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = Math.round(cm / CM_PER_IN)
  return { ft: Math.floor(totalInches / 12), in: totalInches % 12 }
}

export function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * CM_PER_IN)
}
