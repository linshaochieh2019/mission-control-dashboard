'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Brain, Calendar, FileText, FolderKanban, LayoutDashboard, Users } from 'lucide-react'
import { mockActivities, mockDocs, mockMemories, mockProjects, mockTasks, mockTeam } from '@/src/mockData'
import { AppView, Task } from '@/src/types'

const views: { id: AppView; icon: React.ElementType }[] = [
  { id: 'Task Board', icon: LayoutDashboard },
  { id: 'Calendar', icon: Calendar },
  { id: 'Projects', icon: FolderKanban },
  { id: 'Memory', icon: Brain },
  { id: 'Docs', icon: FileText },
  { id: 'Team', icon: Users },
]

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>('Task Board')
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [memoryTab, setMemoryTab] = useState<'Recent' | 'Long-term'>('Recent')
  const [date, setDate] = useState(mockMemories[0]?.date)
  const [docId, setDocId] = useState(mockDocs[0]?.id)

  const selectedDoc = mockDocs.find((d) => d.id === docId)
  const dates = [...new Set(mockMemories.map((m) => m.date))]
  const visibleMemories = mockMemories.filter((m) => (memoryTab === 'Recent' ? m.date === date : m.isPinned))

  const moveTask = (status: Task['status']) => {
    if (!dragTaskId) return
    setTasks((prev) => prev.map((task) => (task.id === dragTaskId ? { ...task, status } : task)))
  }

  const monthDays = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])

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
                    {mockActivities.map((a) => (
                      <div key={a.id} style={{ marginTop: 10 }}>
                        <div style={{ fontFamily: 'JetBrains Mono', color: '#888', fontSize: 11 }}>{a.timestamp}</div>
                        <div style={{ fontSize: 13 }}>{a.action}</div>
                      </div>
                    ))}
                  </div>
                  <div className="kanban">
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
                  <div className="row"><h3 style={{ margin: 0 }}>March 2026</h3><span className="badge">Today / Prev / Next</span></div>
                  <div className="month-grid panel">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="cell muted">{d}</div>)}
                    {monthDays.map((d) => (
                      <div key={d} className="cell">
                        <div className="muted">{d}</div>
                        {d <= 5 && <span className="pill" style={{ background: '#1b3054', color: '#8cb4ff' }}>Daily Standup</span>}
                        {d === 12 && <span className="pill" style={{ background: '#4b3414', color: '#fbbf24' }}>Sprint Check</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'Projects' && <div className="projects">{mockProjects.map((p) => <div key={p.id} className="panel project-card"><div className="row"><strong>{p.name}</strong><span className="badge">{p.status}</span></div><p className="muted">{p.taskCount} tasks · {p.lastActivity}</p><div className="progress"><div style={{ width: `${p.progress}%` }} /></div></div>)}</div>}

              {activeView === 'Memory' && (
                <div className="memory">
                  <div className="panel sidebar-list">{dates.map((d) => <button key={d} className="nav-btn" style={{ width: '100%', justifyContent: 'flex-start', paddingInline: 8, marginBottom: 6 }} onClick={() => setDate(d)}>{d}</button>)}</div>
                  <div className="panel memory-main">
                    <div className="row" style={{ marginBottom: 12 }}>
                      <div className="row" style={{ gap: 8 }}><button className="nav-btn" onClick={() => setMemoryTab('Recent')}>Recent</button><button className="nav-btn" onClick={() => setMemoryTab('Long-term')}>Long-term</button></div>
                      <span className="badge">{memoryTab}</span>
                    </div>
                    {visibleMemories.map((m) => <div key={m.id} className="panel" style={{ padding: 12, marginBottom: 8 }}><div className="muted">{m.timestamp}</div><div>{m.content}</div></div>)}
                  </div>
                </div>
              )}

              {activeView === 'Docs' && (
                <div className="docs">
                  <div className="panel docs-list">{mockDocs.map((d) => <div key={d.id} className="panel" style={{ padding: 10, marginBottom: 8, borderColor: docId === d.id ? '#4c8bf5' : '#222' }} onClick={() => setDocId(d.id)}><div className="row"><strong style={{ fontSize: 13 }}>{d.title}</strong><span className="badge">{d.format}</span></div><div className="muted">{d.category} · {d.createdDate}</div><p className="muted">{d.preview}</p></div>)}</div>
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
                    {mockTeam.map((m) => (
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
