import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Quarter } from '../types'
import { generateId } from '../utils/id'
import { createCurrentQuarter } from '../utils/date'

interface QuarterState {
  quarters: Record<string, Quarter>
  activeQuarterId: string | null
  addQuarter: (q: Omit<Quarter, 'id'>) => Quarter
  updateQuarter: (id: string, patch: Partial<Omit<Quarter, 'id'>>) => void
  deleteQuarter: (id: string) => void
  setActiveQuarter: (id: string) => void
  getActiveQuarter: () => Quarter | null
  seed: () => string | null
}

export const useQuarterStore = create<QuarterState>()(
  persist(
    (set, get) => ({
      quarters: {},
      activeQuarterId: null,

      addQuarter(q) {
        const id = generateId()
        const quarter = { id, ...q }
        set(s => ({ quarters: { ...s.quarters, [id]: quarter } }))
        return quarter
      },

      updateQuarter(id, patch) {
        set(s => ({ quarters: { ...s.quarters, [id]: { ...s.quarters[id], ...patch } } }))
      },

      deleteQuarter(id) {
        set(s => {
          const quarters = { ...s.quarters }
          delete quarters[id]
          const activeQuarterId = s.activeQuarterId === id
            ? (Object.keys(quarters)[0] ?? null)
            : s.activeQuarterId
          return { quarters, activeQuarterId }
        })
      },

      setActiveQuarter(id) { set({ activeQuarterId: id }) },

      getActiveQuarter() {
        const { quarters, activeQuarterId } = get()
        return activeQuarterId ? (quarters[activeQuarterId] ?? null) : null
      },

      seed() {
        const { quarters, activeQuarterId } = get()
        if (Object.keys(quarters).length > 0 && activeQuarterId) return null
        const q = get().addQuarter(createCurrentQuarter())
        set({ activeQuarterId: q.id })
        return q.id
      },
    }),
    { name: 'tracker-quarters' }
  )
)
