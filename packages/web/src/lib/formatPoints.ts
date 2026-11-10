/**
 * Formats points for display: rounded to the nearest whole number.
 * Internal scores keep their exact value for ranking; only display is rounded.
 * `900` -> "900", `100.2` -> "100", `100.7` -> "101"
 */
export const formatPoints = (points: number): string =>
  String(Math.round(points))
