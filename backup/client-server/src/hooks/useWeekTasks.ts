import { useMemo } from 'react'
import { useQuarters } from './useConvexQuarters'
import { useStreams } from './useConvexStreams'
import { useTasksForWeek } from './useConvexTasks'
import type { WorkStream, Task } from '../types'

export interface WeekGroup { stream: WorkStream; tasks: Task[] }

export function useWeekTasks(weekNumber: number): WeekGroup[] {
  const { activeQuarter } = useQuarters()
  const { streams } = useStreams(activeQuarter?._id ?? null)
  const allTasks = useTasksForWeek(activeQuarter?._id ?? null, weekNumber)

  return useMemo(() => {
    if (!activeQuarter) return []
    return streams
      .map(stream => ({
        stream,
        tasks: allTasks
          .filter(t => t.streamId === stream._id)
          .sort((a, b) => a.orderInWeek - b.orderInWeek),
      }))
      .filter(g => g.tasks.length > 0)
  }, [activeQuarter, streams, allTasks])
}
