/**
 * Formats points for display: exact value up to 2 decimals, trailing zeros trimmed.
 * `900` -> "900", `937.42` -> "937.42"
 */
export const formatPoints = (points: number): string =>
  String(Math.round(points * 100) / 100)
