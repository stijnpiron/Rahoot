import { QUESTION_TYPES } from "@razzia/common/constants"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.DO

/**
 * Points are computed once when the manager submits the ranking and stored on
 * the answer, so the multiplier is always 1. `answerIds` holds the player's
 * zero-based rank, or is empty when the manager left them unranked.
 */
export const scoring: ScoringFn = (_question, _answer): number => 1
