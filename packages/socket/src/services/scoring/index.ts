import type { Answer, Question, QuestionType } from "@razzia/common/types/game"
import * as doScoring from "./do"
import * as estimation from "./estimation"
import * as multi from "./multi"
import * as pin from "./pin"
import * as puzzle from "./puzzle"
import * as single from "./single"
import * as trueFalse from "./trueFalse"

export type ScoringFn = (_question: Question, _answer: Answer) => number

export const QUESTION_SCORING: Record<
  Exclude<QuestionType, "slide">,
  ScoringFn
> = {
  [single.type]: single.scoring,
  [multi.type]: multi.scoring,
  [estimation.type]: estimation.scoring,
  [trueFalse.type]: trueFalse.scoring,
  [puzzle.type]: puzzle.scoring,
  [pin.type]: pin.scoring,
  [doScoring.type]: doScoring.scoring,
}
