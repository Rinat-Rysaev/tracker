import type { TaskStatus } from '../../types'

const CYCLE: TaskStatus[] = ['todo', 'in-progress', 'done', 'blocked']

const CFG: Record<TaskStatus, { label: string; cls: string }> = {
  'todo':        { label: 'Todo',        cls: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  'done':        { label: 'Done',        cls: 'bg-green-100 text-green-700 hover:bg-green-200' },
  'blocked':     { label: 'Blocked',     cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
}

interface Props { status: TaskStatus; onChange: (next: TaskStatus) => void }

export function StatusPill({ status, onChange }: Props) {
  const { label, cls } = CFG[status]
  const cycle = () => {
    const i = CYCLE.indexOf(status)
    onChange(CYCLE[(i + 1) % CYCLE.length])
  }
  return (
    <button onClick={cycle} className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors border-0 ${cls}`}>
      {label}
    </button>
  )
}
