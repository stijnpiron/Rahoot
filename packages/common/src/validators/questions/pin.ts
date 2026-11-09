import { MEDIA_TYPES } from "@razzia/common/constants"
import { isPinAreaDegenerate } from "@razzia/common/questions/pin"
import type { PinArea, PinQuestionOptions } from "@razzia/common/types/game"
import type { QuestionRefinement } from "@razzia/common/validators/questions"
import { z } from "zod"

export const pinPointValidator = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})

export const pinAreaValidator = z.union([
  z.object({
    kind: z.literal("rect"),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().min(0).max(1),
    h: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal("circle"),
    cx: z.number().min(0).max(1),
    cy: z.number().min(0).max(1),
    r: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal("freehand"),
    points: z.array(pinPointValidator),
  }),
])

export const pinOptionsValidator = z.object({
  area: pinAreaValidator.nullable(),
})

export const refinePinQuestion: QuestionRefinement = (
  { media, options },
  addIssue,
) => {
  if (media?.type !== MEDIA_TYPES.IMAGE) {
    addIssue(["media"], "errors:quizz.pinMediaRequired")
  }

  if (!isPinOptionsValid(options)) {
    addIssue(["options"], "errors:quizz.pinInvalidOptions")

    return
  }

  if (options.area !== null && isPinAreaDegenerate(options.area)) {
    addIssue(["options", "area"], "errors:quizz.pinInvalidArea")
  }
}

const isPinOptionsValid = (options: unknown): options is PinQuestionOptions =>
  typeof options === "object" &&
  options !== null &&
  "area" in options &&
  (isPinAreaOrNull((options as PinQuestionOptions).area) ||
    (options as PinQuestionOptions).area === null)

const isPinAreaOrNull = (area: unknown): area is PinArea =>
  typeof area === "object" && area !== null && "kind" in area
