import { useEffect, useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuarters } from './hooks/useConvexQuarters'
import { useUIStore } from './store/uiStore'
import { useCurrentWeek } from './hooks/useCurrentWeek'
import { RoadmapGrid } from './components/roadmap/RoadmapGrid'
import { WeeklyView } from './components/weekly/WeeklyView'
import { TaskModal } from './components/modals/TaskModal'
import { StreamModal } from './components/modals/StreamModal'
import { QuarterModal } from './components/modals/QuarterModal'
import { AuthScreen } from './components/auth/AuthScreen'
import { Loading } from './components/ui/Loading'

type Tab = 'roadmap' | 'weekly'

function AuthenticatedApp() {
  const [tab, setTab] = useState<Tab>('roadmap')
  const { signOut } = useAuthActions()
  const { activeQuarter, isLoading, seed } = useQuarters()
  const openQuarter = useUIStore(s => s.openQuarter)
  const openStream = useUIStore(s => s.openStream)
  const selectedWeek = useUIStore(s => s.selectedWeek)
  const setSelectedWeek = useUIStore(s => s.setSelectedWeek)
  const currentWeek = useCurrentWeek()

  useEffect(() => { seed() }, [])

  function navigateToWeek(week: number) {
    setSelectedWeek(week)
    setTab('weekly')
  }

  function handleTabChange(t: Tab) {
    if (t === 'roadmap') setSelectedWeek(null)
    setTab(t)
  }

  const viewWeek = selectedWeek ?? currentWeek

  if (isLoading) return <Loading />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden h-screen">

      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 flex-shrink-0">
        {/* Row 1: Logo + Actions (always visible) */}
        <div className="relative flex items-center justify-between px-4 sm:px-5 h-12 sm:h-14">
          {/* Left: logo + quarter */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.3" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest leading-none mb-0.5">Tracker</p>
              <button
                onClick={openQuarter}
                className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1 leading-none"
              >
                {activeQuarter?.label ?? 'Quarter'}
                <span className="text-gray-400 text-xs">▾</span>
              </button>
            </div>
          </div>

          {/* Center: segment control — desktop only (absolute center) */}
          <nav className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5 bg-gray-100 p-1 rounded-xl">
            {(['roadmap', 'weekly'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0
                  ${tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 bg-transparent'}`}
              >
                {t === 'roadmap' ? 'Roadmap' : 'Week'}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {tab === 'roadmap' && (
              <button
                onClick={() => openStream()}
                className="flex items-center gap-1 sm:gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700
                           bg-indigo-50 hover:bg-indigo-100 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all border-0 cursor-pointer"
              >
                <span className="text-base leading-none">+</span>
                <span className="hidden xs:inline sm:inline">Stream</span>
              </button>
            )}
            <button
              onClick={() => signOut()}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer px-2 py-1.5 whitespace-nowrap"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Row 2: Tabs — mobile only */}
        <div className="flex sm:hidden px-4 pb-2">
          <nav className="flex w-full items-center gap-0.5 bg-gray-100 p-1 rounded-xl">
            {(['roadmap', 'weekly'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0
                  ${tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 bg-transparent'}`}
              >
                {t === 'roadmap' ? 'Roadmap' : 'Week'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {tab === 'roadmap' && (
          activeQuarter
            ? <RoadmapGrid quarterId={activeQuarter._id} onWeekClick={navigateToWeek} />
            : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <span className="text-5xl">🗓</span>
                <p className="font-semibold text-gray-600">No active quarter</p>
                <button
                  onClick={openQuarter}
                  className="bg-indigo-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-600 transition-colors cursor-pointer border-0"
                >
                  Create quarter
                </button>
              </div>
            )
        )}
        {tab === 'weekly' && (
          <WeeklyView
            week={viewWeek}
            onReturnToCurrent={() => setSelectedWeek(null)}
          />
        )}
      </main>

      <TaskModal />
      <StreamModal />
      <QuarterModal />
    </div>
  )
}

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (isLoading) return <Loading />
  if (!isAuthenticated) return <AuthScreen />

  return <AuthenticatedApp />
}
