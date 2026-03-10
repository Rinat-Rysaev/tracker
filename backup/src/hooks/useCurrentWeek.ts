import { useQuarterStore } from '../store/quarterStore'
import { getCurrentWeekNumber } from '../utils/date'

export function useCurrentWeek(): number {
  const q = useQuarterStore(s => s.getActiveQuarter())
  return q ? getCurrentWeekNumber(q.startDate) : 1
}
