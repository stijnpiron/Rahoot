import { DO_FLOWS, DO_TIMER_EXPIRIES } from "@razzia/common/constants"
import { isDoOptions } from "@razzia/common/questions/options"
import type { QuestionRefinement } from "@razzia/common/validators/questions"
import { z } from "zod"

export const doOptionsValidator = z.object({
  flow: z.enum(DO_FLOWS).optional(),
  doneButton: z.boolean().optional(),
  timerExpiry: z.enum(DO_TIMER_EXPIRIES).optional(),
})

export const refineDoQuestion: QuestionRefinement = (
  { options, answers },
  addIssue,
) => {
  if (answers.length > 0) {
    addIssue(["answers"], "errors:quizz.doAnswersUnsupported")
  }

  if (options !== undefined && !isDoOptions(options)) {
    addIssue(["options"], "errors:quizz.doInvalidOptions")
  }
}
