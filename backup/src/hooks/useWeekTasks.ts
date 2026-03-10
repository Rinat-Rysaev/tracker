import { useMemo } from 'react'
import { useQuarterStore } from '../store/quarterStore'
import { useStreamStore } from '../store/streamStore'
import { useTaskStore } from '../store/taskStore'
import type { WorkStream, Task } from '../types'

export interface WeekGroup { stream: WorkStream; tasks: Task[] }

export function useWeekTasks(weekNumber: number): WeekGroup[] {
  const quarter = useQuarterStore(s => s.getActiveQuarter())
  const rawStreams = useStreamStore(s => s.streams)
  const rawTasks = useTaskStore(s => s.tasks)

  return useMemo(() => {
    if (!quarter) return []
    const streams = Object.values(rawStreams)
      .filter(s => s.quarterId === quarter.id)
      .sort((a, b) => a.order - b.order)
    const weekTasks = Object.values(rawTasks)
      .filter(t => t.quarterId === quarter.id && t.weekNumber === weekNumber)
      .sort((a, b) => a.orderInWeek - b.orderInWeek)
    return streams
      .map(stream => ({ stream, tasks: weekTasks.filter(t => t.streamId === stream.id) }))
      .filter(g => g.tasks.length > 0)
  }, [quarter, rawStreams, rawTasks, weekNumber])
}
