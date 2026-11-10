import {
  PUZZLE_MAX_ANSWERS,
  PUZZLE_MIN_ANSWERS,
} from "@razzia/common/constants"
import FieldError from "@razzia/web/components/forms/FieldError"
import {
  getPuzzleTileColor,
  getPuzzleTileIcon,
} from "@razzia/web/features/questions/puzzle/utils"
import {
  useQuizzEditor,
  type QuizzFormValues,
} from "@razzia/web/features/quizz/contexts/quizz-editor-context"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Minus, Plus } from "lucide-react"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

const PuzzleEditorTile = ({
  index,
  onDragHandleProps,
}: {
  index: number
  onDragHandleProps: Record<string, unknown>
}) => {
  const { questionPath } = useQuizzEditor()
  const { control } = useFormContext<QuizzFormValues>()
  const { t } = useTranslation()
  const Icon = getPuzzleTileIcon(index)

  return (
    <Controller
      control={control}
      name={questionPath(`answers.${index}`)}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1">
          <div
            className={`shadow-inset flex items-center gap-3 rounded-2xl px-4 py-4 ${getPuzzleTileColor(index)}`}
          >
            <button
              type="button"
              className="cursor-grab touch-none text-white/80"
              aria-label={t("quizz:question.puzzle.reorder")}
              {...onDragHandleProps}
            >
              <GripVertical className="size-5" />
            </button>
            <Icon className="size-5 shrink-0" />
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black/20 text-xs font-bold text-white">
              {index + 1}
            </span>
            <input
              {...field}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid ? `${field.name}-error` : undefined
              }
              className="w-full bg-transparent font-semibold placeholder-white/70 outline-none"
              placeholder={t("quizz:addAnswerPlaceholder")}
            />
          </div>
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

const PuzzleEditor = () => {
  const { currentQuestion, currentIndex, updateQuestion } = useQuizzEditor()
  const { t } = useTranslation()
  const { answers } = currentQuestion

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const addAnswer = () => {
    if (answers.length >= PUZZLE_MAX_ANSWERS) {
      return
    }

    updateQuestion(currentIndex, { answers: [...answers, ""] })
  }

  const removeAnswer = () => {
    if (answers.length <= PUZZLE_MIN_ANSWERS) {
      return
    }

    updateQuestion(currentIndex, { answers: answers.slice(0, -1) })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    updateQuestion(currentIndex, {
      answers: arrayMove([...answers], Number(active.id), Number(over.id)),
    })
  }

  return (
    <div className="z-10 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-sm font-semibold">
          {t("quizz:question.puzzle.orderHint")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={removeAnswer}
            aria-label={t("quizz:removeAnswer")}
            disabled={answers.length <= PUZZLE_MIN_ANSWERS}
            className="bg-accent text-accent-foreground hover:bg-accent flex size-7 items-center justify-center rounded-lg disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <button
            onClick={addAnswer}
            aria-label={t("quizz:addAnswer")}
            disabled={answers.length >= PUZZLE_MAX_ANSWERS}
            className="bg-accent text-accent-foreground hover:bg-accent flex size-7 items-center justify-center rounded-lg disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={answers.map((_, index) => index)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex max-w-xl flex-col gap-2">
            {answers.map((_, index) => (
              <SortableEditorTile key={index} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

const SortableEditorTile = ({ index }: { index: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isSorting,
  } = useSortable({ id: index })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isSorting ? "z-10 opacity-80" : undefined}
    >
      <PuzzleEditorTile
        index={index}
        onDragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default PuzzleEditor
