'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { useAsyncResource } from '@/src/hooks/useAsyncResource'
import { dashboardDataService } from '@/src/services/dashboardDataService'
import { AppView } from '@/src/types'
import { DashboardDataSource } from '@/src/services/dashboardContracts'
import { EmptyState, ResourceState } from '@/src/components/resourceStates'
import { buildCalendarCells, shiftMonth, toEventMap } from '@/src/utils/calendar'

const views: { id: AppView; icon: React.ElementType }[] = [
  { id: 'Live Agent Operations', icon: LayoutDashboard },
  { id: 'Calendar', icon: Calendar },
  { id: 'Projects', icon: FolderKanban },
  { id: 'Memory', icon: Brain },
  { id: 'Docs', icon: FileText },
  { id: 'Team', icon: Users },
]

const toneClassByState = (state: string) => {
  if (state === 'Running') return 'tone-running'
  if (state === 'Waiting QA') return 'tone-qa'
  if (state === 'Blocked') return 'tone-blocked'
  return 'tone-idle'
}

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>('Live Agent Operations')
  const [memoryTab, setMemoryTab] = useState<'Recent' | 'Long-term'>('Recent')
  const [date, setDate] = useState<string>()
  const [docId, setDocId] = useState<string>()
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 2, 1))
  const [dataSource, setDataSource] = useState<DashboardDataSource>('mock')

  const opsResource = useAsyncResource(useCallback(() => dashboardDataService.getOpsSnapshot(), []))
  const projectsResource = useAsyncResource(useCallback(() => dashboardDataService.getProjects(), []))
  const memoriesResource = useAsyncResource(useCallback(() => dashboardDataService.getMemories(), []))
  const docsResource = useAsyncResource(useCallback(() => dashboardDataService.getDocs(), []))
  const teamResource = useAsyncResource(useCallback(() => dashboardDataService.getTeam(), []))
  const calendarEventsResource = useAsyncResource(useCallback(() => dashboardDataService.getCalendarEvents(), []))

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

  useEffect(() => {
    dashboardDataService
      .getSource()
      .then(setDataSource)
      .catch(() => setDataSource('error'))
  }, [])

  const selectedDoc = docsResource.data?.find((d) => d.id === docId)
  const dates = useMemo(() => [...new Set((memoriesResource.data ?? []).map((m) => m.date))], [memoriesResource.data])
  const visibleMemories = (memoriesResource.data ?? []).filter((m) => (memoryTab === 'Recent' ? m.date === date : m.isPinned))

  const calendarLabel = useMemo(
    () => calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [calendarMonth],
  )

  const eventsByDate = useMemo(() => toEventMap(calendarEventsResource.data ?? []), [calendarEventsResource.data])

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth, eventsByDate), [calendarMonth, eventsByDate])

  const goPrevMonth = () => setCalendarMonth((prev) => shiftMonth(prev, -1))
  const goNextMonth = () => setCalendarMonth((prev) => shiftMonth(prev, 1))
  const goToday = () => setCalendarMonth(new Date())

  return (
    <div className="app">
      <aside className="sidebar">
        {views.map((v) => {
          const Icon = v.icon
          return (
            <button key={v.id} className={`nav-btn ${activeView === v.id ? 'active' : ''}`} onClick={() => setActiveView(v.id)} title={v.id}>
              <Icon size={18} />
            </button>
          )
        })}
      </aside>
      <main className="main">
        <header className="header">
          <div className="row" style={{ gap: 8 }}>
            <h2 style={{ margin: 0 }}>{activeView}</h2>
            <span className="badge">v2.0.0-ops</span>
            <span className="badge">source:{dataSource}</span>
          </div>
          <AlertCircle size={18} color="#888" />
        </header>

        <section className="content">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ height: '100%' }}>
              {activeView === 'Live Agent Operations' && (
                <div className="ops-layout">
                  <ResourceState
                    loading={opsResource.loading}
                    error={opsResource.error}
                    isEmpty={!opsResource.data}
                    loadingMessage="Loading live operations…"
                    errorMessage={(error) => `Failed to load operations: ${error}`}
                    emptyMessage="No operations snapshot available."
                    onRetry={opsResource.reload}
                    loadingClassName="panel muted"
                    errorClassName="panel"
                    emptyClassName="panel muted"
                  >
                    <>
                      <div className="ops-metrics">
                        <div className="panel metric-card"><div className="muted">Active Runs</div><strong>{opsResource.data?.metrics.activeRuns}</strong></div>
                        <div className="panel metric-card"><div className="muted">Blocked Runs</div><strong>{opsResource.data?.metrics.blockedRuns}</strong></div>
                        <div className="panel metric-card"><div className="muted">QA Pass Rate (Today)</div><strong>{opsResource.data?.metrics.qaPassRateToday}%</strong></div>
                        <div className="panel metric-card"><div className="muted">Median Cycle Time</div><strong>{opsResource.data?.metrics.medianCycleTimeHours}h</strong></div>
                        <div className="panel metric-card"><div className="muted">Last Successful Deploy</div><strong>{opsResource.data?.metrics.lastSuccessfulDeployCommit}</strong></div>
                      </div>

                      <div className="ops-main-grid">
                        <div className="panel ops-table-wrap">
                          <div className="row" style={{ marginBottom: 10 }}>
                            <strong>Live Agent Operations</strong>
                            <span className="badge">{opsResource.data?.agents.length ?? 0} agents</span>
                          </div>
                          <table className="ops-table">
                            <thead>
                              <tr>
                                <th>Agent</th>
                                <th>Current Work</th>
                                <th>State</th>
                                <th>Since</th>
                                <th>Last Update</th>
                                <th>Run ID / Commit</th>
                                <th>Next Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(opsResource.data?.agents ?? []).map((agent) => (
                                <tr key={agent.id}>
                                  <td>{agent.agent}</td>
                                  <td>{agent.currentWork}</td>
                                  <td><span className={`pill-state ${toneClassByState(agent.state)}`}>{agent.state}</span></td>
                                  <td>{agent.since}</td>
                                  <td>{agent.lastUpdate}</td>
                                  <td><code>{agent.runIdOrCommit}</code></td>
                                  <td>{agent.nextAction}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="ops-side-panels">
                          <div className="panel ops-timeline">
                            <div className="row" style={{ marginBottom: 10 }}><strong>Execution Timeline</strong></div>
                            {(opsResource.data?.timeline ?? []).map((event) => (
                              <div key={event.id} className="timeline-item">
                                <div className="muted timeline-time">{event.timestamp}</div>
                                <div>{event.message}</div>
                              </div>
                            ))}
                          </div>

                          <div className="panel ops-lanes">
                            <div className="row" style={{ marginBottom: 10 }}><strong>Pipeline Lanes</strong></div>
                            {(opsResource.data?.lanes ?? []).map((lane) => (
                              <div key={lane.id} className="lane-block">
                                <div className="row"><span>{lane.title}</span><span className="badge">{lane.count}</span></div>
                                <ul>
                                  {lane.items.slice(0, 3).map((item, idx) => <li key={`${lane.id}-${idx}`} className="muted">{item}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  </ResourceState>
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
                  <ResourceState
                    loading={calendarEventsResource.loading}
                    error={calendarEventsResource.error}
                    isEmpty={false}
                    loadingMessage="Loading calendar events…"
                    errorMessage={(error) => `Failed to load calendar events: ${error}`}
                    emptyMessage=""
                    onRetry={calendarEventsResource.reload}
                    loadingClassName="panel muted"
                    errorClassName="panel"
                  >
                    <>
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
                      {(calendarEventsResource.data ?? []).length === 0 && <EmptyState message="No calendar events available." className="panel muted" />}
                    </>
                  </ResourceState>
                </div>
              )}

              {activeView === 'Projects' && (
                <div className="projects">
                  <ResourceState
                    loading={projectsResource.loading}
                    error={projectsResource.error}
                    isEmpty={(projectsResource.data ?? []).length === 0}
                    loadingMessage="Loading projects…"
                    errorMessage={(error) => `Failed to load projects: ${error}`}
                    emptyMessage="No projects available."
                    onRetry={projectsResource.reload}
                    loadingClassName="panel project-card"
                    errorClassName="panel project-card"
                    emptyClassName="panel project-card muted"
                  >
                    {(projectsResource.data ?? []).map((p) => <div key={p.id} className="panel project-card"><div className="row"><strong>{p.name}</strong><span className="badge">{p.status}</span></div><p className="muted">{p.taskCount} tasks · {p.lastActivity}</p><div className="progress"><div style={{ width: `${p.progress}%` }} /></div></div>)}
                  </ResourceState>
                </div>
              )}

              {activeView === 'Memory' && (
                <div className="memory">
                  <div className="panel sidebar-list">
                    <ResourceState
                      loading={memoriesResource.loading}
                      error={memoriesResource.error}
                      isEmpty={dates.length === 0}
                      loadingMessage="Loading memories…"
                      errorMessage={(error) => `Failed to load memories: ${error}`}
                      emptyMessage="No memory dates found."
                      onRetry={memoriesResource.reload}
                      loadingClassName="muted"
                      errorClassName=""
                      emptyClassName="muted"
                    >
                      {dates.map((d) => <button key={d} className="nav-btn" style={{ width: '100%', justifyContent: 'flex-start', paddingInline: 8, marginBottom: 6 }} onClick={() => setDate(d)}>{d}</button>)}
                    </ResourceState>
                  </div>
                  <div className="panel memory-main">
                    <div className="row" style={{ marginBottom: 12 }}>
                      <div className="row" style={{ gap: 8 }}><button className="nav-btn" onClick={() => setMemoryTab('Recent')}>Recent</button><button className="nav-btn" onClick={() => setMemoryTab('Long-term')}>Long-term</button></div>
                      <span className="badge">{memoryTab}</span>
                    </div>
                    <ResourceState
                      loading={memoriesResource.loading}
                      error={memoriesResource.error}
                      isEmpty={visibleMemories.length === 0}
                      loadingMessage="Loading memories…"
                      errorMessage={(error) => `Failed to load memories: ${error}`}
                      emptyMessage="No memory entries in this view."
                      onRetry={memoriesResource.reload}
                      loadingClassName="muted"
                      errorClassName=""
                      emptyClassName="muted"
                    >
                      {visibleMemories.map((m) => <div key={m.id} className="panel" style={{ padding: 12, marginBottom: 8 }}><div className="muted">{m.timestamp}</div><div>{m.content}</div></div>)}
                    </ResourceState>
                  </div>
                </div>
              )}

              {activeView === 'Docs' && (
                <div className="docs">
                  <div className="panel docs-list">
                    <ResourceState
                      loading={docsResource.loading}
                      error={docsResource.error}
                      isEmpty={(docsResource.data ?? []).length === 0}
                      loadingMessage="Loading docs…"
                      errorMessage={(error) => `Failed to load docs: ${error}`}
                      emptyMessage="No docs available."
                      onRetry={docsResource.reload}
                      loadingClassName="muted"
                      errorClassName=""
                      emptyClassName="muted"
                    >
                      {(docsResource.data ?? []).map((d) => <div key={d.id} className="panel" style={{ padding: 10, marginBottom: 8, borderColor: docId === d.id ? '#4c8bf5' : '#222' }} onClick={() => setDocId(d.id)}><div className="row"><strong style={{ fontSize: 13 }}>{d.title}</strong><span className="badge">{d.format}</span></div><div className="muted">{d.category} · {d.createdDate}</div><p className="muted">{d.preview}</p></div>)}
                    </ResourceState>
                  </div>
                  <AnimatePresence mode="wait">
                    {selectedDoc ? (
                      <motion.div key={selectedDoc.id} className="panel preview" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                        <div className="muted">{selectedDoc.category}</div>
                        <h3>{selectedDoc.title}</h3>
                        <p>{selectedDoc.preview}</p>
                        <div className="muted">Created: {selectedDoc.createdDate}</div>
                      </motion.div>
                    ) : (
                      !docsResource.loading && !docsResource.error && <EmptyState message="Select a document to preview." className="panel preview muted" />
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeView === 'Team' && (
                <div className="team">
                  <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
                    <em style={{ color: '#8cb4ff' }}>&quot;Operational clarity first: who is running what right now.&quot;</em>
                    <p className="muted">Mission statement shifted from board management to live execution visibility.</p>
                  </div>
                  <div className="team-grid">
                    <ResourceState
                      loading={teamResource.loading}
                      error={teamResource.error}
                      isEmpty={(teamResource.data ?? []).length === 0}
                      loadingMessage="Loading team…"
                      errorMessage={(error) => `Failed to load team: ${error}`}
                      emptyMessage="No team members found."
                      onRetry={teamResource.reload}
                      loadingClassName="panel agent muted"
                      errorClassName="panel agent"
                      emptyClassName="panel agent muted"
                    >
                      {(teamResource.data ?? []).map((m) => (
                        <div key={m.id} className="panel agent">
                          <div className="row"><strong>{m.name}</strong><span className="badge">{m.status}</span></div>
                          <div className="muted">{m.role} · {m.model}</div>
                          <div style={{ marginTop: 8 }}>{m.currentTask}</div>
                          <div className="muted">{m.deviceInfo}</div>
                        </div>
                      ))}
                    </ResourceState>
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
