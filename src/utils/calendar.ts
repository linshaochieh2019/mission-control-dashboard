import { CalendarEvent } from '@/src/types'

export type CalendarCell =
  | { key: string; empty: true }
  | { key: string; empty: false; day: number; events: CalendarEvent[] }

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toEventMap = (events: CalendarEvent[]) =>
  events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event]
    return acc
  }, {})

export const buildCalendarCells = (calendarMonth: Date, eventsByDate: Record<string, CalendarEvent[]>) => {
  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekDay = (firstDay.getDay() + 6) % 7

  const leading: CalendarCell[] = Array.from({ length: firstWeekDay }, (_, idx) => ({ key: `lead-${idx}`, empty: true }))
  const days: CalendarCell[] = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1
    const dayDate = new Date(year, month, day)
    const dateKey = formatDateKey(dayDate)
    return {
      key: dateKey,
      empty: false,
      day,
      events: eventsByDate[dateKey] ?? [],
    }
  })

  return [...leading, ...days]
}

export const shiftMonth = (date: Date, diff: number) => new Date(date.getFullYear(), date.getMonth() + diff, 1)
