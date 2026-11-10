import FieldError from "@razzia/web/components/forms/FieldError"
import GameBackground from "@razzia/web/components/GameBackground"
import QuestionEditorMedia from "@razzia/web/features/quizz/components/QuestionEditor/QuestionEditorMedia"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import clsx from "clsx"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

const SlideEditorTitle = () => {
  const { questionPath } = useQuizzEditor()
  const { control } = useFormContext<QuizzFormValues>()
  const { t } = useTranslation()

  return (
    <Controller
      control={control}
      name={questionPath("title")}
      render={({ field }) => (
        <input
          {...field}
          value={field.value ?? ""}
          className="bg-background placeholder:text-muted-foreground text-foreground w-full rounded-xl p-4 text-center text-xl font-semibold shadow-sm outline-none"
          placeholder={t("quizz:slide.title")}
        />
      )}
    />
  )
}

const SlideEditorText = () => {
  const { questionPath } = useQuizzEditor()
  const { control } = useFormContext<QuizzFormValues>()
  const { t } = useTranslation()

  return (
    <Controller
      control={control}
      name={questionPath("question")}
      render={({ field, fieldState }) => (
        <div className="z-10 flex flex-col gap-1">
          <textarea
            {...field}
            rows={3}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              fieldState.invalid ? `${field.name}-error` : undefined
            }
            className={clsx(
              "bg-background placeholder:text-muted-foreground text-foreground w-full resize-none rounded-xl p-4 text-center shadow-sm outline-none",
              fieldState.invalid && "ring-2 ring-red-500",
            )}
            placeholder={t("quizz:slide.placeholder")}
          />
          <FieldError
            id={`${field.name}-error`}
            errors={[fieldState.error]}
            pill
          />
        </div>
      )}
    />
  )
}

const SlideEditor = () => {
  const { isRemoving } = useQuizzEditor()

  if (isRemoving) {
    return null
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="mx-auto flex max-w-7xl flex-1 flex-col gap-4 overflow-y-auto p-6">
        <SlideEditorTitle />
        <SlideEditorText />
        <QuestionEditorMedia />

        <GameBackground />
      </main>
    </div>
  )
}

export default SlideEditor
