import { create } from 'zustand'

type Modal = 'task' | 'stream' | 'quarter' | null

interface TaskCtx { streamId?: string; weekNumber: number; status?: import('../types').TaskStatus }

interface UIState {
  modal: Modal
  editingTaskId: string | null
  editingStreamId: string | null
  taskCtx: TaskCtx | null
  selectedWeek: number | null
  openTask: (ctx: TaskCtx, taskId?: string) => void
  openStream: (streamId?: string) => void
  openQuarter: () => void
  close: () => void
  setSelectedWeek: (week: number | null) => void
}

export const useUIStore = create<UIState>()(set => ({
  modal: null,
  editingTaskId: null,
  editingStreamId: null,
  taskCtx: null,
  selectedWeek: null,
  openTask: (ctx, taskId) => set({ modal: 'task', taskCtx: ctx, editingTaskId: taskId ?? null }),
  openStream: (streamId) => set({ modal: 'stream', editingStreamId: streamId ?? null }),
  openQuarter: () => set({ modal: 'quarter' }),
  close: () => set({ modal: null, editingTaskId: null, editingStreamId: null, taskCtx: null }),
  setSelectedWeek: (week) => set({ selectedWeek: week }),
}))
