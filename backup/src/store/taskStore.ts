import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskStatus } from '../types'
import { generateId } from '../utils/id'

type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

interface TaskState {
  tasks: Record<string, Task>
  addTask: (t: NewTask) => Task
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  updateStatus: (id: string, status: TaskStatus) => void
  moveTask: (id: string, toWeek: number, toStreamId: string) => void
  reorderInWeek: (quarterId: string, weekNumber: number, orderedIds: string[]) => void
  getTasksForCell: (streamId: string, weekNumber: number) => Task[]
  getTasksForWeek: (quarterId: string, weekNumber: number) => Task[]
  deleteByStream: (streamId: string) => void
  deleteByQuarter: (quarterId: string) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},

      addTask(t) {
        const id = generateId()
        const now = Date.now()
        const task = { id, ...t, createdAt: now, updatedAt: now }
        set(s => ({ tasks: { ...s.tasks, [id]: task } }))
        return task
      },

      updateTask(id, patch) {
        set(s => ({ tasks: { ...s.tasks, [id]: { ...s.tasks[id], ...patch, updatedAt: Date.now() } } }))
      },

      deleteTask(id) {
        set(s => { const tasks = { ...s.tasks }; delete tasks[id]; return { tasks } })
      },

      updateStatus(id, status) { get().updateTask(id, { status }) },

      moveTask(id, toWeek, toStreamId) {
        get().updateTask(id, { weekNumber: toWeek, streamId: toStreamId })
      },

      reorderInWeek(quarterId, weekNumber, orderedIds) {
        set(s => {
          const tasks = { ...s.tasks }
          orderedIds.forEach((id, idx) => {
            if (tasks[id]?.quarterId === quarterId && tasks[id]?.weekNumber === weekNumber)
              tasks[id] = { ...tasks[id], orderInWeek: idx }
          })
          return { tasks }
        })
      },

      getTasksForCell(streamId, weekNumber) {
        return Object.values(get().tasks)
          .filter(t => t.streamId === streamId && t.weekNumber === weekNumber)
          .sort((a, b) => a.orderInCell - b.orderInCell)
      },

      getTasksForWeek(quarterId, weekNumber) {
        return Object.values(get().tasks)
          .filter(t => t.quarterId === quarterId && t.weekNumber === weekNumber)
          .sort((a, b) => a.orderInWeek - b.orderInWeek)
      },

      deleteByStream(streamId) {
        set(s => {
          const tasks: Record<string, Task> = {}
          Object.values(s.tasks).forEach(t => { if (t.streamId !== streamId) tasks[t.id] = t })
          return { tasks }
        })
      },

      deleteByQuarter(quarterId) {
        set(s => {
          const tasks: Record<string, Task> = {}
          Object.values(s.tasks).forEach(t => { if (t.quarterId !== quarterId) tasks[t.id] = t })
          return { tasks }
        })
      },
    }),
    { name: 'tracker-tasks' }
  )
)
