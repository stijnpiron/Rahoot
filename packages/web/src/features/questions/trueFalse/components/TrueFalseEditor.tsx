import { QUIZZ_MODES } from "@razzia/common/constants"
import { useQuizzEditor } from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"

const TrueFalseEditor = () => {
  const { gameMode } = useQuizzEditor()
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((index) => {
        const isCorrect = gameMode !== QUIZZ_MODES.SURVEY && index === 0

        return (
          <div
            key={index}
            className={clsx(
              "shadow-inset flex items-center justify-center gap-3 rounded-2xl px-4 py-6 text-lg font-bold text-white",
              index === 0 ? "bg-emerald-600" : "bg-red-500",
            )}
          >
            {isCorrect ? (
              <Check className="size-6" />
            ) : (
              <X className="size-6 opacity-60" />
            )}
            {t(`game:trueFalse.${index === 0 ? "true" : "false"}`)}
          </div>
        )
      })}
    </div>
  )
}

export default TrueFalseEditor
