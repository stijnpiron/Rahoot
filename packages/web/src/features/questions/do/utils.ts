import { DO_FLOWS, DO_TIMER_EXPIRIES } from "@razzia/common/constants"
import { isDoOptions } from "@razzia/common/questions/options"
import type {
  DoFlow,
  DoTimerExpiry,
  QuestionOptions,
} from "@razzia/common/types/game"

export const DEFAULT_DO_FLOW: DoFlow = DO_FLOWS.TIMER

export const DEFAULT_DO_DONE_BUTTON = true

export const DEFAULT_DO_TIMER_EXPIRY: DoTimerExpiry = DO_TIMER_EXPIRIES.STOP

export const getDoFlow = (options?: QuestionOptions): DoFlow =>
  isDoOptions(options) ? (options.flow ?? DEFAULT_DO_FLOW) : DEFAULT_DO_FLOW

export const getDoDoneButton = (options?: QuestionOptions): boolean =>
  isDoOptions(options)
    ? (options.doneButton ?? DEFAULT_DO_DONE_BUTTON)
    : DEFAULT_DO_DONE_BUTTON

export const getDoTimerExpiry = (options?: QuestionOptions): DoTimerExpiry =>
  isDoOptions(options)
    ? (options.timerExpiry ?? DEFAULT_DO_TIMER_EXPIRY)
    : DEFAULT_DO_TIMER_EXPIRY
