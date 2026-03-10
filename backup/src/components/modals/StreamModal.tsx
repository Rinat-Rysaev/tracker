import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { ColorPicker } from '../ui/ColorPicker'
import { useUIStore } from '../../store/uiStore'
import { useStreamStore } from '../../store/streamStore'
import { useTaskStore } from '../../store/taskStore'
import { useQuarterStore } from '../../store/quarterStore'
import { DEFAULT_COLOR } from '../../utils/colors'

export function StreamModal() {
  const { modal, editingStreamId, close } = useUIStore()
  const open = modal === 'stream'
  const streams = useStreamStore(s => s.streams)
  const addStream = useStreamStore(s => s.addStream)
  const updateStream = useStreamStore(s => s.updateStream)
  const deleteStream = useStreamStore(s => s.deleteStream)
  const deleteByStream = useTaskStore(s => s.deleteByStream)
  const activeQuarterId = useQuarterStore(s => s.activeQuarterId)

  const editing = editingStreamId ? streams[editingStreamId] : null
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)

  useEffect(() => {
    if (open) { setName(editing?.name ?? ''); setColor(editing?.color ?? DEFAULT_COLOR) }
  }, [open, editingStreamId])

  function save() {
    if (!name.trim()) return
    if (editing) updateStream(editing.id, { name: name.trim(), color })
    else if (activeQuarterId) addStream({ name: name.trim(), color, quarterId: activeQuarterId })
    close()
  }

  function remove() {
    if (!editing || !confirm(`Delete stream "${editing.name}"? All tasks will be removed.`)) return
    deleteByStream(editing.id)
    deleteStream(editing.id)
    close()
  }

  return (
    <Modal open={open} onClose={close}>
      <div className="p-6 flex flex-col gap-5">
        <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit stream' : 'New stream'}</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="e.g. Backend"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Color</label>
          <ColorPicker selected={color} onSelect={setColor} />
        </div>

        <button
          onClick={save}
          disabled={!name.trim()}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-200 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer border-0"
        >
          {editing ? 'Save' : 'Create'}
        </button>

        {editing && (
          <button
            onClick={remove}
            className="border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer bg-transparent"
          >
            Delete stream
          </button>
        )}
      </div>
    </Modal>
  )
}
