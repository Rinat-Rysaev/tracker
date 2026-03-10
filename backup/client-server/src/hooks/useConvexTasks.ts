import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { StreamId, QuarterId, TaskId } from '../types'

export function useTasksForCell(streamId: StreamId | null, weekNumber: number) {
  const tasks = useQuery(
    api.tasks.listByStreamWeek,
    streamId ? { streamId, weekNumber } : "skip"
  )
  return tasks ?? []
}

export function useTasksForWeek(quarterId: QuarterId | null, weekNumber: number) {
  const tasks = useQuery(
    api.tasks.listByQuarterWeek,
    quarterId ? { quarterId, weekNumber } : "skip"
  )
  return tasks ?? []
}

export function useTaskById(taskId: TaskId | null) {
  return useQuery(
    api.tasks.getById,
    taskId ? { taskId } : "skip"
  )
}

export function useTaskMutations() {
  return {
    addTask: useMutation(api.tasks.add),
    updateTask: useMutation(api.tasks.update),
    deleteTask: useMutation(api.tasks.remove),
    updateStatus: useMutation(api.tasks.updateStatus),
    reorderInWeek: useMutation(api.tasks.reorderInWeek),
  }
}
