import { EVENTS, PUZZLE_MAX_ANSWERS } from "@razzia/common/constants"
import { pinPointValidator } from "@razzia/common/validators/questions/pin"
import { z } from "zod"

const gameMessageValidator = z.object({ gameId: z.string().min(1) })

const answerKeysValidator = z
  .array(z.number())
  .max(PUZZLE_MAX_ANSWERS)
  .refine((keys) => new Set(keys).size === keys.length)

const selectedAnswerValidator = z
  .object({
    answerKeys: answerKeysValidator.optional(),
    answerPin: pinPointValidator.optional(),
  })
  .superRefine(({ answerKeys, answerPin }, ctx) => {
    if (answerKeys === undefined && answerPin === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["answerKeys"],
        message: "errors:invalidRequest",
      })
    }

    if (answerKeys !== undefined && answerPin !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["answerPin"],
        message: "errors:invalidRequest",
      })
    }
  })

export const clientEventValidators = {
  [EVENTS.MANAGER.RECONNECT]: gameMessageValidator,
  [EVENTS.MANAGER.LEAVE]: gameMessageValidator,
  [EVENTS.MANAGER.KICK_PLAYER]: gameMessageValidator.extend({
    playerId: z.string().min(1),
  }),
  [EVENTS.MANAGER.START_GAME]: gameMessageValidator,
  [EVENTS.MANAGER.ADVANCE]: gameMessageValidator,
  [EVENTS.MANAGER.SET_LOCK]: gameMessageValidator.extend({
    locked: z.boolean(),
  }),
  [EVENTS.PLAYER.LOGIN]: z.object({ ticket: z.string().min(1) }),
  [EVENTS.PLAYER.RECONNECT]: gameMessageValidator,
  [EVENTS.PLAYER.LEAVE]: gameMessageValidator,
  [EVENTS.PLAYER.SELECTED_ANSWER]: gameMessageValidator.extend({
    data: selectedAnswerValidator,
  }),
}
