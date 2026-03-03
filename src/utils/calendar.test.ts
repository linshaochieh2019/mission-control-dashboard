import { describe, expect, it } from 'vitest'
import { buildCalendarCells, formatDateKey, shiftMonth, toEventMap } from './calendar'
import { CalendarEvent } from '@/src/types'

describe('calendar utilities', () => {
  it('formats date keys as YYYY-MM-DD', () => {
    expect(formatDateKey(new Date(2026, 2, 7))).toBe('2026-03-07')
  })

  it('groups events by date while preserving same-day order', () => {
    const events: CalendarEvent[] = [
      { id: 'a', date: '2026-03-04', label: 'A' },
      { id: 'b', date: '2026-03-04', label: 'B' },
      { id: 'c', date: '2026-03-10', label: 'C' },
    ]

    const map = toEventMap(events)

    expect(map['2026-03-04'].map((event) => event.id)).toEqual(['a', 'b'])
    expect(map['2026-03-10'].map((event) => event.id)).toEqual(['c'])
  })

  it('builds month grid with monday-based leading offset', () => {
    // March 2026 starts on Sunday -> should produce 6 leading blanks with Mon-first grid.
    const cells = buildCalendarCells(new Date(2026, 2, 1), {})

    expect(cells.slice(0, 6).every((cell) => cell.empty)).toBe(true)
    expect(cells[6]).toMatchObject({ empty: false, day: 1, key: '2026-03-01' })
    expect(cells.filter((cell) => !cell.empty)).toHaveLength(31)
    expect(cells).toHaveLength(37)
  })

  it('attaches events to matching day cells only', () => {
    const map = toEventMap([
      { id: 'evt-1', date: '2026-03-03', label: 'Kickoff' },
      { id: 'evt-2', date: '2026-03-31', label: 'Wrap', variant: 'highlight' },
    ])

    const cells = buildCalendarCells(new Date(2026, 2, 1), map)

    const day3 = cells.find((cell) => !cell.empty && cell.day === 3)
    const day31 = cells.find((cell) => !cell.empty && cell.day === 31)
    const day2 = cells.find((cell) => !cell.empty && cell.day === 2)

    expect(day3 && !day3.empty ? day3.events.map((event) => event.id) : []).toEqual(['evt-1'])
    expect(day31 && !day31.empty ? day31.events.map((event) => event.id) : []).toEqual(['evt-2'])
    expect(day2 && !day2.empty ? day2.events : []).toEqual([])
  })

  it('shifts month boundaries correctly across year transitions', () => {
    expect(formatDateKey(shiftMonth(new Date(2026, 0, 1), -1))).toBe('2025-12-01')
    expect(formatDateKey(shiftMonth(new Date(2026, 11, 1), 1))).toBe('2027-01-01')
  })
})
