'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Brain, Calendar, ChevronLeft, ChevronRight, FileText, FolderKanban, LayoutDashboard, Users } from 'lucide-react'
import { useAsyncResource } from '@/src/hooks/useAsyncResource'
import { dashboardDataService } from '@/src/services/dashboardDataService'
import { AppView, CalendarEvent, Task } from '@/src/types'

const views: { id: AppView; icon: React.ElementType }[] = [
  { id: 'Task Board', icon: LayoutDashboard },
  { id: 'Calendar', icon: Calendar },
  { id: 'Projects', icon: FolderKanban },
  { id: 'Memory', icon: Brain },
  { id: 'Docs', icon: FileText },
  { id: 'Team', icon: Users },
]

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

type CalendarCell =
  | { key: string; empty: true }
  | { key: string; empty: false; day: number; events: CalendarEvent[] }

const toEventMap = (events: CalendarEvent[]) =>
  events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event]
    return acc
  }, {})

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>('Task Board')
  const [tasks, setTasks] = useState<Task[]>([])
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [taskPersistenceError, setTaskPersistenceError] = useState<string | null>(null)
  const [memoryTab, setMemoryTab] = useState<'Recent' | 'Long-term'>('Recent')
  const [date, setDate] = useState<string>()
  const [docId, setDocId] = useState<string>()
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 2, 1))

  const tasksResource = useAsyncResource(useCallback(() => dashboardDataService.getTasks(), []))
  const activitiesResource = useAsyncResource(useCallback(() => dashboardDataService.getActivities(), []))
  const projectsResource = useAsyncResource(useCallback(() => dashboardDataService.getProjects(), []))
  const memoriesResource = useAsyncResource(useCallback(() => dashboardDataService.getMemories(), []))
  const docsResource = useAsyncResource(useCallback(() => dashboardDataService.getDocs(), []))
  const teamResource = useAsyncResource(useCallback(() => dashboardDataService.getTeam(), []))
  const calendarEventsResource = useAsyncResource(useCallback(() => dashboardDataService.getCalendarEvents(), []))

  useEffect(() => {
    if (tasksResource.data) {
      setTasks(tasksResource.data)
    }
  }, [tasksResource.data])

  useEffect(() => {
    if (!date && memoriesResource.data?.[0]) {
      setDate(memoriesResource.data[0].date)
    }
  }, [date, memoriesResource.data])

  useEffect(() => {
    if (!docId && docsResource.data?.[0]) {
      setDocId(docsResource.data[0].id)
    }
  }, [docId, docsResource.data])

  const selectedDoc = docsResource.data?.find((d) => d.id === docId)
  const dates = useMemo(() => [...new Set((memoriesResource.data ?? []).map((m) => m.date))], [memoriesResource.data])
  const visibleMemories = (memoriesResource.data ?? []).filter((m) => (memoryTab === 'Recent' ? m.date === date : m.isPinned))

  const moveTask = async (status: Task['status']) => {
    if (!dragTaskId) return

    const taskId = dragTaskId
    let previousStatus: Task['status'] | null = null

    setTaskPersistenceError(null)
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          previousStatus = task.status
          return { ...task, status }
        }

        return task
      }),
    )

    if (!previousStatus) return

    try {
      await dashboardDataService.updateTaskStatus(taskId, status)
    } catch {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: previousStatus as Task['status'] } : task)))
      setTaskPersistenceError('Could not save task move. Reverted to previous column.')
    }
  }

  const calendarLabel = useMemo(
    () => calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [calendarMonth],
  )

  const eventsByDate = useMemo(() => toEventMap(calendarEventsResource.data ?? []), [calendarEventsResource.data])

  const calendarCells = useMemo(() => {
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
  }, [calendarMonth, eventsByDate])

  const goPrevMonth = () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goNextMonth = () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const goToday = () => setCalendarMonth(new Date())

  return (
    <div className="app">
      <aside className="sidebar">
        {views.map((v) => {
          const Icon = v.icon
          return (
            <button key={v.id} className={`nav-btn ${activeView === v.id ? 'active' : ''}`} onClick={() => setActiveView(v.id)}>
              <Icon size={18} />
            </button>
          )
        })}
      </aside>
      <main className="main">
        <header className="header">
          <div className="row" style={{ gap: 8 }}>
            <h2 style={{ margin: 0 }}>{activeView}</h2>
            <span className="badge">v1.0.4-beta</span>
          </div>
          <AlertCircle size={18} color="#888" />
        </header>

        <section className="content">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ height: '100%' }}>
              {activeView === 'Task Board' && (
                <div className="task-grid">
                  <div className="panel activity">
                    <div className="muted">Live Activity</div>
                    {activitiesResource.loading && <div style={{ marginTop: 10 }}>Loading activity…</div>}
                    {activitiesResource.error && (
                      <div style={{ marginTop: 10 }}>
                        <div className="muted">Failed to load activity: {activitiesResource.error}</div>
                        <button className="nav-btn" onClick={activitiesResource.reload}>Retry</button>
                      </div>
                    )}
                    {!activitiesResource.loading && !activitiesResource.error && (activitiesResource.data ?? []).length === 0 && (
                      <div style={{ marginTop: 10 }} className="muted">No activity yet.</div>
                    )}
                    {(activitiesResource.data ?? []).map((a) => (
                      <div key={a.id} style={{ marginTop: 10 }}>
                        <div style={{ fontFamily: 'JetBrains Mono', color: '#888', fontSize: 11 }}>{a.timestamp}</div>
                        <div style={{ fontSize: 13 }}>{a.action}</div>
                      </div>
                    ))}
                  </div>
                  <div className="kanban">
                    {taskPersistenceError && <div className="panel column muted">{taskPersistenceError}</div>}
                    {tasksResource.loading && <div className="panel column">Loading tasks…</div>}
                    {tasksResource.error && (
                      <div className="panel column">
                        <div className="muted">Failed to load tasks: {tasksResource.error}</div>
                        <button className="nav-btn" onClick={tasksResource.reload}>Retry</button>
                      </div>
                    )}
                    {!tasksResource.loading && !tasksResource.error && tasks.length === 0 && <div className="panel column muted">No tasks found.</div>}
                    {(['Backlog', 'In Progress', 'Review', 'Done'] as const).map((col) => (
                      <div className="panel column" key={col} onDragOver={(e) => e.preventDefault()} onDrop={() => moveTask(col)}>
                        <div className="row"><strong style={{ fontSize: 13 }}>{col}</strong><span className="badge">{tasks.filter((t) => t.status === col).length}</span></div>
                        {tasks.filter((t) => t.status === col).map((t) => (
                          <article key={t.id} className="task" draggable onDragStart={() => setDragTaskId(t.id)} onDragEnd={() => setDragTaskId(null)}>
                            <div className="row"><strong style={{ fontSize: 12 }}>{t.title}</strong><span className="badge">{t.assignee}</span></div>
                            <p className="muted">{t.description}</p>
                          </article>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'Calendar' && (
                <div className="calendar">
                  <div className="row">
                    <h3 style={{ margin: 0 }}>{calendarLabel}</h3>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="nav-btn" onClick={goToday} title="Today">Today</button>
                      <button className="nav-btn" onClick={goPrevMonth} title="Previous month"><ChevronLeft size={16} /></button>
                      <button className="nav-btn" onClick={goNextMonth} title="Next month"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                  <div className="month-grid panel">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="cell muted">{d}</div>)}
                    {calendarCells.map((cell) => (
                      <div key={cell.key} className="cell" style={cell.empty ? { background: '#101010' } : undefined}>
                        {!cell.empty && (
                          <>
                            <div className="muted">{cell.day}</div>
                            {cell.events.map((event) => (
                              <span
                                key={event.id}
                                className="pill"
                                style={event.variant === 'highlight' ? { background: '#4b3414', color: '#fbbf24' } : { background: '#1b3054', color: '#8cb4ff' }}
                              >
                                {event.label}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'Projects' && (
                <div className="projects">
                  {projectsResource.loading && <div className="panel project-card">Loading projects…</div>}
                  {projectsResource.error && <div className="panel project-card muted">Failed to load projects: {projectsResource.error}</div>}
                  {!projectsResource.loading && !projectsResource.error && (projectsResource.data ?? []).length === 0 && <div className="panel project-card muted">No projects available.</div>}
                  {(projectsResource.data ?? []).map((p) => <div key={p.id} className="panel project-card"><div className="row"><strong>{p.name}</strong><span className="badge">{p.status}</span></div><p className="muted">{p.taskCount} tasks · {p.lastActivity}</p><div className="progress"><div style={{ width: `${p.progress}%` }} /></div></div>)}
                </div>
              )}

              {activeView === 'Memory' && (
                <div className="memory">
                  <div className="panel sidebar-list">
                    {memoriesResource.loading && <div className="muted">Loading memories…</div>}
                    {memoriesResource.error && <div className="muted">Failed to load memories: {memoriesResource.error}</div>}
                    {dates.map((d) => <button key={d} className="nav-btn" style={{ width: '100%', justifyContent: 'flex-start', paddingInline: 8, marginBottom: 6 }} onClick={() => setDate(d)}>{d}</button>)}
                  </div>
                  <div className="panel memory-main">
                    <div className="row" style={{ marginBottom: 12 }}>
                      <div className="row" style={{ gap: 8 }}><button className="nav-btn" onClick={() => setMemoryTab('Recent')}>Recent</button><button className="nav-btn" onClick={() => setMemoryTab('Long-term')}>Long-term</button></div>
                      <span className="badge">{memoryTab}</span>
                    </div>
                    {!memoriesResource.loading && !memoriesResource.error && visibleMemories.length === 0 && <div className="muted">No memory entries in this view.</div>}
                    {visibleMemories.map((m) => <div key={m.id} className="panel" style={{ padding: 12, marginBottom: 8 }}><div className="muted">{m.timestamp}</div><div>{m.content}</div></div>)}
                  </div>
                </div>
              )}

              {activeView === 'Docs' && (
                <div className="docs">
                  <div className="panel docs-list">
                    {docsResource.loading && <div className="muted">Loading docs…</div>}
                    {docsResource.error && <div className="muted">Failed to load docs: {docsResource.error}</div>}
                    {(docsResource.data ?? []).map((d) => <div key={d.id} className="panel" style={{ padding: 10, marginBottom: 8, borderColor: docId === d.id ? '#4c8bf5' : '#222' }} onClick={() => setDocId(d.id)}><div className="row"><strong style={{ fontSize: 13 }}>{d.title}</strong><span className="badge">{d.format}</span></div><div className="muted">{d.category} · {d.createdDate}</div><p className="muted">{d.preview}</p></div>)}
                  </div>
                  <AnimatePresence mode="wait">
                    {selectedDoc && <motion.div key={selectedDoc.id} className="panel preview" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}><div className="muted">{selectedDoc.category}</div><h3>{selectedDoc.title}</h3><p>{selectedDoc.preview}</p><div className="muted">Created: {selectedDoc.createdDate}</div></motion.div>}
                  </AnimatePresence>
                </div>
              )}

              {activeView === 'Team' && (
                <div className="team">
                  <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
                    <em style={{ color: '#8cb4ff' }}>&quot;Building the future of autonomous agent orchestration.&quot;</em>
                    <p className="muted">Mission Statement: Human intent to machine execution.</p>
                  </div>
                  <div className="team-grid">
                    {teamResource.loading && <div className="panel agent muted">Loading team…</div>}
                    {teamResource.error && <div className="panel agent muted">Failed to load team: {teamResource.error}</div>}
                    {!teamResource.loading && !teamResource.error && (teamResource.data ?? []).length === 0 && <div className="panel agent muted">No team members found.</div>}
                    {(teamResource.data ?? []).map((m) => (
                      <div key={m.id} className="panel agent">
                        <div className="row"><strong>{m.name}</strong><span className="badge">{m.status}</span></div>
                        <div className="muted">{m.role} · {m.model}</div>
                        <div style={{ marginTop: 8 }}>{m.currentTask}</div>
                        <div className="muted">{m.deviceInfo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}
