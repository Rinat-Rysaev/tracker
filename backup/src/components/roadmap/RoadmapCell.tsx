import { useMemo } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { useUIStore } from '../../store/uiStore'
import { TaskCard } from './TaskCard'

interface Props {
  streamId: string
  weekNumber: number
  isCurrent: boolean
  streamColor: string
  currentWeek: number
}

export function RoadmapCell({ streamId, weekNumber, isCurrent, streamColor, currentWeek }: Props) {
  const rawTasks = useTaskStore(s => s.tasks)
  const openTask = useUIStore(s => s.openTask)

  const tasks = useMemo(
    () => Object.values(rawTasks)
      .filter(t => t.streamId === streamId && t.weekNumber === weekNumber)
      .sort((a, b) => a.orderInCell - b.orderInCell),
    [rawTasks, streamId, weekNumber]
  )

  return (
    <div
      className={`min-h-[90px] border-r border-gray-200 p-1.5 flex flex-col ${isCurrent ? 'bg-indigo-50/60' : ''}`}
    >
      {tasks.map(t => <TaskCard key={t.id} task={t} currentWeek={currentWeek} />)}
      <button
        onClick={() => openTask({ streamId, weekNumber })}
        className="mt-auto w-full py-0.5 rounded border border-dashed text-gray-300 hover:text-gray-400 hover:border-gray-300 text-sm transition-colors cursor-pointer bg-transparent"
        style={{ borderColor: isCurrent ? streamColor + '60' : undefined }}
        title={`Add task to week ${weekNumber}`}
      >
        +
      </button>
    </div>
  )
}
