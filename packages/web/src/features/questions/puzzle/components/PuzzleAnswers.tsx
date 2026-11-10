import Button from "@razzia/web/components/Button"
import {
  getPuzzleTileColor,
  getPuzzleTileIcon,
} from "@razzia/web/features/questions/puzzle/utils"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
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
import clsx from "clsx"
import {
  useState,
  createElement,
  useRef,
  useEffect,
  type RefObject,
} from "react"
import { useTranslation } from "react-i18next"
import { GripVertical, ChevronsUpDown } from "lucide-react"

const PuzzleScrollbar = ({
  viewportRef,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
}) => {
  const [height, setHeight] = useState(0)
  const [scrollRatio, setScrollRatio] = useState(0)
  const [thumbRatio, setThumbRatio] = useState(1)
  const draggingRef = useRef(false)

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const update = () => {
      setHeight(viewport.clientHeight)
      const total = viewport.scrollHeight
      setThumbRatio(total > 0 ? viewport.clientHeight / total : 1)
      const max = total - viewport.clientHeight
      setScrollRatio(max > 0 ? viewport.scrollTop / max : 0)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    for (const child of viewport.children) {
      observer.observe(child)
    }
    viewport.addEventListener("scroll", update, { passive: true })

    return () => {
      observer.disconnect()
      viewport.removeEventListener("scroll", update)
    }
  }, [viewportRef])

  const scrollToRatio = (ratio: number) => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const max = viewport.scrollHeight - viewport.clientHeight
    viewport.scrollTop = Math.max(0, Math.min(1, ratio)) * max
  }

  if (thumbRatio >= 1) {
    return null
  }

  const trackPadding = 6
  const usable = Math.max(height - trackPadding * 2, 0)
  const thumbHeight = Math.max(usable * thumbRatio, 40)
  const maxThumbOffset = usable - thumbHeight
  const thumbOffset = trackPadding + scrollRatio * maxThumbOffset

  return (
    <div
      data-puzzle-scrollbar
      aria-hidden
      className="relative w-4 shrink-0 touch-none rounded-full bg-black/20 p-1"
      style={{ height }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        draggingRef.current = true
        const rect = event.currentTarget.getBoundingClientRect()
        scrollToRatio((event.clientY - rect.top) / usable - thumbHeight / 2 / usable)
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) {
          return
        }

        const rect = event.currentTarget.getBoundingClientRect()
        scrollToRatio((event.clientY - rect.top - thumbHeight / 2) / usable)
      }}
      onPointerUp={() => {
        draggingRef.current = false
      }}
    >
      <div
        className="absolute left-1 w-2 rounded-full bg-white shadow-md"
        style={{ top: thumbOffset, height: thumbHeight }}
      />
    </div>
  )
}

const PuzzleTile = ({
  id,
  text,
  tileIndex,
  disabled,
}: {
  id: number
  text: string
  tileIndex: number
  disabled?: boolean
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  return (
    <div
      ref={setNodeRef}
      data-puzzle-tile
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={clsx(
        "shadow-inset flex touch-none items-center gap-3 rounded-2xl px-4 py-4 font-bold select-none",
        getPuzzleTileColor(tileIndex),
        isDragging && "z-10 opacity-80",
      )}
    >
      {createElement(GripVertical, {
        className: "size-5 shrink-0 text-white/80",
      })}
      {createElement(getPuzzleTileIcon(tileIndex), {
        className: "size-6 shrink-0",
      })}
      <span className="flex-1 text-lg">{text}</span>
    </div>
  )
}

const PuzzleAnswers = ({
  answers,
  puzzleOrder,
  onSubmit,
  readOnly,
  fill,
}: AnswerComponentProps) => {
  const { t } = useTranslation()
  const [order, setOrder] = useState<number[]>(() =>
    answers.map((_, index) => index),
  )
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    const viewport = scrollViewportRef.current

    if (!viewport) {
      return
    }

    const checkOverflow = () => {
      setCanScroll(viewport.scrollHeight > viewport.clientHeight)
    }

    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(viewport)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Display positions map to original tile indices through the server-side
  // shuffle; submissions are original indices in the arranged order.
  const toOriginalIndices = (displayOrder: number[]) =>
    puzzleOrder
      ? displayOrder.map((displayIndex) => puzzleOrder[displayIndex] ?? 0)
      : displayOrder

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setOrder((current) => {
      const from = current.indexOf(Number(active.id))
      const to = current.indexOf(Number(over.id))

      return arrayMove(current, from, to)
    })
  }

  return (
    <div
      className={clsx("mx-auto mb-4 flex w-full flex-col px-2", {
        "min-h-0 flex-1": fill,
        "max-w-md": !fill,
      })}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div
            className={clsx(
              "flex min-h-0 gap-2",
              fill ? "flex-1" : "max-h-[55dvh]",
            )}
          >
            <div
              ref={scrollViewportRef}
              className="puzzle-scroll min-h-0 min-w-0 flex flex-1 flex-col gap-2 overflow-y-auto"
            >
              {order.map((displayIndex) => (
                <PuzzleTile
                  key={displayIndex}
                  id={displayIndex}
                  text={answers[displayIndex] ?? ""}
                  tileIndex={puzzleOrder?.[displayIndex] ?? displayIndex}
                  disabled={readOnly}
                />
              ))}
            </div>
            <PuzzleScrollbar viewportRef={scrollViewportRef} />
          </div>
          {canScroll && (
            <div
              aria-hidden
              className="mt-1 flex shrink-0 items-center justify-center gap-1 text-white/80"
            >
              <ChevronsUpDown className="size-5 animate-pulse" />
              <span className="text-sm font-bold">
                {t("game:puzzleScrollHint", "Scroll for more options")}
              </span>
            </div>
          )}
        </SortableContext>
      </DndContext>

      {!readOnly && (
        <Button
          onClick={() => onSubmit(toOriginalIndices(order))}
          className="mx-auto mt-4 w-full max-w-xs shrink-0 shadow-md"
        >
          {t("game:confirm")}
        </Button>
      )}
    </div>
  )
}

export default PuzzleAnswers
