import type { PinArea, PinPoint } from "@razzia/common/types/game"
import Button from "@razzia/web/components/Button"
import PinAreaCanvas, {
  pinPointFromEvent,
} from "@razzia/web/features/questions/pin/components/PinAreaCanvas"
import {
  translatePinArea,
  type PinShape,
} from "@razzia/web/features/questions/pin/utils"
import clsx from "clsx"
import {
  Circle,
  Eraser,
  Hand,
  PenTool,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

const SHAPE_ICONS: Record<Exclude<EditorMode, "move">, typeof Square> = {
  rect: Square,
  circle: Circle,
  freehand: PenTool,
}

type EditorMode = PinShape | "move"

const MODES: EditorMode[] = ["rect", "circle", "freehand", "move"]

interface Props {
  mediaUrl: string
  alt: string
  area: PinArea | null
  onChange: (_area: PinArea | null) => void
}

/**
 * Inline area editor drawn directly over the question image preview in the
 * media panel. Drag to draw, drag the area center to move, erase to clear.
 */
const PinAreaEditor = ({ mediaUrl, alt, area, onChange }: Props) => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<EditorMode>("rect")
  // The move tool needs an area: fall back to the rectangle tool when the
  // area is deleted (or not drawn yet) while move is selected.
  const activeMode: EditorMode =
    mode === "move" && area === null ? "rect" : mode
  const [preview, setPreview] = useState<PinArea | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Local working copy during a drag: the form (via onChange) only sees the
  // committed result on pointerup, avoiding re-render feedback while dragging.
  const [draftArea, setDraftArea] = useState<PinArea | null>(null)
  const dragRef = useRef<
    | { mode: "move"; anchor: PinPoint; origin: PinArea }
    | { mode: "draw"; anchor: PinPoint; points: PinPoint[] }
    | null
  >(null)

  const buildDrawnArea = (
    anchor: PinPoint,
    points: PinPoint[],
  ): PinArea | null => {
    const last = points.at(-1) ?? anchor

    if (activeMode === "rect") {
      return {
        kind: "rect",
        x: Math.min(anchor.x, last.x),
        y: Math.min(anchor.y, last.y),
        w: Math.abs(last.x - anchor.x),
        h: Math.abs(last.y - anchor.y),
      }
    }

    if (activeMode === "circle") {
      // Store the radius as a fraction of the image width so the rendered
      // (aspect-corrected) circle matches what the manager dragged in pixels.
      const rect = wrapperRef.current?.getBoundingClientRect()

      if (!rect || rect.width === 0) {
        return null
      }

      const radiusPx = Math.hypot(
        (last.x - anchor.x) * rect.width,
        (last.y - anchor.y) * rect.height,
      )

      return {
        kind: "circle",
        cx: anchor.x,
        cy: anchor.y,
        r: radiusPx / rect.width,
      }
    }

    return points.length >= 3 ? { kind: "freehand", points } : null
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pinPointFromEvent(event, wrapperRef.current)

    if (!point) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    draggingRef.current = true
    setIsDragging(true)

    if (activeMode === "move") {
      if (!area) {
        draggingRef.current = false
        setIsDragging(false)

        return
      }

      dragRef.current = { mode: "move", anchor: point, origin: area }
      setDraftArea(area)

      return
    }

    dragRef.current = { mode: "draw", anchor: point, points: [point] }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return
    }

    const point = pinPointFromEvent(event, wrapperRef.current)
    const drag = dragRef.current

    if (!point || !drag) {
      return
    }

    if (drag.mode === "move") {
      // Position from the pointerdown origin: idempotent, no incremental drift.
      setDraftArea(
        translatePinArea(
          drag.origin,
          point.x - drag.anchor.x,
          point.y - drag.anchor.y,
        ),
      )

      return
    }

    drag.points.push(point)
    setPreview(buildDrawnArea(drag.anchor, drag.points))
  }

  const handlePointerUp = () => {
    draggingRef.current = false
    setIsDragging(false)
    const drag = dragRef.current

    if (drag?.mode === "draw") {
      const drawn = buildDrawnArea(drag.anchor, drag.points)

      if (drawn) {
        onChange(drawn)
      }
    }

    if (drag?.mode === "move" && draftArea) {
      onChange(draftArea)
    }

    dragRef.current = null
    setPreview(null)
    setDraftArea(null)
  }

  const cursorClass = (() => {
    if (activeMode === "move") {
      return isDragging ? "cursor-grabbing" : "cursor-grab"
    }

    return activeMode === "freehand" ? "cursor-pencil" : "cursor-crosshair"
  })()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {MODES.map((value) => {
          const Icon = value === "move" ? Hand : SHAPE_ICONS[value]
          const labelKey =
            value === "move"
              ? "quizz:question.config.pin.move"
              : `quizz:question.config.pin.shape.${value}`

          return (
            <Button
              key={value}
              size="sm"
              aria-label={t(labelKey)}
              aria-pressed={activeMode === value}
              title={t(
                value === "move"
                  ? "quizz:question.config.pin.moveHint"
                  : labelKey,
              )}
              onClick={() => setMode(value)}
              disabled={value === "move" && area === null}
              className={clsx(
                activeMode === value
                  ? "bg-primary text-white"
                  : "bg-accent text-accent-foreground",
                value === "move" && area === null && "disabled:opacity-40",
              )}
            >
              <Icon className="size-5" />
            </Button>
          )
        })}

        <Button
          size="sm"
          aria-label={t("quizz:question.config.pin.erase")}
          onClick={() => onChange(null)}
          disabled={!area}
          className="bg-accent text-accent-foreground disabled:opacity-40"
        >
          <Eraser className="size-5" />
        </Button>

        <div className="mx-1 flex gap-1">
          <Button
            size="sm"
            aria-label={t("quizz:question.config.pin.zoomIn")}
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            className="bg-accent text-accent-foreground"
          >
            <ZoomIn className="size-5" />
          </Button>
          <Button
            size="sm"
            aria-label={t("quizz:question.config.pin.zoomOut")}
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            className="bg-accent text-accent-foreground"
          >
            <ZoomOut className="size-5" />
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-xl">
        <div
          ref={wrapperRef}
          className={clsx("inline-block touch-none", cursorClass)}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <PinAreaCanvas
            mediaUrl={mediaUrl}
            alt={alt}
            area={draftArea ?? area}
            previewArea={preview}
            className="max-h-[60vh]"
          />
        </div>
      </div>
    </div>
  )
}

export default PinAreaEditor
