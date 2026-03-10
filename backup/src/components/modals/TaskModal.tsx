import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { PrioritySelector } from '../ui/PrioritySelector'
import { ColorPicker } from '../ui/ColorPicker'
import { useUIStore } from '../../store/uiStore'
import { useTaskStore } from '../../store/taskStore'
import { useStreamStore } from '../../store/streamStore'
import { useQuarterStore } from '../../store/quarterStore'
import { STREAM_COLORS } from '../../utils/colors'
import type { TaskPriority, TaskStatus } from '../../types'

const WEEKS = Array.from({ length: 13 }, (_, i) => i + 1)

export function TaskModal() {
  const { modal, editingTaskId, taskCtx, close } = useUIStore()
  const open = modal === 'task'
  const tasks = useTaskStore(s => s.tasks)
  const addTask = useTaskStore(s => s.addTask)
  const updateTask = useTaskStore(s => s.updateTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const getStreams = useStreamStore(s => s.getStreamsForQuarter)
  const addStream = useStreamStore(s => s.addStream)
  const activeQuarterId = useQuarterStore(s => s.activeQuarterId)

  const editing = editingTaskId ? tasks[editingTaskId] : null
  const streams = activeQuarterId ? getStreams(activeQuarterId) : []

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [week, setWeek] = useState(1)
  const [streamId, setStreamId] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')

  // Inline stream creation
  const [newStreamName, setNewStreamName] = useState('')
  const [newStreamColor, setNewStreamColor] = useState(STREAM_COLORS[0])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setDesc(editing.description ?? '')
      setPriority(editing.priority)
      setWeek(editing.weekNumber)
      setStreamId(editing.streamId)
      setStatus(editing.status)
    } else {
      setTitle('')
      setDesc('')
      setPriority('medium')
      setWeek(taskCtx?.weekNumber ?? 1)
      setStreamId(taskCtx?.streamId ?? streams[0]?.id ?? '')
      setStatus(taskCtx?.status ?? 'todo')
    }
    setNewStreamName('')
    setNewStreamColor(STREAM_COLORS[0])
  }, [open, editingTaskId])

  const isCreatingStream = streamId === '__new__'

  function handleCreateStream() {
    if (!newStreamName.trim() || !activeQuarterId) return
    const created = addStream({ name: newStreamName.trim(), color: newStreamColor, quarterId: activeQuarterId })
    setStreamId(created.id)
    setNewStreamName('')
    setNewStreamColor(STREAM_COLORS[0])
  }

  function save() {
    const resolvedStreamId = isCreatingStream ? '' : streamId
    if (!title.trim() || !resolvedStreamId || !activeQuarterId) return
    const cellCount = Object.values(tasks).filter(t => t.streamId === resolvedStreamId && t.weekNumber === week).length
    const weekCount = Object.values(tasks).filter(t => t.quarterId === activeQuarterId && t.weekNumber === week).length
    if (editing) {
      updateTask(editing.id, { title: title.trim(), description: desc.trim() || undefined, priority, weekNumber: week, streamId: resolvedStreamId })
    } else {
      addTask({ title: title.trim(), description: desc.trim() || undefined, priority, status, streamId: resolvedStreamId, quarterId: activeQuarterId, weekNumber: week, orderInCell: cellCount, orderInWeek: weekCount })
    }
    close()
  }

  function remove() {
    if (editing && confirm(`Delete task "${editing.title}"?`)) { deleteTask(editing.id); close() }
  }

  return (
    <Modal open={open} onClose={close} wide>
      <div className="p-6 flex flex-col gap-5">
        <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit task' : 'New task'}</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Title *</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="What needs to be done?"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Details (optional)"
            rows={3}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Priority</label>
          <PrioritySelector value={priority} onChange={setPriority} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Week</label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKS.map(w => (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold border-0 cursor-pointer transition-colors
                  ${week === w ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Stream</label>
          <select
            value={streamId}
            onChange={e => setStreamId(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white cursor-pointer"
          >
            {streams.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            <option value="__new__">Create new stream…</option>
          </select>

          {isCreatingStream && (
            <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3">
              <input
                autoFocus
                value={newStreamName}
                onChange={e => setNewStreamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateStream()}
                placeholder="Stream name"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <ColorPicker selected={newStreamColor} onSelect={setNewStreamColor} />
              <button
                onClick={handleCreateStream}
                disabled={!newStreamName.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-200 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer border-0 text-sm"
              >
                Create stream
              </button>
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={!title.trim() || isCreatingStream}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-200 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer border-0"
        >
          {editing ? 'Save' : 'Create'}
        </button>

        {editing && (
          <button
            onClick={remove}
            className="border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer bg-transparent"
          >
            Delete task
          </button>
        )}
      </div>
    </Modal>
  )
}
