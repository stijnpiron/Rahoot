import { EVENTS, NO_TIME_LIMIT } from "@razzia/common/constants"
import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"
import Button from "@razzia/web/components/Button"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { usePlayerStore } from "@razzia/web/features/game/stores/player"
import {
  getDoDoneButton,
  getDoFlow,
  getDoTimerExpiry,
} from "@razzia/web/features/questions/do/utils"
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
import { CheckCircle2, GripVertical } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

interface DoParticipant {
  playerId: string
  username: string
  done: boolean
}

const mergeDone = (
  current: DoParticipant[],
  done: Array<{ playerId: string; username: string }>,
): DoParticipant[] => {
  const doneIds = new Set(done.map((d) => d.playerId))
  const missing = done.filter(
    (d) => !current.some((p) => p.playerId === d.playerId),
  )

  if (missing.length === 0) {
    return current.map((p) => ({ ...p, done: doneIds.has(p.playerId) }))
  }

  const lastDoneIndex = current.reduce(
    (last, p, index) => (p.done ? index : last),
    -1,
  )
  const rows = [...current]

  rows.splice(lastDoneIndex + 1, 0, ...missing.map((d) => ({ ...d, done: true })))

  return rows.map((p) => ({ ...p, done: doneIds.has(p.playerId) }))
}

const DoTimer = ({ time, expiry }: { time: number; expiry: string }) => {
  const { t } = useTranslation()
  const [seconds, setSeconds] = useState(time)

  useEffect(() => {
    setSeconds(time)
  }, [time])

  useEffect(() => {
    if (time === NO_TIME_LIMIT) {
      return
    }

    const interval = setInterval(() => {
      setSeconds((current) =>
        expiry === "elapsed" || current > 0 ? current - 1 : 0,
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [time, expiry])

  return (
    <div className="flex flex-col items-center self-start rounded-lg bg-black/40 px-4 text-lg font-bold text-white">
      <span className="translate-y-1 text-sm">
        {seconds < 0 ? t("game:do.elapsed") : t("game:hud.time")}
      </span>
      <span>{Math.abs(seconds)}</span>
    </div>
  )
}

const DoRow = ({ participant }: { participant: DoParticipant }) => {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: participant.playerId })

  return (
    <div
      ref={setNodeRef}
      data-do-row
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={clsx(
        "shadow-inset flex touch-none items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 font-bold text-white select-none",
        isDragging && "z-10 opacity-80",
      )}
    >
      <GripVertical className="size-5 shrink-0 text-white/80" />
      <span className="flex-1 truncate text-lg">{participant.username}</span>
      {participant.done ? (
        <CheckCircle2 className="size-5 shrink-0 text-green-400" />
      ) : (
        <span className="text-xs font-normal text-white/60">
          {t("game:do.notDone")}
        </span>
      )}
    </div>
  )
}

const DoAnswers = ({
  instruction,
  options,
  time,
  doParticipants = [],
  onSubmit,
  readOnly,
}: AnswerComponentProps) => {
  const { t } = useTranslation()
  const { socket } = useSocket()
  const { gameId: managerGameId } = useManagerStore()
  const { player } = usePlayerStore()
  const isManager = Boolean(readOnly) || !player
  const flow = getDoFlow(options)
  const doneButton = getDoDoneButton(options)
  const expiry = getDoTimerExpiry(options)

  const [order, setOrder] = useState<DoParticipant[]>([])
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!isManager || seeded || doParticipants.length === 0) {
      return
    }

    setOrder(doParticipants.map((p) => ({ ...p, done: false })))
    setSeeded(true)
  }, [isManager, seeded, doParticipants])

  useEvent(EVENTS.GAME.STATUS, ({ name, data }) => {
    if (!isManager || name !== "DO_DONE") {
      return
    }

    const { done } = data as ManagerStatusDataMap["DO_DONE"]

    setOrder((current) => mergeDone(current, done))
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setOrder((current) => {
      const from = current.findIndex((p) => p.playerId === active.id)
      const to = current.findIndex((p) => p.playerId === over.id)

      if (from < 0 || to < 0) {
        return current
      }

      return arrayMove(current, from, to)
    })
  }

  const handleSubmitOrder = () => {
    if (!managerGameId) {
      return
    }

    socket.emit(EVENTS.MANAGER.SUBMIT_DO_ORDER, {
      gameId: managerGameId,
      data: {
        order: order.map((p) => p.playerId),
      },
    })
  }

  if (isManager) {
    return (
      <div className="mx-auto mb-4 flex w-full max-w-md flex-col gap-3 px-2">
        {flow === "timer" && <DoTimer time={time ?? 0} expiry={expiry} />}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={order.map((p) => p.playerId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex max-h-[55dvh] min-h-0 flex-col gap-2 overflow-y-auto">
              {order.map((participant) => (
                <DoRow key={participant.playerId} participant={participant} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          onClick={handleSubmitOrder}
          className="mx-auto w-full max-w-xs shrink-0 shadow-md"
        >
          {t("game:do.submit")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-md flex-col items-center gap-4 px-2">
      {flow === "timer" && <DoTimer time={time ?? 0} expiry={expiry} />}
      {instruction && (
        <p className="text-center text-lg font-semibold text-white/90">
          {instruction}
        </p>
      )}
      {doneButton && (
        <Button
          onClick={() => onSubmit([])}
          className="w-full max-w-xs shadow-md"
        >
          {t("game:do.done")}
        </Button>
      )}
    </div>
  )
}

export default DoAnswers
