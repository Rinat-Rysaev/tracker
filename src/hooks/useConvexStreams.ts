import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { QuarterId } from '../types'

export function useStreams(quarterId: QuarterId | null) {
  const streams = useQuery(
    api.streams.listByQuarter,
    quarterId ? { quarterId } : "skip"
  )
  const addStream = useMutation(api.streams.add)
  const updateStream = useMutation(api.streams.update)
  const removeStream = useMutation(api.streams.remove)
  const reorderStreams = useMutation(api.streams.reorder)
  const seedStreams = useMutation(api.streams.seed)

  return {
    streams: streams ?? [],
    isLoading: streams === undefined,
    addStream,
    updateStream,
    removeStream,
    reorderStreams,
    seed: seedStreams,
  }
}
