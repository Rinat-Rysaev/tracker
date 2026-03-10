import { useQuarters } from './useConvexQuarters'
import { getCurrentWeekNumber } from '../utils/date'

export function useCurrentWeek(): number {
  const { activeQuarter } = useQuarters()
  return activeQuarter ? getCurrentWeekNumber(activeQuarter.startDate) : 1
}
