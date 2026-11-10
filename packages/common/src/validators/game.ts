import {
  AUTO_ADVANCE_DELAY,
  START_SCREEN_MODES,
  START_SCREEN_TIME,
} from "@razzia/common/constants"
import {
  inviteCodeValidator,
  usernameValidator,
} from "@razzia/common/validators/auth"
import z from "zod"

export const createGameValidator = z.object({
  quizzId: z.string().min(1, "errors:quizz.notFound"),
})

export const checkGameValidator = z.object({
  inviteCode: inviteCodeValidator,
})

export const joinGameValidator = z.object({
  inviteCode: inviteCodeValidator,
  username: usernameValidator.optional(),
})

const delayValidator = z
  .number()
  .int()
  .min(AUTO_ADVANCE_DELAY.MIN, "errors:game.invalidAutoAdvanceDelay")
  .max(AUTO_ADVANCE_DELAY.MAX, "errors:game.invalidAutoAdvanceDelay")

const timeValidator = z
  .number()
  .int()
  .min(START_SCREEN_TIME.MIN, "errors:game.invalidStartScreenTime")
  .max(START_SCREEN_TIME.MAX, "errors:game.invalidStartScreenTime")

export const gameSettingsSchema = z.object({
  generatedUsernames: z.boolean(),
  answersOnly: z.boolean(),
  startScreen: z.object({
    mode: z.enum([START_SCREEN_MODES.AUTO, START_SCREEN_MODES.MANUAL]),
    time: timeValidator,
  }),
  autoAdvance: z.object({
    enable: z.boolean(),
    responsesDelay: delayValidator,
    leaderboardDelay: delayValidator,
  }),
})

export const gameSettingsValidator = gameSettingsSchema.partial()
