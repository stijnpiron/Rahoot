import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"
import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"

const TrueFalseAnswers = ({
  answers,
  onSubmit,
  readOnly,
  fill,
}: AnswerComponentProps) => {
  const { t } = useTranslation()

  const handleSubmit = (key: number) => onSubmit([key])

  return (
    <div
      className={clsx(
        "mx-auto mb-4 grid w-full max-w-7xl gap-1 px-2 text-lg font-bold text-white md:text-xl",
        fill ? "flex-1 auto-rows-fr grid-cols-1 sm:grid-cols-2" : "grid-cols-2",
      )}
    >
      {answers.map((answer, key) => (
        <button
          key={key}
          onClick={() => handleSubmit(key)}
          disabled={readOnly}
          aria-label={t(`game:trueFalse.${answer}`)}
          className={clsx(
            "button shadow-inset flex items-center justify-center gap-3 rounded-2xl p-4 text-2xl font-bold sm:py-6",
            key === 0 ? "bg-emerald-600 text-white" : "bg-red-500 text-white",
          )}
        >
          {key === 0 ? (
            <Check className="size-6 md:size-8" />
          ) : (
            <X className="size-6 md:size-8" />
          )}
          {t(`game:trueFalse.${answer}`)}
        </button>
      ))}
    </div>
  )
}

export default TrueFalseAnswers
