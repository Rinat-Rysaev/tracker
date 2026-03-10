import type { Task } from '../../types'
import { useUIStore } from '../../store/uiStore'

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-red-400',
}

const STATUS_ICON: Record<string, string> = {
  'todo': '○', 'in-progress': '◐', 'done': '✓', 'blocked': '✕',
}

function getCardStyle(task: Task, currentWeek: number): { bg: string; bar: string } {
  const isOverdue = task.weekNumber < currentWeek
  switch (task.status) {
    case 'done':
      return { bg: 'bg-green-50', bar: 'bg-green-500' }
    case 'blocked':
      return { bg: 'bg-red-50', bar: 'bg-red-500' }
    case 'in-progress':
      return isOverdue
        ? { bg: 'bg-red-50', bar: 'bg-red-500' }
        : { bg: 'bg-amber-50', bar: 'bg-amber-400' }
    default: // todo
      return { bg: 'bg-white', bar: 'bg-gray-200' }
  }
}

interface Props { task: Task; currentWeek: number }

export function TaskCard({ task, currentWeek }: Props) {
  const openTask = useUIStore(s => s.openTask)
  const { bg, bar } = getCardStyle(task, currentWeek)

  return (
    <button
      onClick={() => openTask({ streamId: task.streamId, weekNumber: task.weekNumber }, task._id)}
      className={`w-full text-left ${bg} border border-gray-200 rounded-md mb-1 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group flex overflow-hidden`}
    >
      {/* Left status bar */}
      <div className={`w-[3px] flex-shrink-0 ${bar}`} />

      {/* Card content */}
      <div className="flex-1 p-1.5 min-w-0">
        <p className="text-[11px] text-gray-800 font-semibold leading-tight line-clamp-2 mb-1.5">{task.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-400 font-mono">{STATUS_ICON[task.status]}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        </div>
      </div>
    </button>
  )
}
