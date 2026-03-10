import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useQuarters() {
  const quarters = useQuery(api.quarters.list)
  const activeQuarter = useQuery(api.quarters.getActive)
  const addQuarter = useMutation(api.quarters.add)
  const setActiveQuarter = useMutation(api.quarters.setActive)
  const removeQuarter = useMutation(api.quarters.remove)
  const seedQuarter = useMutation(api.quarters.seed)

  return {
    quarters: quarters ?? [],
    activeQuarter: activeQuarter ?? null,
    activeQuarterId: activeQuarter?._id ?? null,
    isLoading: quarters === undefined || activeQuarter === undefined,
    addQuarter,
    setActiveQuarter,
    removeQuarter,
    seed: seedQuarter,
  }
}
