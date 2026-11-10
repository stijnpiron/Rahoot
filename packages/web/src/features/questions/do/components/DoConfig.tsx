import { DO_FLOWS, DO_TIMER_EXPIRIES } from "@razzia/common/constants"
import Switch from "@razzia/web/components/Switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@razzia/web/components/Select"
import {
  getDoDoneButton,
  getDoFlow,
  getDoTimerExpiry,
} from "@razzia/web/features/questions/do/utils"
import ConfigField from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigField"
import ConfigSection from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigSection"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import { CircleCheck, ClipboardList, Hourglass, Timer } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

const DoConfig = () => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()
  const { options } = currentQuestion
  const flow = getDoFlow(options)
  const doneButton = getDoDoneButton(options)
  const timerExpiry = getDoTimerExpiry(options)

  const update = (patch: Record<string, unknown>) => {
    updateQuestion(currentIndex, {
      options: { ...options, ...patch },
    })
  }

  const handleInstructionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateQuestion(currentIndex, {
      instruction: e.target.value || undefined,
    })
  }

  return (
    <>
      <ConfigField>
        <ConfigField.Label
          icon={<ClipboardList className="size-4" />}
          label={t("quizz:question.config.instruction")}
        />
        <textarea
          value={currentQuestion.instruction ?? ""}
          onChange={handleInstructionChange}
          aria-label={t("quizz:question.config.instruction")}
          placeholder={t("quizz:question.config.instructionPlaceholder")}
          rows={2}
          className="placeholder:text-muted-foreground text-foreground field-sizing-content min-h-16 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none"
        />
        <ConfigField.Description>
          {t("quizz:question.config.instructionHint")}
        </ConfigField.Description>
      </ConfigField>

      <ConfigSection title={t("quizz:question.config.doFlow")}>
        <ConfigField>
          <ConfigField.Label
            icon={<Timer className="size-4" />}
            label={t("quizz:question.config.doFlow")}
          />
          <Select value={flow} onValueChange={(value) => update({ flow: value })}>
            <SelectTrigger aria-label={t("quizz:question.config.doFlow")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DO_FLOWS.TIMER}>
                {t("quizz:question.config.doFlowTimer")}
              </SelectItem>
              <SelectItem value={DO_FLOWS.OPEN}>
                {t("quizz:question.config.doFlowOpen")}
              </SelectItem>
            </SelectContent>
          </Select>
          <ConfigField.Description>
            {t("quizz:question.config.doFlowHint")}
          </ConfigField.Description>
        </ConfigField>

        {flow === DO_FLOWS.TIMER && (
          <ConfigField>
            <ConfigField.Label
              icon={<Hourglass className="size-4" />}
              label={t("quizz:question.config.timerExpiry")}
            />
            <Select
              value={timerExpiry}
              onValueChange={(value) => update({ timerExpiry: value })}
            >
              <SelectTrigger aria-label={t("quizz:question.config.timerExpiry")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DO_TIMER_EXPIRIES.STOP}>
                  {t("quizz:question.config.timerExpiryStop")}
                </SelectItem>
                <SelectItem value={DO_TIMER_EXPIRIES.ELAPSED}>
                  {t("quizz:question.config.timerExpiryElapsed")}
                </SelectItem>
              </SelectContent>
            </Select>
            <ConfigField.Description>
              {t("quizz:question.config.timerExpiryHint")}
            </ConfigField.Description>
          </ConfigField>
        )}

        <ConfigField>
          <ConfigField.Label
            icon={<CircleCheck className="size-4" />}
            label={t("quizz:question.config.doneButton")}
            action={
              <Switch
                aria-label={t("quizz:question.config.doneButton")}
                checked={doneButton}
                onCheckedChange={(checked) => update({ doneButton: checked })}
              />
            }
          />
          <ConfigField.Description>
            {t("quizz:question.config.doneButtonHint")}
          </ConfigField.Description>
        </ConfigField>
      </ConfigSection>
    </>
  )
}

export default DoConfig
