import type { TaskPriority } from '../../types'

const CFG: Record<TaskPriority, { label: string; cls: string }> = {
  high:   { label: 'High',   cls: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    cls: 'bg-green-100 text-green-700' },
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, cls } = CFG[priority]
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  )
}
