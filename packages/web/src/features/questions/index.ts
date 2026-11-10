import { QUESTION_TYPES } from "@razzia/common/constants"
import type {
  Question,
  QuestionOptions,
  QuestionType,
  ScoringMode,
} from "@razzia/common/types/game"
import * as estimation from "@razzia/web/features/questions/estimation"
import * as multi from "@razzia/web/features/questions/multi"
import * as pin from "@razzia/web/features/questions/pin"
import * as puzzle from "@razzia/web/features/questions/puzzle"
import * as single from "@razzia/web/features/questions/single"
import * as slide from "@razzia/web/features/questions/slide"
import { slideInitialValues } from "@razzia/web/features/questions/slide"
import * as trueFalse from "@razzia/web/features/questions/trueFalse"
import type {
  AnswerComponentProps,
  PreparedComponentProps,
  ResponsesComponentProps,
  SolutionPickerProps,
} from "@razzia/web/features/questions/types"
import type { ComponentType } from "react"

interface QuestionRegistryEntry {
  labelKey: string
  defaultOptions?: QuestionOptions
  scoringModes?: ScoringMode[]
  initialValues: (_question: Question) => Partial<Question>
  AnswerComponent?: ComponentType<AnswerComponentProps>
  ConfigComponent?: ComponentType
  AnswersEditor?: ComponentType
  SolutionPicker?: ComponentType<SolutionPickerProps>
  PreparedComponent?: ComponentType<PreparedComponentProps>
  ResponsesComponent?: ComponentType<ResponsesComponentProps>
}

export const QUESTION_REGISTRY: Record<QuestionType, QuestionRegistryEntry> = {
  single,
  multi,
  estimation,
  trueFalse,
  puzzle,
  pin,
  slide: {
    ...slide,
    initialValues: slideInitialValues,
  },
}

export const QUESTION_TYPE_LIST = (
  Object.keys(QUESTION_REGISTRY) as QuestionType[]
).filter((type) => type !== QUESTION_TYPES.SLIDE)
