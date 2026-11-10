import { QUIZZ_MODES } from "@razzia/common/constants"
import ConfigField from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigField"
import ConfigSection from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorConfig/ConfigSection"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { ListChecks } from "lucide-react"
import { useTranslation } from "react-i18next"

const TrueFalseConfig = () => {
  const { gameMode, currentQuestion, currentIndex, updateQuestion } =
    useQuizzEditor()
  const { t } = useTranslation()

  if (gameMode === QUIZZ_MODES.SURVEY) {
    return null
  }

  const solution = currentQuestion.solutions?.[0] ?? 0

  const handleSelect = (index: number) => {
    updateQuestion(currentIndex, { solutions: [index] })
  }

  return (
    <ConfigSection title={t("quizz:question.config.scoring")}>
      <ConfigField>
        <ConfigField.Label
          icon={<ListChecks className="size-4" />}
          label={t("quizz:question.config.trueFalse.correctAnswer")}
        />
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 1].map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(index)}
              aria-pressed={solution === index}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                solution === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent",
              )}
            >
              {t(`game:trueFalse.${index === 0 ? "true" : "false"}`)}
            </button>
          ))}
        </div>
      </ConfigField>
    </ConfigSection>
  )
}

export default TrueFalseConfig
