import type { PinArea } from "@razzia/common/types/game"
import {
  isPinAreaDegenerate,
  pinAccuracy,
  pointInPinArea,
} from "@razzia/common/questions/pin"
import { describe, expect, it } from "vitest"

const rect: PinArea = { kind: "rect", x: 0.2, y: 0.2, w: 0.4, h: 0.4 }
const circle: PinArea = { kind: "circle", cx: 0.5, cy: 0.5, r: 0.2 }
const freehand: PinArea = {
  kind: "freehand",
  points: [
    { x: 0.2, y: 0.2 },
    { x: 0.6, y: 0.2 },
    { x: 0.6, y: 0.6 },
    { x: 0.2, y: 0.6 },
  ],
}

describe("pointInPinArea", () => {
  it("detects points inside each shape", () => {
    expect(pointInPinArea({ x: 0.4, y: 0.4 }, rect)).toBe(true)
    expect(pointInPinArea({ x: 0.5, y: 0.5 }, circle)).toBe(true)
    expect(pointInPinArea({ x: 0.3, y: 0.3 }, freehand)).toBe(true)
  })

  it("rejects points outside each shape", () => {
    expect(pointInPinArea({ x: 0.9, y: 0.9 }, rect)).toBe(false)
    expect(pointInPinArea({ x: 0.5, y: 0.9 }, circle)).toBe(false)
    expect(pointInPinArea({ x: 0.1, y: 0.1 }, freehand)).toBe(false)
  })

  it("handles concave freehand shapes", () => {
    const notch: PinArea = {
      kind: "freehand",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0.5, y: 0.5 },
        { x: 0, y: 1 },
      ],
    }

    expect(pointInPinArea({ x: 0.8, y: 0.8 }, notch)).toBe(true)
    expect(pointInPinArea({ x: 0.4, y: 0.8 }, notch)).toBe(false)
  })
})

describe("pinAccuracy", () => {
  it("scores 1 inside and 0 outside", () => {
    expect(pinAccuracy({ x: 0.4, y: 0.4 }, rect)).toBe(1)
    expect(pinAccuracy({ x: 0.95, y: 0.4 }, rect)).toBe(0)
  })
})

describe("isPinAreaDegenerate", () => {
  it("rejects empty shapes", () => {
    expect(isPinAreaDegenerate({ kind: "rect", x: 0, y: 0, w: 0, h: 1 })).toBe(
      true,
    )
    expect(isPinAreaDegenerate({ kind: "circle", cx: 0, cy: 0, r: 0 })).toBe(
      true,
    )
    expect(
      isPinAreaDegenerate({ kind: "freehand", points: [{ x: 0, y: 0 }] }),
    ).toBe(true)
    expect(isPinAreaDegenerate(rect)).toBe(false)
  })
})
