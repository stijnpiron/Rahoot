import type { PinArea, PinPoint } from "@razzia/common/types/game"
import clsx from "clsx"
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react"
import { pinAreaToSvgPath } from "@razzia/web/features/questions/pin/utils"

/**
 * Converts a pointer event into normalized (0-1) image coordinates. The
 * wrapper must size itself exactly around the image (inline-block).
 */
export const pinPointFromEvent = (
  event: { clientX: number; clientY: number },
  element: Element | null,
): PinPoint | null => {
  const rect = element?.getBoundingClientRect()

  if (!rect || rect.width === 0 || rect.height === 0) {
    return null
  }

  return {
    x: clamp01((event.clientX - rect.left) / rect.width),
    y: clamp01((event.clientY - rect.top) / rect.height),
  }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

interface Props {
  mediaUrl?: string
  alt?: string
  area?: PinArea | null
  previewArea?: PinArea | null
  pins?: Array<PinPoint & { name?: string; correct?: boolean }>
  ownPin?: PinPoint | null
  className?: string
  /** Optional pan/zoom transform applied to the canvas root. */
  zoom?: { scale: number; x: number; y: number }
  /** Exposes the canvas root so callers can map pointer events to image coordinates. */
  rootRef?: RefObject<HTMLDivElement | null>
}

/**
 * Renders the pin image with a normalized (0-1) SVG overlay. The overlay is
 * stretched over the image box, so every coordinate maps linearly.
 */
const PinAreaCanvas = ({
  mediaUrl,
  alt = "",
  area,
  previewArea,
  pins,
  ownPin,
  className,
  zoom,
  rootRef,
}: Props) => {
  const rootNodeRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [aspect, setAspect] = useState(1)
  const shownArea = previewArea ?? area

  // The SVG overlay is stretched (preserveAspectRatio="none"), so a stored
  // circle needs an aspect-corrected ry to render as a true circle. Measure
  // the rendered image box, since that is what the overlay maps onto.
  useEffect(() => {
    const image = imageRef.current

    if (!image) {
      return
    }

    const update = () => {
      // Prefer the natural dimensions: independent of layout, and only
      // available once the image has actually loaded.
      const natural =
        image.complete && image.naturalWidth > 0
          ? image.naturalWidth / image.naturalHeight
          : 0

      if (natural > 0) {
        setAspect(natural)

        return
      }

      const rect = image.getBoundingClientRect()

      if (rect.width > 0 && rect.height > 0) {
        setAspect(rect.width / rect.height)
      }
    }

    // The image may load between mount and the first observer callback.
    const frame = requestAnimationFrame(update)
    const observer = new ResizeObserver(update)

    observer.observe(image)
    image.addEventListener("load", update)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      image.removeEventListener("load", update)
    }
  }, [mediaUrl])

  return (
    <div
      ref={(element) => {
        rootNodeRef.current = element

        if (rootRef) {
          rootRef.current = element
        }
      }}
      style={
        zoom
          ? {
              transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
              transformOrigin: "0 0",
            }
          : undefined
      }
      className={clsx("relative inline-block select-none", className)}
    >
      {mediaUrl ? (
        <img
          ref={imageRef}
          src={mediaUrl}
          alt={alt}
          draggable={false}
          className="block max-h-[inherit] max-w-full"
        />
      ) : (
        <div className="bg-accent flex h-64 w-96 items-center justify-center">
          <span className="text-muted-foreground text-sm">?</span>
        </div>
      )}

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {/* The SVG overlay is stretched (preserveAspectRatio="none"), so a
            stored circle needs an aspect-corrected ry to render as a true
            circle. */}
        {shownArea?.kind === "circle" && (
          <ellipse
            cx={shownArea.cx * 100}
            cy={shownArea.cy * 100}
            rx={shownArea.r * 100}
            ry={shownArea.r * 100 * aspect}
            className="fill-correct/50 stroke-correct"
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {shownArea && shownArea.kind !== "circle" && (
          <path
            d={pinAreaToSvgPath(shownArea)}
            className="fill-correct/50 stroke-correct"
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {pins?.map((pin, index) => (
        <span
          key={index}
          className={clsx(
            "absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-md",
            pin.correct === false ? "bg-red-500" : "bg-correct",
          )}
          style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
        >
          {pin.name?.slice(0, 2).toUpperCase()}
        </span>
      ))}

      {ownPin && (
        <span
          className="bg-primary absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: `${ownPin.x * 100}%`, top: `${ownPin.y * 100}%` }}
        />
      )}
    </div>
  )
}

export default PinAreaCanvas
