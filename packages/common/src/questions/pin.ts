import type { PinArea, PinPoint } from "@razzia/common/types/game"

const MIN_FREEHAND_POINTS = 3

export const isPinAreaDegenerate = (area: PinArea): boolean => {
  if (area.kind === "rect") {
    return area.w <= 0 || area.h <= 0
  }

  if (area.kind === "circle") {
    return area.r <= 0
  }

  return area.points.length < MIN_FREEHAND_POINTS
}

export const pointInPinArea = (point: PinPoint, area: PinArea): boolean => {
  if (area.kind === "rect") {
    return (
      point.x >= area.x &&
      point.x <= area.x + area.w &&
      point.y >= area.y &&
      point.y <= area.y + area.h
    )
  }

  if (area.kind === "circle") {
    const dx = point.x - area.cx
    const dy = point.y - area.cy

    return dx * dx + dy * dy <= area.r * area.r
  }

  let inside = false

  area.points.forEach((a, index) => {
    const b = area.points[(index - 1 + area.points.length) % area.points.length]

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x

    if (intersects) {
      inside = !inside
    }
  })

  return inside
}

export const pinAccuracy = (point: PinPoint, area: PinArea): number =>
  pointInPinArea(point, area) ? 1 : 0
