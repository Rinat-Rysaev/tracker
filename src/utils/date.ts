import type { Quarter } from '../types'

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function getQuarterForDate(date: Date): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const month = date.getMonth()
  return { year: date.getFullYear(), quarter: (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4 }
}

export function getQuarterStartDate(year: number, quarter: 1 | 2 | 3 | 4): string {
  const monthIndex = (quarter - 1) * 3
  const firstDay = new Date(year, monthIndex, 1)
  const monday = getMondayOf(firstDay)
  if (monday < firstDay) monday.setDate(monday.getDate() + 7)
  return monday.toISOString().split('T')[0]
}

export function getCurrentWeekNumber(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(Math.max(diff + 1, 1), 13)
}

export function getWeekDateRange(startDate: string, weekNumber: number): string {
  const start = new Date(startDate)
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`
}

export function getQuarterLabel(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter} ${year}`
}

export function getQuarterMonthGroups(quarter: Quarter): { label: string; weeks: number[] }[] {
  const start = new Date(quarter.startDate)
  const startMonth = start.getMonth()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const groups = [0, 1, 2].map(i => ({ label: monthNames[(startMonth + i) % 12], weeks: [] as number[] }))
  for (let w = 1; w <= 13; w++) {
    const d = new Date(start)
    d.setDate(start.getDate() + (w - 1) * 7)
    const offset = Math.min((d.getMonth() - startMonth + 12) % 12, 2)
    groups[offset].weeks.push(w)
  }
  return groups
}

