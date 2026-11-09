import type {
  PinPoint,
  QuestionMedia,
  QuestionOptions,
} from "@razzia/common/types/game"
import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"

export interface AnswerComponentProps {
  answers: string[]
  options?: QuestionOptions
  puzzleOrder?: number[]
  media?: QuestionMedia
  onSubmit: (_answerKeys: number[]) => void
  onSubmitPin?: (_pin: PinPoint) => void
  readOnly?: boolean
  fill?: boolean
}

export interface SolutionPickerProps {
  index: number
  isSelected: boolean
}

export interface PreparedComponentProps {
  totalAnswers: number
  puzzleOrder?: number[]
}

export interface ResponsesComponentProps {
  data: ManagerStatusDataMap["SHOW_RESPONSES"]
}
