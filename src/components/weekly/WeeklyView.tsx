import { useState, useMemo, useEffect } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors, useDroppable,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWeekTasks } from '../../hooks/useWeekTasks'
import { useCurrentWeek } from '../../hooks/useCurrentWeek'
import { useTaskMutations } from '../../hooks/useConvexTasks'
import { useQuarters } from '../../hooks/useConvexQuarters'
import { useUIStore } from '../../store/uiStore'
import { PriorityBadge } from '../ui/PriorityBadge'
import type { Task, TaskStatus, TaskId } from '../../types'
import { getWeekDateRange } from '../../utils/date'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'Todo',        color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'done',        label: 'Done',        color: '#22c55e' },
  { id: 'blocked',     label: 'Blocked',     color: '#ef4444' },
]

const STATUS_KEYS = COLUMNS.map(c => c.id)

function initColumns(tasks: Task[]): Record<TaskStatus, string[]> {
  const cols = { todo: [] as string[], 'in-progress': [] as string[], done: [] as string[], blocked: [] as string[] }
  tasks.forEach(t => cols[t.status].push(t._id))
  return cols
}

// ─── Card content (shared between KanbanCard and DragOverlay) ─────────────────
function CardContent({ task, streamColor, streamName }: { task: Task; streamColor: string; streamName: string }) {
  return (
    <>
      <div className="w-[3px] self-stretch flex-shrink-0 rounded-l-xl" style={{ background: streamColor }} />
      <div className="flex-1 p-3 min-w-0">
        <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 truncate mt-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: streamColor }}>
            {streamName}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
    </>
  )
}

// ─── Sortable card ────────────────────────────────────────────────────────────
function KanbanCard({ task, streamColor, streamName, onOpen }: {
  task: Task; streamColor: string; streamName: string; onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 }}
      className="mb-2"
    >
      <div
        {...attributes}
        {...listeners}
        onClick={onOpen}
        className="flex overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm
                   hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer select-none"
      >
        <CardContent task={task} streamColor={streamColor} streamName={streamName} />
      </div>
    </div>
  )
}

// ─── Droppable column ─────────────────────────────────────────────────────────
function KanbanColumn({ status, label, color, taskIds, taskById, streamColorById, streamNameById, onOpenTask, onAddTask }: {
  status: TaskStatus
  label: string
  color: string
  taskIds: string[]
  taskById: Record<string, Task>
  streamColorById: Record<string, string>
  streamNameById: Record<string, string>
  onOpenTask: (id: string) => void
  onAddTask: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col w-full sm:w-72 sm:flex-shrink-0">
      {/* Column header */}
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
          <span className="text-xs font-semibold text-gray-400 tabular-nums">{taskIds.length}</span>
        </div>
        <div className="h-0.5 rounded-full" style={{ background: color }} />
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 transition-colors min-h-[60px] sm:min-h-[120px] ${isOver ? 'bg-indigo-50/70' : 'bg-transparent'}`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map(id => {
            const task = taskById[id]
            if (!task) return null
            return (
              <KanbanCard
                key={id}
                task={task}
                streamColor={streamColorById[id] ?? '#94a3b8'}
                streamName={streamNameById[id] ?? ''}
                onOpen={() => onOpenTask(id)}
              />
            )
          })}
        </SortableContext>
        {taskIds.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-gray-200">
            <span className="text-xs text-gray-300 font-medium">No tasks · click + to add</span>
          </div>
        )}
      </div>

      {/* Add task button */}
      <button
        onClick={onAddTask}
        className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-indigo-600
                   hover:bg-indigo-50 transition-colors cursor-pointer border-0 bg-transparent"
      >
        + Add task
      </button>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────
interface Props {
  week: number
  onReturnToCurrent: () => void
}

export function WeeklyView({ week, onReturnToCurrent }: Props) {
  const groups = useWeekTasks(week)
  const currentWeek = useCurrentWeek()
  const { activeQuarter: quarter } = useQuarters()
  const { updateStatus, reorderInWeek } = useTaskMutations()
  const openTask = useUIStore(s => s.openTask)

  const allTasks = useMemo(() => groups.flatMap(g => g.tasks), [groups])

  const taskById = useMemo(
    () => Object.fromEntries(allTasks.map(t => [t._id, t])) as Record<string, Task>,
    [allTasks]
  )
  const streamColorById = useMemo(() => {
    const map: Record<string, string> = {}
    groups.forEach(g => g.tasks.forEach(t => { map[t._id] = g.stream.color }))
    return map
  }, [groups])
  const streamNameById = useMemo(() => {
    const map: Record<string, string> = {}
    groups.forEach(g => g.tasks.forEach(t => { map[t._id] = g.stream.name }))
    return map
  }, [groups])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [columns, setColumns] = useState<Record<TaskStatus, string[]>>(() => initColumns(allTasks))

  // Sync columns from store when not dragging
  useEffect(() => {
    if (activeId === null) setColumns(initColumns(allTasks))
  }, [allTasks, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function getTaskColumn(id: string): TaskStatus | null {
    for (const s of STATUS_KEYS) {
      if (columns[s].includes(id)) return s
    }
    return null
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const dragId = active.id as string
    const overId = over.id as string

    const fromCol = getTaskColumn(dragId)
    const toCol = STATUS_KEYS.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : getTaskColumn(overId)

    if (!fromCol || !toCol) return

    if (fromCol === toCol) {
      const items = columns[fromCol]
      const oldIdx = items.indexOf(dragId)
      const newIdx = items.indexOf(overId)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setColumns(prev => ({ ...prev, [fromCol]: arrayMove(prev[fromCol], oldIdx, newIdx) }))
      }
    } else {
      setColumns(prev => {
        const fromItems = prev[fromCol].filter(id => id !== dragId)
        const toItems = [...prev[toCol]]
        const overIdx = toItems.indexOf(overId)
        if (overIdx >= 0) {
          toItems.splice(overIdx, 0, dragId)
        } else {
          toItems.push(dragId)
        }
        return { ...prev, [fromCol]: fromItems, [toCol]: toItems }
      })
    }
  }

  function onDragEnd({ active }: DragEndEvent) {
    const id = active.id as string
    const originalTask = taskById[id]

    setActiveId(null)

    if (!originalTask || !quarter) return

    const newStatus = getTaskColumn(id)
    if (!newStatus) return

    if (newStatus !== originalTask.status) {
      updateStatus({ taskId: id as TaskId, status: newStatus })
    }
    const allOrderedIds = STATUS_KEYS.flatMap(s => columns[s]) as TaskId[]
    reorderInWeek({ quarterId: quarter._id, weekNumber: week, orderedIds: allOrderedIds })
  }

  function onDragCancel() {
    setActiveId(null)
    setColumns(initColumns(allTasks))
  }

  const activeTask = activeId ? taskById[activeId] : null
  const dateRange = quarter ? getWeekDateRange(quarter.startDate, week) : ''
  const doneCount = allTasks.filter(t => t.status === 'done').length
  const total = allTasks.length
  const isViewingOtherWeek = week !== currentWeek

  if (!quarter) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <p>No active quarter</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              {quarter.label} · Week {week}
              {isViewingOtherWeek && week < currentWeek && (
                <span className="ml-2 text-red-400 font-semibold">· past</span>
              )}
              {isViewingOtherWeek && week > currentWeek && (
                <span className="ml-2 text-indigo-400 font-semibold">· future</span>
              )}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5 truncate">{dateRange}</p>
          </div>
          {isViewingOtherWeek && (
            <button
              onClick={onReturnToCurrent}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors border-0 cursor-pointer flex-shrink-0"
            >
              <span className="hidden sm:inline">Current week (W{currentWeek})</span>
              <span className="sm:hidden">W{currentWeek} ↩</span>
            </button>
          )}
        </div>
        {total > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{doneCount} of {total} done</span>
              <span className="font-semibold text-indigo-500">{Math.round(doneCount / total * 100)}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${doneCount / total * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Board — always rendered */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex-1 overflow-auto flex">
          <div className="flex gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 mx-auto">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                status={col.id}
                label={col.label}
                color={col.color}
                taskIds={columns[col.id]}
                taskById={taskById}
                streamColorById={streamColorById}
                streamNameById={streamNameById}
                onOpenTask={id => {
                  const t = taskById[id]
                  if (t) openTask({ streamId: t.streamId, weekNumber: t.weekNumber }, t._id)
                }}
                onAddTask={() => openTask({ weekNumber: week, status: col.id })}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeTask && (
            <div className="w-[80vw] sm:w-72 shadow-2xl rotate-1 opacity-95">
              <div className="flex overflow-hidden bg-white rounded-xl border border-indigo-200 shadow-lg">
                <CardContent
                  task={activeTask}
                  streamColor={streamColorById[activeTask._id] ?? '#94a3b8'}
                  streamName={streamNameById[activeTask._id] ?? ''}
                />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
