import type { PinPoint } from "@razzia/common/types/game"
import Button from "@razzia/web/components/Button"
import PinAreaCanvas, {
  pinPointFromEvent,
} from "@razzia/web/features/questions/pin/components/PinAreaCanvas"
import type { AnswerComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { useTranslation } from "react-i18next"

const MIN_SCALE = 1
const MAX_SCALE = 8
const WHEEL_FACTOR = 1.1
const TAP_SLOP = 5

interface ZoomState {
  scale: number
  x: number
  y: number
}

const IDENTITY: ZoomState = { scale: 1, x: 0, y: 0 }

const PinAnswers = ({
  media,
  onSubmitPin,
  readOnly,
}: AnswerComponentProps) => {
  const { t } = useTranslation()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; midX: number; midY: number } | null>(
    null,
  )
  const pan = useRef<{
    startX: number
    startY: number
    origin: ZoomState
    moved: boolean
  } | null>(null)
  const [pin, setPin] = useState<PinPoint | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [zoom, setZoom] = useState<ZoomState>(IDENTITY)

  // Reset the zoom when a new image is shown (adjusting state during render).
  const [renderedUrl, setRenderedUrl] = useState(media?.url)

  if (renderedUrl !== media?.url) {
    setRenderedUrl(media?.url)
    setZoom(IDENTITY)
  }

  const handlePinChange = (point: PinPoint) => {
    if (readOnly || confirmed) {
      return
    }

    setPin(point)
  }

  const handleConfirm = () => {
    if (!pin || !onSubmitPin || confirmed) {
      return
    }

    onSubmitPin(pin)
    setConfirmed(true)
  }

  const relative = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const rect = wrapperRef.current?.getBoundingClientRect()

      if (!rect) {
        return null
      }

      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    },
    [],
  )

  const clampZoom = useCallback((state: ZoomState): ZoomState => {
    const rect = wrapperRef.current?.getBoundingClientRect()

    if (!rect) {
      return state
    }

    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale))

    if (scale === MIN_SCALE) {
      return { scale, x: 0, y: 0 }
    }

    return {
      scale,
      x: Math.min(0, Math.max(rect.width * (1 - scale), state.x)),
      y: Math.min(0, Math.max(rect.height * (1 - scale), state.y)),
    }
  }, [])

  // Anchors the wrapper point (cx, cy) while scaling, so the image zooms
  // around the cursor/pinch center and pans with the pinch center.
  const zoomAround = useCallback(
    (cx: number, cy: number, factor: number) => {
      setZoom((current) => {
        const scale = current.scale * factor

        return clampZoom({
          scale,
          x: cx - (scale / current.scale) * (cx - current.x),
          y: cy - (scale / current.scale) * (cy - current.y),
        })
      })
    },
    [clampZoom],
  )

  // Non-passive listener so wheel zoom can preventDefault page scrolling,
  // while ctrl+wheel (trackpad pinch) is left to the browser zoom.
  useEffect(() => {
    const element = wrapperRef.current

    if (!element) {
      return
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return
      }

      event.preventDefault()
      const pos = relative(event)

      if (pos) {
        zoomAround(
          pos.x,
          pos.y,
          event.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR,
        )
      }
    }

    element.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      element.removeEventListener("wheel", onWheel)
    }
  }, [relative, zoomAround])

  const handlePointerDown = (event: ReactPointerEvent) => {
    const pos = relative(event)

    if (!pos) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, pos)

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]

      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      }
      pan.current = null

      return
    }

    if (zoom.scale > 1) {
      pan.current = {
        startX: pos.x,
        startY: pos.y,
        origin: zoom,
        moved: false,
      }

      return
    }

    const point = pinPointFromEvent(event, canvasRef.current)

    if (point) {
      handlePinChange(point)
    }
  }

  const handlePointerMove = (event: ReactPointerEvent) => {
    const pos = relative(event)

    if (!pos || !pointers.current.has(event.pointerId)) {
      return
    }

    pointers.current.set(event.pointerId, pos)

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const previous = pinch.current

      pinch.current = { dist, midX, midY }

      if (previous.dist > 0) {
        zoomAround(midX, midY, dist / previous.dist)
      }

      return
    }

    if (pan.current) {
      const dx = pos.x - pan.current.startX
      const dy = pos.y - pan.current.startY

      if (Math.hypot(dx, dy) > TAP_SLOP) {
        pan.current.moved = true
      }

      setZoom(
        clampZoom({
          ...pan.current.origin,
          x: pan.current.origin.x + dx,
          y: pan.current.origin.y + dy,
        }),
      )

      return
    }

    if (event.buttons === 0) {
      return
    }

    const point = pinPointFromEvent(event, canvasRef.current)

    if (point) {
      handlePinChange(point)
    }
  }

  const handlePointerUp = (event: ReactPointerEvent) => {
    pointers.current.delete(event.pointerId)

    if (pointers.current.size < 2) {
      pinch.current = null
    }

    // While zoomed in, dragging pans; a tap without drag still drops the pin.
    if (pan.current && !pan.current.moved) {
      const point = pinPointFromEvent(event, canvasRef.current)

      if (point) {
        handlePinChange(point)
      }
    }

    if (pointers.current.size === 0) {
      pan.current = null
    }
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-3 pb-4">
      <div
        ref={wrapperRef}
        className={clsx(
          "relative inline-block max-w-full overflow-hidden rounded-xl",
          !readOnly && !confirmed && "cursor-crosshair touch-none",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <PinAreaCanvas
          rootRef={canvasRef}
          zoom={zoom}
          mediaUrl={media?.url}
          alt={t("game:pin.imageAlt")}
          ownPin={pin}
          className="max-h-[55vh]"
        />
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!pin || confirmed}
        className="bg-correct px-8 py-3 text-lg font-bold text-white disabled:opacity-50"
      >
        {t(confirmed ? "game:pin.confirmed" : "game:pin.confirm")}
      </Button>
    </div>
  )
}

export default PinAnswers
