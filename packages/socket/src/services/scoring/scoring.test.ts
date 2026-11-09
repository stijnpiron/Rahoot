import { QUESTION_TYPES, SCORING_MODES } from "@razzia/common/constants"
import type { Answer, PinArea, ScoringMode } from "@razzia/common/types/game"
import { QUESTION_SCORING } from "@razzia/socket/services/scoring"
import {
  createEstimationQuestion,
  createQuestion,
} from "@razzia/socket/test/fixtures"
import { describe, expect, it } from "vitest"

const answer = (answerIds: number[], pin?: Answer["pin"]): Answer => ({
  playerId: "p",
  answerIds,
  ...(pin && { pin }),
  points: 0,
})

describe("single choice scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.SINGLE]
  const question = createQuestion({ solutions: [1] })

  it("scores only the right answer", () => {
    expect(score(question, answer([1]))).toBe(1)
    expect(score(question, answer([0]))).toBe(0)
  })

  it("rejects several answers even if one is right", () => {
    expect(score(question, answer([0, 1]))).toBe(0)
  })
})

describe("multiple choice scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.MULTI]
  const question = (scoringMode?: ScoringMode) =>
    createQuestion({
      type: QUESTION_TYPES.MULTI,
      solutions: [0, 1],
      options: scoringMode ? { scoringMode } : undefined,
    })

  it.each([
    [SCORING_MODES.STRICT, [0, 1], 1],
    [SCORING_MODES.STRICT, [0], 0],
    [SCORING_MODES.STRICT, [0, 1, 2], 0],
    [SCORING_MODES.BALANCED, [0], 0.5],
    [SCORING_MODES.BALANCED, [0, 1, 2], 0.5],
    [SCORING_MODES.BALANCED, [0, 2, 3], 0],
    [SCORING_MODES.LENIENT, [0, 2, 3], 0.5],
    [SCORING_MODES.LENIENT, [0, 1, 2, 3], 1],
    [SCORING_MODES.BALANCED, [0, 0, 0, 0], 0.5],
    [SCORING_MODES.LENIENT, [0, 0, 0, 0], 0.5],
  ])("%s mode scores %j as %d", (mode, answerIds, expected) => {
    expect(score(question(mode), answer(answerIds))).toBe(expected)
  })

  it("defaults to balanced mode", () => {
    expect(score(question(), answer([0, 2]))).toBe(0)
    expect(score(question(), answer([0]))).toBe(0.5)
  })
})

describe("estimation scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.ESTIMATION]
  const question = createEstimationQuestion({ solutions: [50] })

  it("scores the accuracy of the estimation", () => {
    expect(score(question, answer([50]))).toBe(1)
    expect(score(question, answer([60]))).toBe(0.5)
    expect(score(question, answer([61]))).toBe(0)
  })

  it("scores nothing without an answer", () => {
    expect(score(question, answer([]))).toBe(0)
  })
})

describe("puzzle scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.PUZZLE]
  const question = createQuestion({
    type: QUESTION_TYPES.PUZZLE,
    answers: ["A", "B", "C", "D"],
  })

  it("scores 1.0 for the perfect order", () => {
    expect(score(question, answer([0, 1, 2, 3]))).toBe(1)
  })

  it("gives partial credit for correctly placed tiles", () => {
    expect(score(question, answer([0, 2, 1, 3]))).toBe(0.5)
    expect(score(question, answer([3, 2, 1, 0]))).toBe(0)
  })

  it("rejects answers with the wrong number of tiles", () => {
    expect(score(question, answer([0, 1, 2]))).toBe(0)
    expect(score(question, answer([]))).toBe(0)
  })
})

describe("true/false scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.TRUE_FALSE]
  const question = createQuestion({
    type: QUESTION_TYPES.TRUE_FALSE,
    answers: ["true", "false"],
    solutions: [0],
  })

  it("scores only the right answer", () => {
    expect(score(question, answer([0]))).toBe(1)
    expect(score(question, answer([1]))).toBe(0)
  })

  it("rejects several answers even if one is right", () => {
    expect(score(question, answer([0, 1]))).toBe(0)
  })
})

describe("pin scoring", () => {
  const score = QUESTION_SCORING[QUESTION_TYPES.PIN]
  const circleArea: PinArea = { kind: "circle", cx: 0.5, cy: 0.5, r: 0.2 }

  const pinQuestion = (area: PinArea | null) =>
    createQuestion({
      type: QUESTION_TYPES.PIN,
      answers: [],
      options: { area },
    })

  it("scores 1.0 inside the area", () => {
    expect(score(pinQuestion(circleArea), answer([], { x: 0.5, y: 0.5 }))).toBe(
      1,
    )
  })

  it("scores 0 outside the area", () => {
    expect(score(pinQuestion(circleArea), answer([], { x: 0.9, y: 0.5 }))).toBe(
      0,
    )
  })

  it("scores 0 without a pin or an area", () => {
    expect(score(pinQuestion(circleArea), answer([0]))).toBe(0)
    expect(score(pinQuestion(null), answer([], { x: 0.5, y: 0.5 }))).toBe(0)
  })
})
