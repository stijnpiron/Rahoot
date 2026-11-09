import { MEDIA_TYPES, QUESTION_TYPES } from "@razzia/common/constants"
import type { Question, QuestionMedia } from "@razzia/common/types/game"
import AlertDialog from "@razzia/web/components/AlertDialog"
import clsx from "clsx"
import { CircleAlert, Eye, EyeOff, Music, Trash2, Video } from "lucide-react"
import { useTranslation } from "react-i18next"
import { twMerge } from "tailwind-merge"

const SlideMedia = ({ media }: { media?: QuestionMedia }) => {
  if (media?.type === MEDIA_TYPES.IMAGE) {
    return (
      <img src={media.url} className="mx-auto max-h-14 w-auto rounded-md" />
    )
  }

  if (media?.type === MEDIA_TYPES.VIDEO) {
    return <Video className="text-muted-foreground mx-auto size-10" />
  }

  if (media?.type === MEDIA_TYPES.AUDIO) {
    return <Music className="text-muted-foreground mx-auto size-10" />
  }

  return null
}

interface Props {
  question: Question
  index: number
  isActive: boolean
  isInvalid: boolean
  canDelete: boolean
  onClick: () => void
  onDelete: () => void
  onToggleEnabled: () => void
}

const QuizzEditorCard = ({
  question,
  index,
  isActive,
  isInvalid,
  canDelete,
  onClick,
  onDelete,
  onToggleEnabled,
}: Props) => {
  const { t } = useTranslation()
  const isEnabled = question.enabled !== false

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          "group border-accent bg-background relative flex h-36 cursor-pointer flex-col justify-between gap-1 rounded-lg border-2 px-6 py-2",
          {
            "border-primary": isActive,
            "border-red-500": isInvalid,
            "opacity-50": !isEnabled,
          },
        ),
      )}
    >
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <span className="text-muted-foreground text-xs font-semibold">
          {index + 1}
        </span>

        {isInvalid && (
          <CircleAlert
            aria-label={t("quizz:questionHasErrors")}
            className="size-3.5 text-red-500"
          />
        )}
      </div>
      <p className="text-foreground truncate px-3 text-center text-xs font-semibold">
        {question.question || t("quizz:noQuestionYet")}
      </p>

      <SlideMedia media={question.media} />

      {question.type === QUESTION_TYPES.ESTIMATION ? (
        <div className="border-accent flex h-4 items-center rounded-md border px-1.5">
          <div className="bg-accent relative h-1 w-full rounded-full">
            <div className="bg-correct absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {question.answers.map((_, i) => (
            <div
              key={i}
              className="border-accent flex h-4 flex-1 items-center rounded-md border px-0.5"
            >
              {question.solutions?.includes(i) && (
                <div className="bg-correct ml-auto size-1.5 rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleEnabled()
        }}
        aria-label={t(
          isEnabled
            ? "quizz:question.disableQuestion"
            : "quizz:question.enableQuestion",
        )}
        className={clsx(
          "bg-background absolute top-1.5 right-8 rounded-sm p-1",
          isEnabled
            ? "text-muted-foreground/60 hover:text-red-500"
            : "text-red-500",
        )}
      >
        {isEnabled ? (
          <Eye className="size-3.5" />
        ) : (
          <EyeOff className="size-3.5" />
        )}
      </button>

      {canDelete && (
        <AlertDialog
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={t("quizz:question.deleteQuestion")}
              className="text-muted-foreground bg-background absolute top-1.5 right-1.5 hidden rounded-sm p-1 group-hover:block hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          }
          title={t("quizz:question.deleteQuestion")}
          description={t("quizz:question.deleteQuestionConfirm")}
          confirmLabel={t("common:delete")}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

export default QuizzEditorCard
