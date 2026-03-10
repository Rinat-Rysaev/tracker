import { useTasksForCell } from '../../hooks/useConvexTasks'
import { useUIStore } from '../../store/uiStore'
import { TaskCard } from './TaskCard'
import type { StreamId } from '../../types'

interface Props {
  streamId: StreamId
  weekNumber: number
  isCurrent: boolean
  streamColor: string
  currentWeek: number
}

export function RoadmapCell({ streamId, weekNumber, isCurrent, streamColor, currentWeek }: Props) {
  const tasks = useTasksForCell(streamId, weekNumber)
  const openTask = useUIStore(s => s.openTask)

  return (
    <div
      className={`min-h-[90px] border-r border-gray-200 p-1.5 flex flex-col ${isCurrent ? 'bg-indigo-50/60' : ''}`}
    >
      {tasks.map(t => <TaskCard key={t._id} task={t} currentWeek={currentWeek} />)}
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
