// oxlint-disable typescript/no-unnecessary-condition
import {
  EVENTS,
  MAX_POINTS,
  MEDIA_TYPES,
  NO_TIME_LIMIT,
  QUESTION_TYPES,
  QUIZZ_MODES,
  START_SCREEN_MODES,
} from "@razzia/common/constants"
import { isEstimationOptions } from "@razzia/common/questions/options"
import type {
  Answer,
  GameResult,
  GameSettings,
  GameUpdateQuestion,
  PinPoint,
  Player,
  Question,
  QuestionResult,
  Quizz,
  QuizzMode,
} from "@razzia/common/types/game"
import type { Server, Socket } from "@razzia/common/types/game/socket"
import {
  type Status,
  STATUS,
  type StatusDataMap,
} from "@razzia/common/types/game/status"
import { CooldownTimer } from "@razzia/socket/services/game/cooldown-timer"
import { PlayerManager } from "@razzia/socket/services/game/player-manager"
import { countFullyCorrect } from "@razzia/socket/services/scoring/puzzle"
import {
  countAnswers,
  scoreQuestion,
  type ScoredPlayer,
} from "@razzia/socket/services/scoring/round"
import { orderToPoint, timeToPoint } from "@razzia/socket/utils/game"
import { shuffleIndices } from "@razzia/socket/utils/shuffle"
import sleep, { SECOND_MS } from "@razzia/socket/utils/sleep"
import { nanoid } from "nanoid"

type BroadcastFn = <T extends Status>(
  _status: T,
  _data: StatusDataMap[T],
) => void
type SendFn = <T extends Status>(
  _target: string,
  _status: T,
  _data: StatusDataMap[T],
) => void

export interface RoundManagerOptions {
  quizz: Quizz
  players: PlayerManager
  cooldown: CooldownTimer
  io: Server
  gameId: string
  getManagerId: () => string
  broadcast: BroadcastFn
  send: SendFn
  onNewQuestion: () => void
  onGameFinished: (_result: GameResult) => void
  getSettings: () => GameSettings
}

interface RoundStep {
  name: string
  gameModes: QuizzMode[]
  skip?: () => boolean
  enter: () => void
  delay: (_settings: GameSettings) => number
}

export class RoundManager {
  private readonly opts: RoundManagerOptions
  private readonly steps: RoundStep[]
  private started = false
  private currentQuestion = 0
  private currentStep = -1
  private playersAnswers: Answer[] = []
  private startTime = 0
  private acceptingAnswers = false
  private leaderboard: Player[] = []
  private tempOldLeaderboard: Player[] | null = null
  private questionsHistory: QuestionResult[] = []
  private autoAdvanceTimer: NodeJS.Timeout | null = null
  private puzzleOrder: number[] | null = null
  private doDone: Array<{ playerId: string; username: string }> = []
  private proceed: (() => void) | null = null

  constructor(opts: RoundManagerOptions) {
    this.opts = opts

    const steps: RoundStep[] = [
      {
        name: "reveal",
        gameModes: [QUIZZ_MODES.QUIZ, QUIZZ_MODES.SURVEY],
        enter: () => {
          this.showResults()
        },
        delay: (settings) => settings.autoAdvance.responsesDelay,
      },
      {
        name: "leaderboard",
        gameModes: [QUIZZ_MODES.QUIZ],
        skip: () => this.isLastQuestion() || this.isSameCategoryNext(),
        enter: () => {
          this.showLeaderboard()
        },
        delay: (settings) => settings.autoAdvance.leaderboardDelay,
      },
    ]

    this.steps = steps.filter((step) =>
      step.gameModes.includes(opts.quizz.gameMode),
    )
  }

  isStarted(): boolean {
    return this.started
  }

  private get question(): Question {
    return this.opts.quizz.questions[this.currentQuestion]
  }

  private isAskingQuestion(): boolean {
    return this.currentStep < 0
  }

  private isLastQuestion(): boolean {
    return !this.opts.quizz.questions[this.currentQuestion + 1]
  }

  private isSameCategoryNext(): boolean {
    const category = this.question.category?.trim()
    const next = this.opts.quizz.questions[this.currentQuestion + 1]

    return Boolean(category) && next?.category?.trim() === category
  }

  private isSurvey(): boolean {
    return this.opts.quizz.gameMode === QUIZZ_MODES.SURVEY
  }

  private isPuzzle(): boolean {
    return this.question.type === QUESTION_TYPES.PUZZLE
  }

  private isDo(): boolean {
    return this.question.type === QUESTION_TYPES.DO
  }

  private isPin(): boolean {
    return this.question.type === QUESTION_TYPES.PIN
  }

  private isSlide(): boolean {
    return this.question.type === QUESTION_TYPES.SLIDE
  }

  private buildPinsPayload(
    scored: ScoredPlayer[] = [],
  ): Array<PinPoint & { name: string; correct: boolean }> {
    return this.playersAnswers.flatMap((answer) => {
      if (!answer.pin) {
        return []
      }

      const player = this.opts.players.findById(answer.playerId)

      if (!player) {
        return []
      }

      const score = scored.find((s) => s.id === player.id)

      return [
        {
          ...answer.pin,
          name: player.username,
          correct: score?.lastCorrect ?? false,
        },
      ]
    })
  }

  /**
   * Shuffled display order for the current puzzle question, memoized so
   * SHOW_PREPARED and SELECT_ANSWER broadcast the same order.
   */
  private getPuzzleOrder(): number[] {
    this.puzzleOrder ??= shuffleIndices(this.question.answers.length)

    return this.puzzleOrder
  }

  // ── Auto advance ─────────────────────────────────────────────────────────

  clearAutoAdvance(): void {
    if (!this.autoAdvanceTimer) {
      return
    }

    clearInterval(this.autoAdvanceTimer)
    this.autoAdvanceTimer = null
    this.emitAutoAdvance(null)
  }

  private emitAutoAdvance(state: { seconds: number; total: number } | null) {
    this.opts.io
      .to(this.opts.getManagerId())
      .emit(EVENTS.MANAGER.AUTO_ADVANCE, state)
  }

  private scheduleAutoAdvance(delay: number): void {
    this.clearAutoAdvance()

    if (!this.opts.getSettings().autoAdvance.enable) {
      return
    }

    let remaining = delay

    this.emitAutoAdvance({ seconds: remaining, total: delay })

    this.autoAdvanceTimer = setInterval(() => {
      remaining -= 1

      if (remaining > 0) {
        this.emitAutoAdvance({ seconds: remaining, total: delay })

        return
      }

      this.clearAutoAdvance()
      this.advance()
    }, SECOND_MS)
  }

  // ── Flow ─────────────────────────────────────────────────────────────────

  getReconnectInfo(): GameUpdateQuestion | null {
    if (!this.started) {
      return null
    }

    return {
      current: this.currentQuestion + 1,
      total: this.opts.quizz.questions.length,
    }
  }

  async start(socket: Socket): Promise<void> {
    if (this.started) {
      return
    }

    if (this.opts.players.count() === 0) {
      socket.emit(EVENTS.GAME.ERROR_MESSAGE, "errors:game.noPlayersConnected")

      return
    }

    this.started = true

    const { startScreen } = this.opts.getSettings()
    this.opts.broadcast(STATUS.SHOW_START, {
      time: startScreen.time,
      subject: this.opts.quizz.subject,
      media: this.opts.quizz.media,
    })

    if (startScreen.mode === START_SCREEN_MODES.MANUAL) {
      await new Promise<void>((resolve) => {
        this.proceed = resolve
      })
    } else {
      await sleep(startScreen.time)
    }

    this.opts.io.to(this.opts.gameId).emit(EVENTS.GAME.START_COOLDOWN)
    await this.opts.cooldown.start(3)

    void this.newQuestion()
  }

  advance(): void {
    if (!this.started) {
      return
    }

    if (this.proceed) {
      this.clearProceed()

      return
    }

    this.clearAutoAdvance()

    if (this.isAskingQuestion()) {
      if (this.isSlide()) {
        this.nextQuestion()

        return
      }

      if (this.isDo()) {
        // There is no cooldown to abort: skipping counts as submitting the
        // ranking with the players who tapped Done first and the rest at the
        // bottom.
        this.submitDoOrder(this.doDone.map((done) => done.playerId))

        return
      }

      this.acceptingAnswers = false
      this.opts.cooldown.abort()

      return
    }

    this.runStep(this.currentStep + 1)
  }

  private runStep(index: number): void {
    const step = this.steps[index]

    if (!step) {
      this.nextQuestion()

      return
    }

    if (step.skip?.()) {
      this.runStep(index + 1)

      return
    }

    this.currentStep = index
    step.enter()
    this.scheduleAutoAdvance(step.delay(this.opts.getSettings()))
  }

  private clearProceed(): void {
    this.proceed?.()
    this.proceed = null
  }

  private nextQuestion(): void {
    if (this.isLastQuestion()) {
      this.finish()

      return
    }

    this.currentQuestion += 1
    void this.newQuestion()
  }

  private async newQuestion(): Promise<void> {
    if (!this.started) {
      return
    }

    this.currentStep = -1
    this.puzzleOrder = null
    this.doDone = []
    this.proceed = null

    this.opts.onNewQuestion()

    this.opts.io.to(this.opts.gameId).emit(EVENTS.GAME.UPDATE_QUESTION, {
      current: this.currentQuestion + 1,
      total: this.opts.quizz.questions.length,
    })

    if (this.isSlide()) {
      this.opts.broadcast(STATUS.SHOW_SLIDE, {
        title: this.question.title,
        question: this.question.question,
        media: this.question.media,
      })

      return
    }

    const puzzleOrder = this.isPuzzle() ? this.getPuzzleOrder() : undefined

    this.opts.broadcast(STATUS.SHOW_PREPARED, {
      totalAnswers: this.question.answers.length,
      questionNumber: this.currentQuestion + 1,
      questionType: this.question.type,
      puzzleOrder,
    })

    await sleep(2)

    if (!this.started) {
      return
    }

    const imageMedia = (() => {
      if (this.question.media?.type !== MEDIA_TYPES.IMAGE) {
        return undefined
      }

      return this.question.media
    })()

    this.opts.broadcast(STATUS.SHOW_QUESTION, {
      question: this.question.question,
      media: imageMedia,
      cooldown: this.question.cooldown,
      instruction: this.isDo() ? this.question.instruction : undefined,
      manualProceed: this.question.manualProceed ? true : undefined,
    })

    if (this.question.manualProceed) {
      await new Promise<void>((resolve) => {
        this.proceed = resolve
      })
    } else {
      await sleep(this.question.cooldown)
    }

    if (!this.started) {
      return
    }

    this.startTime = Date.now()
    this.acceptingAnswers = true

    this.opts.broadcast(STATUS.SELECT_ANSWER, {
      question: this.question.question,
      answers: puzzleOrder
        ? puzzleOrder.map((index) => this.question.answers[index])
        : this.question.answers,
      media: this.question.media,
      time: this.question.time,
      totalPlayer: this.opts.players.count(),
      questionType: this.question.type,
      options: this.question.options,
      answersOnly: this.opts.getSettings().answersOnly,
      puzzleOrder,
      instruction: this.isDo() ? this.question.instruction : undefined,
      doParticipants: this.isDo()
        ? this.opts.players.getAll().map((player) => ({
            playerId: player.id,
            username: player.username,
          }))
        : undefined,
    })

    if (this.isDo()) {
      // The manager submits the ranking; the question stays open until then.
      return
    }

    await this.opts.cooldown.start(this.question.time)

    this.acceptingAnswers = false

    if (!this.started) {
      return
    }

    this.runStep(0)
  }

  // ── Steps ────────────────────────────────────────────────────────────────

  private recordHistory(players: Player[], scored: ScoredPlayer[] = []): void {
    this.questionsHistory.push({
      ...this.question,
      solutions: this.isSurvey() ? undefined : this.question.solutions,
      playerAnswers: players.map((player) => {
        const storedAnswer = this.playersAnswers.find(
          (a) => a.playerId === player.id,
        )
        const score = scored.find((s) => s.id === player.id)

        return {
          playerName: player.username,
          answerIds: storedAnswer?.answerIds ?? null,
          ...(this.isPin() && { pin: storedAnswer?.pin ?? null }),
          ...(score && {
            correct: score.lastCorrect,
            points: score.lastPoints,
          }),
        }
      }),
    })
  }

  private showResults(): void {
    const currentPlayers = this.opts.players.getAll()
    const answerCounts = countAnswers(this.playersAnswers)

    if (this.isSurvey()) {
      this.opts.send(this.opts.getManagerId(), STATUS.SHOW_RESPONSES, {
        ...this.question,
        solutions: undefined,
        responses: answerCounts,
        ...(this.isPin() && { pins: this.buildPinsPayload() }),
        ...(this.isDo() && { doRanking: this.buildDoRanking() }),
      })

      currentPlayers.forEach((player) => {
        this.opts.send(player.id, STATUS.WAIT, {
          text: "game:answerNoted",
        })
      })

      this.recordHistory(currentPlayers)
      this.playersAnswers = []

      return
    }

    const oldLeaderboard = (() => {
      if (this.leaderboard.length === 0) {
        return currentPlayers.map((p) => ({ ...p }))
      }

      return this.leaderboard.map((p) => ({ ...p }))
    })()

    const sortedPlayers = scoreQuestion(
      this.question,
      currentPlayers,
      this.playersAnswers,
    )

    this.opts.players.replace(sortedPlayers)

    sortedPlayers.forEach((player, index) => {
      const aheadPlayer = sortedPlayers[index - 1]

      this.opts.send(player.id, STATUS.SHOW_RESULT, {
        correct: player.lastCorrect,
        message: player.lastCorrect ? "game:correct" : "game:wrong",
        points: player.lastPoints,
        myPoints: player.points,
        rank: index + 1,
        aheadOfMe: aheadPlayer ? aheadPlayer.username : null,
      })
    })

    this.opts.send(this.opts.getManagerId(), STATUS.SHOW_RESPONSES, {
      ...this.question,
      responses: answerCounts,
      puzzleFullyCorrect: this.isPuzzle()
        ? {
            count: countFullyCorrect(this.question, this.playersAnswers),
            total: currentPlayers.length,
          }
        : undefined,
      ...(this.isPin() && { pins: this.buildPinsPayload(sortedPlayers) }),
      ...(this.isDo() && { doRanking: this.buildDoRanking() }),
    })

    this.recordHistory(currentPlayers, sortedPlayers)

    this.leaderboard = sortedPlayers
    this.tempOldLeaderboard ??= oldLeaderboard
    this.playersAnswers = []
  }

  private buildDoRanking(): Array<{
    playerId: string
    username: string
    points: number
  }> {
    return this.playersAnswers
      .filter((answer) => answer.answerIds.length > 0)
      .sort((a, b) => a.answerIds[0] - b.answerIds[0])
      .map((answer) => {
        const player = this.opts.players.findById(answer.playerId)

        return {
          playerId: answer.playerId,
          username: player?.username ?? "???",
          points: answer.points,
        }
      })
  }

  private showLeaderboard(): void {
    const oldLeaderboard = this.tempOldLeaderboard ?? this.leaderboard

    this.opts.send(this.opts.getManagerId(), STATUS.SHOW_LEADERBOARD, {
      oldLeaderboard: oldLeaderboard.slice(0, 5),
      leaderboard: this.leaderboard.slice(0, 5),
    })

    this.tempOldLeaderboard = null
  }

  private finishSurvey(): void {
    const players = this.opts.players.getAll()

    const summary = {
      subject: this.opts.quizz.subject,
      totalPlayers: players.length,
      totalQuestions: this.opts.quizz.questions.filter(
        (question) => question.type !== QUESTION_TYPES.SLIDE,
      ).length,
    }

    this.opts.send(this.opts.getManagerId(), STATUS.SUMMARY, summary)

    players.forEach((player) => {
      this.opts.send(player.id, STATUS.SUMMARY, summary)
    })
  }

  private finish(): void {
    this.started = false
    this.clearAutoAdvance()
    this.clearProceed()

    const finalPlayers = this.isSurvey()
      ? this.opts.players.getAll()
      : this.leaderboard

    this.opts.onGameFinished({
      id: `${Date.now()}-${nanoid(8)}`,
      gameMode: this.opts.quizz.gameMode,
      subject: this.opts.quizz.subject,
      date: new Date().toISOString(),
      players: finalPlayers.map((player, index) => ({
        username: player.username,
        points: player.points,
        rank: index + 1,
      })),
      questions: this.questionsHistory,
    })

    if (this.isSurvey()) {
      this.finishSurvey()

      return
    }

    const top = this.leaderboard
      .slice(0, 3)
      .map(({ username, points }) => ({ username, points }))

    this.opts.send(this.opts.getManagerId(), STATUS.FINISHED, {
      subject: this.opts.quizz.subject,
      top,
    })

    this.leaderboard.forEach((player, index) => {
      this.opts.send(player.id, STATUS.FINISHED, {
        subject: this.opts.quizz.subject,
        top,
        rank: index + 1,
      })
    })
  }

  // ── Player actions ───────────────────────────────────────────────────────

  private normalizeAnswer(
    answerIds: number[],
    pin?: PinPoint,
  ): number[] | null {
    if (this.isPin()) {
      return pin ? [] : null
    }

    const { options } = this.question

    if (!isEstimationOptions(options)) {
      return answerIds
    }

    const value = answerIds.at(0)

    if (
      answerIds.length !== 1 ||
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return null
    }

    return [Math.min(options.max, Math.max(options.min, value))]
  }

  selectAnswer(socket: Socket, answerIds: number[], pin?: PinPoint): void {
    const player = this.opts.players.findById(socket.id)

    if (!player || !this.acceptingAnswers) {
      return
    }

    if (this.isDo()) {
      this.markDone(player)

      return
    }

    if (this.playersAnswers.find((a) => a.playerId === socket.id)) {
      return
    }

    const submitted = this.normalizeAnswer(answerIds, pin)

    if (!submitted) {
      return
    }

    const points = (() => {
      if (isEstimationOptions(this.question.options)) {
        return this.question.maxPoints ?? MAX_POINTS
      }

      if (this.question.time === NO_TIME_LIMIT) {
        return orderToPoint(
          this.playersAnswers.length,
          this.opts.players.count(),
          this.question.maxPoints,
        )
      }

      return timeToPoint(this.startTime, this.question)
    })()

    this.playersAnswers.push({
      playerId: player.id,
      answerIds: submitted,
      ...(this.isPin() && pin && { pin }),
      points,
    })

    this.opts.send(socket.id, STATUS.WAIT, {
      text: "game:waitingForAnswers",
    })

    socket
      .to(this.opts.gameId)
      .emit(EVENTS.GAME.PLAYER_ANSWER, this.playersAnswers.length)
    this.opts.players.broadcastCount()
    this.endIfEveryoneAnswered()
  }

  private markDone(player: Player): void {
    if (this.doDone.some((d) => d.playerId === player.id)) {
      return
    }

    this.doDone = [...this.doDone, { playerId: player.id, username: player.username }]

    this.opts.send(this.opts.getManagerId(), STATUS.DO_DONE, {
      done: this.doDone,
    })

    this.opts.send(player.id, STATUS.WAIT, {
      text: "game:waitingForAnswers",
    })

    this.opts.io
      .to(this.opts.gameId)
      .emit(EVENTS.GAME.PLAYER_ANSWER, this.doDone.length)
  }

  submitDoOrder(order: string[]): void {
    if (!this.isDo() || !this.acceptingAnswers) {
      return
    }

    const ranked = order.filter((playerId) =>
      this.opts.players.findById(playerId),
    )
    const total = ranked.length
    const maxPoints = this.question.maxPoints ?? MAX_POINTS

    this.playersAnswers = this.opts.players
      .getAll()
      .map((player) => {
        const rank = ranked.indexOf(player.id)
        const fraction = (() => {
          if (rank < 0) {
            return 0
          }

          return total <= 1 ? 1 : (total - 1 - rank) / (total - 1)
        })()

        return {
          playerId: player.id,
          answerIds: rank >= 0 ? [rank] : [],
          points: Math.round(fraction * maxPoints),
        }
      })

    this.acceptingAnswers = false
    this.opts.cooldown.abort()
    this.runStep(0)
  }

  updatePlayerId(oldId: string, newId: string): void {
    this.playersAnswers = this.playersAnswers.map((answer) =>
      answer.playerId === oldId ? { ...answer, playerId: newId } : answer,
    )
  }

  endIfEveryoneAnswered(): void {
    if (!this.acceptingAnswers) {
      return
    }

    const connected = this.opts.players.getAll().filter((p) => p.connected)
    const everyoneAnswered = connected.every((player) =>
      this.playersAnswers.some((a) => a.playerId === player.id),
    )

    if (connected.length > 0 && everyoneAnswered) {
      this.opts.cooldown.abort()
    }
  }
}
