import { useMemo, useState } from 'react'
import { useStreams } from '../../hooks/useConvexStreams'
import { useUIStore } from '../../store/uiStore'
import { useCurrentWeek } from '../../hooks/useCurrentWeek'
import { useQuarters } from '../../hooks/useConvexQuarters'
import { getWeekDateRange, getQuarterMonthGroups } from '../../utils/date'
import { RoadmapCell } from './RoadmapCell'
import type { QuarterId } from '../../types'

const ALL_WEEKS = Array.from({ length: 13 }, (_, i) => i + 1)
const LABEL_W = 140

interface Props {
  quarterId: QuarterId
  onWeekClick: (week: number) => void
}

export function RoadmapGrid({ quarterId, onWeekClick }: Props) {
  const { streams } = useStreams(quarterId)
  const openStream = useUIStore(s => s.openStream)
  const currentWeek = useCurrentWeek()
  const { activeQuarter: quarter } = useQuarters()

  const [view, setView] = useState<'quarter' | 0 | 1 | 2>('quarter')

  const monthGroups = useMemo(
    () => quarter ? getQuarterMonthGroups(quarter) : [],
    [quarter]
  )

  const visibleWeeks = view === 'quarter'
    ? ALL_WEEKS
    : (monthGroups[view as number]?.weeks ?? ALL_WEEKS)

  const colWidth = view === 'quarter' ? 110 : 160

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      {/* Sub-nav: Quarter | Month1 | Month2 | Month3 */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1">
        <nav className="flex items-center gap-0.5 bg-gray-100 p-1 rounded-xl">
          {(['quarter', 0, 1, 2] as const).map(v => {
            const label = v === 'quarter' ? 'Quarter' : monthGroups[v]?.label ?? ''
            const active = view === v
            return (
              <button
                key={String(v)}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0
                  ${active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 bg-transparent'}`}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: LABEL_W, minWidth: LABEL_W }} />
            {visibleWeeks.map(w => <col key={w} style={{ width: colWidth, minWidth: colWidth }} />)}
          </colgroup>

          {/* Header */}
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b-2 border-r-2 border-gray-200 px-3 py-2 text-left">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Streams</span>
              </th>
              {visibleWeeks.map(w => {
                const isPast = w < currentWeek
                const isCurrent = w === currentWeek
                const dateRange = quarter ? getWeekDateRange(quarter.startDate, w) : ''
                return (
                  <th
                    key={w}
                    title={dateRange}
                    onClick={() => onWeekClick(w)}
                    className={`border-b-2 border-r border-gray-200 py-2 text-center cursor-pointer transition-colors
                      ${isCurrent ? 'bg-indigo-50 border-t-2 border-t-indigo-400' : isPast ? 'bg-gray-50/50 hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'}`}
                  >
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-indigo-600' : isPast ? 'text-gray-300' : 'text-gray-400'}`}>
                      W{w}
                    </span>
                    {isCurrent && <div className="mx-auto mt-0.5 w-1 h-1 rounded-full bg-indigo-500" />}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {streams.map(stream => (
              <tr key={stream._id} className="border-b border-gray-200">
                {/* Stream label — sticky */}
                <td
                  className="sticky left-0 z-10 bg-gray-50 border-r-2 border-gray-200 px-3"
                  style={{ minWidth: LABEL_W, width: LABEL_W }}
                >
                  <button
                    onClick={() => openStream(stream._id)}
                    className="flex items-center gap-2 w-full text-left py-2 hover:opacity-70 transition-opacity cursor-pointer bg-transparent border-0"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stream.color }} />
                    <span className="text-xs font-semibold text-gray-700 truncate">{stream.name}</span>
                  </button>
                </td>

                {visibleWeeks.map(w => (
                  <td key={w} className="p-0 align-top">
                    <RoadmapCell
                      streamId={stream._id}
                      weekNumber={w}
                      isCurrent={w === currentWeek}
                      streamColor={stream.color}
                      currentWeek={currentWeek}
                    />
                  </td>
                ))}
              </tr>
            ))}

            {/* Add stream row */}
            <tr>
              <td className="sticky left-0 z-10 bg-gray-50 border-r-2 border-gray-200 px-3 py-2">
                <button
                  onClick={() => openStream()}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors cursor-pointer bg-transparent border-0"
                >
                  <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-sm">+</span>
                  Add stream
                </button>
              </td>
              {visibleWeeks.map(w => <td key={w} className={`border-r border-gray-100 ${w === currentWeek ? 'bg-indigo-50/30' : ''}`} />)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
