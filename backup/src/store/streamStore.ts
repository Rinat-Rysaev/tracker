import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkStream } from '../types'
import { generateId } from '../utils/id'

const DEFAULT_STREAMS = [
  { name: 'Backend', color: '#6366F1' },
  { name: 'Frontend', color: '#EC4899' },
  { name: 'Design', color: '#10B981' },
]

interface StreamState {
  streams: Record<string, WorkStream>
  addStream: (s: Omit<WorkStream, 'id' | 'order'>) => WorkStream
  updateStream: (id: string, patch: Partial<Omit<WorkStream, 'id'>>) => void
  deleteStream: (id: string) => void
  reorderStreams: (quarterId: string, orderedIds: string[]) => void
  getStreamsForQuarter: (quarterId: string) => WorkStream[]
  seed: (quarterId: string) => void
}

export const useStreamStore = create<StreamState>()(
  persist(
    (set, get) => ({
      streams: {},

      addStream(s) {
        const id = generateId()
        const order = get().getStreamsForQuarter(s.quarterId).length
        const stream = { id, order, ...s }
        set(st => ({ streams: { ...st.streams, [id]: stream } }))
        return stream
      },

      updateStream(id, patch) {
        set(s => ({ streams: { ...s.streams, [id]: { ...s.streams[id], ...patch } } }))
      },

      deleteStream(id) {
        set(s => {
          const streams = { ...s.streams }
          delete streams[id]
          return { streams }
        })
      },

      reorderStreams(quarterId, orderedIds) {
        set(s => {
          const streams = { ...s.streams }
          orderedIds.forEach((id, idx) => {
            if (streams[id]?.quarterId === quarterId) streams[id] = { ...streams[id], order: idx }
          })
          return { streams }
        })
      },

      getStreamsForQuarter(quarterId) {
        return Object.values(get().streams)
          .filter(s => s.quarterId === quarterId)
          .sort((a, b) => a.order - b.order)
      },

      seed(quarterId) {
        if (get().getStreamsForQuarter(quarterId).length > 0) return
        DEFAULT_STREAMS.forEach(({ name, color }) => get().addStream({ name, color, quarterId }))
      },
    }),
    { name: 'tracker-streams' }
  )
)
