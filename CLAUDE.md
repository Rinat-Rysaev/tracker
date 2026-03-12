# Tracker — CLAUDE.md

## Project
Personal productivity tool: quarterly roadmap + weekly kanban.
Two views of same data. Client-server app, users in production.
Be conservative — prefer safe changes over clever ones.

## Stack (do NOT suggest upgrades)
- React 19.2, TypeScript 5.9, Tailwind 4.2, Vite 7.3
- Convex 1.32 — BaaS (DB + server functions + WebSocket)
- @convex-dev/auth 0.0.91 — email+password auth
- Zustand 5.0 — UI state only (modals, navigation), NOT persisted
- @dnd-kit — drag-and-drop (Weekly view only)

## Key architecture
- All data isolated by userId — every query/mutation checks userId
- Server-side order calculation (orderInCell, orderInWeek) — never compute on client
- Zustand = UI state only, never put server data there
- Optimistic UI in WeeklyView — local state updates instantly, mutation is fire-and-forget

## File structure
src/hooks/      — useConvexQuarters/Streams/Tasks (all server communication)
src/store/      — uiStore.ts (modals, editingIds, selectedWeek)
src/components/ — auth/ ui/ roadmap/ weekly/ modals/
convex/         — quarters.ts, streams.ts, tasks.ts, userSettings.ts

## Database tables
quarters → streams → tasks (cascade delete on server, atomic mutations)
tasks have: orderInCell (roadmap), orderInWeek (weekly), weekNumber 1–13

## Known limitations (don't try to fix without asking)
- No drag-and-drop on Roadmap (only Weekly)
- No search/filter
- Status changes via DnD only (no button in modal)
- No undo/redo — deletions are irreversible

## Dev setup
Terminal 1: npx convex dev
Terminal 2: npm run dev → localhost:5173
