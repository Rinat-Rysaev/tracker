export function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" />
            <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6" />
            <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.6" />
            <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading…</p>
      </div>
    </div>
  )
}
