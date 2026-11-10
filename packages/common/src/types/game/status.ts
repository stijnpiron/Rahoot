import type {
  Player,
  PinPoint,
  QuestionMedia,
  QuestionOptions,
  QuestionType,
} from "@razzia/common/types/game"

export const STATUS = {
  SHOW_ROOM: "SHOW_ROOM",
  SHOW_START: "SHOW_START",
  SHOW_PREPARED: "SHOW_PREPARED",
  SHOW_QUESTION: "SHOW_QUESTION",
  SHOW_SLIDE: "SHOW_SLIDE",
  SELECT_ANSWER: "SELECT_ANSWER",
  SHOW_RESULT: "SHOW_RESULT",
  SHOW_RESPONSES: "SHOW_RESPONSES",
  SHOW_LEADERBOARD: "SHOW_LEADERBOARD",
  DO_DONE: "DO_DONE",
  FINISHED: "FINISHED",
  SUMMARY: "SUMMARY",
  WAIT: "WAIT",
} as const

export type Status = (typeof STATUS)[keyof typeof STATUS]

export interface CommonStatusDataMap {
  SHOW_START: { time: number; subject: string; media?: QuestionMedia }
  SHOW_PREPARED: {
    totalAnswers: number
    questionNumber: number
    questionType: QuestionType
    puzzleOrder?: number[]
  }
  SHOW_QUESTION: {
    question: string
    media?: QuestionMedia
    cooldown: number
    instruction?: string
    manualProceed?: boolean
  }
  SHOW_SLIDE: {
    title?: string
    question: string
    media?: QuestionMedia
  }
  SELECT_ANSWER: {
    question: string
    answers: string[]
    media?: QuestionMedia
    time: number
    totalPlayer: number
    questionType: QuestionType
    options?: QuestionOptions
    answersOnly: boolean
    puzzleOrder?: number[]
    instruction?: string
    doParticipants?: Array<{ playerId: string; username: string }>
  }
  SHOW_RESULT: {
    correct: boolean
    message: string
    points: number
    myPoints: number
    rank: number
    aheadOfMe: string | null
  }
  WAIT: { text: string }
  FINISHED: {
    subject: string
    top: Array<Pick<Player, "username" | "points">>
    rank?: number
  }
  SUMMARY: { subject: string; totalPlayers: number; totalQuestions: number }
}

interface ManagerExtraStatus {
  SHOW_ROOM: { text: string; inviteCode?: string }
  SHOW_RESPONSES: {
    question: string
    responses: Record<number, number>
    solutions?: number[]
    answers: string[]
    media?: QuestionMedia
    type: QuestionType
    options?: QuestionOptions
    note?: string
    puzzleFullyCorrect?: { count: number; total: number }
    doRanking?: Array<{ playerId: string; username: string; points: number }>
    pins?: Array<PinPoint & { name: string; correct: boolean }>
  }
  SHOW_LEADERBOARD: { oldLeaderboard: Player[]; leaderboard: Player[] }
  DO_DONE: {
    done: Array<{ playerId: string; username: string }>
  }
}

export type PlayerStatusDataMap = CommonStatusDataMap

export type ManagerStatusDataMap = CommonStatusDataMap & ManagerExtraStatus

export type StatusDataMap = PlayerStatusDataMap & ManagerStatusDataMap
