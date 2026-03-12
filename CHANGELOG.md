# Changelog

## [Unreleased]

## [2.1.0] - 2026-03-12
### Added
- Roadmap: auto-scroll to current week on mobile quarter view
- Modal: drag handle indicator (bottom sheet UX pattern for iOS/Android)
- WeeklyView: empty kanban column placeholder is now a clickable "+ Add task" button

### Changed
- Roadmap: current week header is now bold for better visibility on small screens
- WeeklyView: 4 kanban columns fit on screen without horizontal scroll (flex-1/min-w-0)
- WeeklyView: compact card layout on mobile (smaller padding, hidden description)
- WeeklyView: "+ Add task" button only shown when column has tasks
- Modal: max-height uses `dvh` (dynamic viewport height) — fixes sizing when keyboard opens
- Modal: added `safe-area-inset-bottom` padding for notched phones (iPhone X+)
- TaskModal: responsive padding, gaps, week buttons and textarea size on mobile
- Buttons: `touch-manipulation` on all interactive elements removes 300ms tap delay

### Fixed
- Page zoom blocked via `user-scalable=no` viewport meta + JS touchmove handler (iOS Safari fallback)

## [2.0.0] - 2026-03-12
### Added
- Convex backend integration
- Mobile responsive layout (header, roadmap grid, weekly view)
- Vercel and Netlify deployment configs
- `useIsMobile` hook for reactive breakpoint detection

### Changed
- Header navigation: two-row layout on mobile
- RoadmapGrid: dynamic column width based on screen size
- WeeklyView: fluid kanban columns for small screens
