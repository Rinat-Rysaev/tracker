import type { TaskPriority } from '../../types'

const OPTS: { value: TaskPriority; label: string; active: string }[] = [
  { value: 'low',    label: 'Low',    active: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'medium', label: 'Medium', active: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'high',   label: 'High',   active: 'bg-red-100 text-red-800 border-red-300' },
]

interface Props { value: TaskPriority; onChange: (v: TaskPriority) => void }

export function PrioritySelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {OPTS.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors
            ${value === o.value ? o.active : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
