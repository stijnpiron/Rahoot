import type {
  PinArea,
  PinPoint,
  PinQuestionOptions,
} from "@razzia/common/types/game"

export const createDefaultPinOptions = (): PinQuestionOptions => ({
  area: null,
})

export const getPinOptions = (options?: unknown): PinQuestionOptions =>
  options && typeof options === "object" && "area" in options
    ? (options as PinQuestionOptions)
    : createDefaultPinOptions()

export const PIN_SHAPES = ["rect", "circle", "freehand"] as const

export type PinShape = (typeof PIN_SHAPES)[number]

export const pinAreaToSvgPath = (area: PinArea): string => {
  if (area.kind === "rect") {
    return `M ${area.x * 100} ${area.y * 100} H ${(area.x + area.w) * 100} V ${
      (area.y + area.h) * 100
    } H ${area.x * 100} Z`
  }

  if (area.kind === "circle") {
    // Circle is rendered as a <circle>, never as a path.
    return ""
  }

  return `${area.points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x * 100} ${point.y * 100}`,
    )
    .join(" ")} Z`
}

export const getPinAreaCenter = (area: PinArea): PinPoint => {  if (area.kind === "rect") {
    return { x: area.x + area.w / 2, y: area.y + area.h / 2 }
  }

  if (area.kind === "circle") {
    return { x: area.cx, y: area.cy }
  }

  const sum = area.points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  )

  return {
    x: sum.x / area.points.length,
    y: sum.y / area.points.length,
  }
}

export const translatePinArea = (
  area: PinArea,
  dx: number,
  dy: number,
): PinArea => {
  if (area.kind === "rect") {
    return { ...area, x: area.x + dx, y: area.y + dy }
  }

  if (area.kind === "circle") {
    return { ...area, cx: area.cx + dx, cy: area.cy + dy }
  }

  return {
    ...area,
    points: area.points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    })),
  }
}
