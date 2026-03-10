import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useUIStore } from '../../store/uiStore'
import { useQuarters } from '../../hooks/useConvexQuarters'
import { getQuarterStartDate, getQuarterLabel } from '../../utils/date'
import type { QuarterId } from '../../types'

const NOW = new Date().getFullYear()
const YEARS = [NOW - 1, NOW, NOW + 1]
const QS = [1, 2, 3, 4] as const

export function QuarterModal() {
  const { modal, close } = useUIStore()
  const open = modal === 'quarter'
  const { quarters, activeQuarterId, addQuarter, setActiveQuarter } = useQuarters()

  const [creating, setCreating] = useState(false)
  const [year, setYear] = useState(NOW)
  const [q, setQ] = useState<1 | 2 | 3 | 4>(1)

  async function create() {
    const startDate = getQuarterStartDate(year, q)
    await addQuarter({ label: getQuarterLabel(year, q), year, quarter: q, startDate })
    // Server automatically sets new quarter as active and seeds default streams
    setCreating(false)
    close()
  }

  async function select(id: QuarterId) {
    await setActiveQuarter({ quarterId: id })
    close()
  }

  return (
    <Modal open={open} onClose={() => { setCreating(false); close() }}>
      <div className="p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-900">Quarters</h2>

        {!creating ? (
          <>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {quarters.map(quarter => (
                <button
                  key={quarter._id}
                  onClick={() => select(quarter._id)}
                  className={`flex justify-between items-center px-4 py-3 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-colors
                    ${quarter._id === activeQuarterId ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  <span>{quarter.label}</span>
                  {quarter._id === activeQuarterId && <span className="text-xs text-indigo-400 font-normal">active</span>}
                </button>
              ))}
              {quarters.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No quarters yet</p>}
            </div>
            <button
              onClick={() => setCreating(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer border-0"
            >
              + New quarter
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Year</label>
              <div className="flex gap-2">
                {YEARS.map(y => (
                  <button key={y} onClick={() => setYear(y)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer
                      ${year === y ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >{y}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Quarter</label>
              <div className="flex gap-2">
                {QS.map(n => (
                  <button key={n} onClick={() => setQ(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer
                      ${q === n ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >Q{n}</button>
                ))}
              </div>
            </div>
            <button onClick={create}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer border-0"
            >
              Create {getQuarterLabel(year, q)}
            </button>
            <button onClick={() => setCreating(false)} className="text-sm text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer">
              ← Back
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
