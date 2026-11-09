import {
  Circle,
  Diamond,
  Heart,
  Hexagon,
  Pentagon,
  Square,
  Star,
  Triangle,
  type LucideIcon,
} from "lucide-react"

export const PUZZLE_TILE_COLORS = [
  "bg-[var(--color-answer-1)] text-white",
  "bg-[var(--color-answer-2)] text-white",
  "bg-[var(--color-answer-3)] text-white",
  "bg-[var(--color-answer-4)] text-white",
  "bg-[var(--color-answer-5)] text-white",
  "bg-[var(--color-answer-6)] text-white",
  "bg-[var(--color-answer-7)] text-black",
  "bg-[var(--color-answer-8)] text-white",
] as const

export const PUZZLE_TILE_ICONS: LucideIcon[] = [
  Triangle,
  Square,
  Diamond,
  Circle,
  Star,
  Heart,
  Hexagon,
  Pentagon,
]

export const getPuzzleTileColor = (tileIndex: number): string =>
  PUZZLE_TILE_COLORS[tileIndex % PUZZLE_TILE_COLORS.length]

export const getPuzzleTileIcon = (tileIndex: number): LucideIcon =>
  PUZZLE_TILE_ICONS[tileIndex % PUZZLE_TILE_ICONS.length]
