'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowDownUp, Brain, Clock3, FileText, FolderKanban, FolderTree, LayoutDashboard, Search, Users } from 'lucide-react'
import { useAsyncResource } from '@/src/hooks/useAsyncResource'
import { dashboardDataService } from '@/src/services/dashboardDataService'
import { AppView, CronJob, WorkspaceExplorerNode, WorkspaceFilePreview, WorkspaceProject } from '@/src/types'
import { DashboardDataSource } from '@/src/services/dashboardContracts'
import { EmptyState, ResourceState } from '@/src/components/resourceStates'

const views: { id: AppView; icon: React.ElementType }[] = [
  { id: 'Live Agent Operations', icon: LayoutDashboard },
  { id: 'Cron Jobs', icon: Clock3 },
  { id: 'Workspace Projects', icon: FolderKanban },
  { id: 'Projects', icon: FolderKanban },
  { id: 'Workspace Explorer', icon: FolderTree },
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

const dueSoon = (job: CronJob) => {
  if (!job.enabled || !job.nextRunTime) return false
  const delta = new Date(job.nextRunTime).getTime() - Date.now()
  return delta >= 0 && delta <= 60 * 60 * 1000
}

const agentAvatarByName: Record<string, string> = {
  Pinchy: '/avatars/pinchy.png',
  Inky: '/avatars/inky.png',
  Coral: '/avatars/coral.jpg',
  Bloop: '/avatars/bloop.png',
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`
}


const filterWorkspaceTree = (nodes: WorkspaceExplorerNode[], keyword: string): WorkspaceExplorerNode[] => {
  if (!keyword.trim()) return nodes
  const needle = keyword.toLowerCase()

  return nodes.reduce<WorkspaceExplorerNode[]>((acc, node) => {
    const matches = node.name.toLowerCase().includes(needle) || node.path.toLowerCase().includes(needle)
    const children = node.children ? filterWorkspaceTree(node.children, keyword) : undefined
    if (matches || (children && children.length > 0)) {
      acc.push({ ...node, children })
    }
    return acc
  }, [])
}

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>('Live Agent Operations')
  const [memoryTab, setMemoryTab] = useState<'Recent' | 'Long-term'>('Recent')
  const [date, setDate] = useState<string>()
  const [docId, setDocId] = useState<string>()
  const [dataSource, setDataSource] = useState<DashboardDataSource>('mock')
  const [cronFilter, setCronFilter] = useState<'all' | 'system' | 'project-temp'>('all')
  const [workspaceTagFilter, setWorkspaceTagFilter] = useState<'all' | WorkspaceProject['tag']>('all')
  const [workspaceRepoFilter, setWorkspaceRepoFilter] = useState<'all' | 'git' | 'non-git'>('all')
  const [workspaceSort, setWorkspaceSort] = useState<'name' | 'lastModified' | 'sizeEstimate' | 'tag'>('lastModified')
  const [workspaceSortDir, setWorkspaceSortDir] = useState<'asc' | 'desc'>('desc')
  const [workspaceSearch, setWorkspaceSearch] = useState('')
  const [expandedWorkspaceNodes, setExpandedWorkspaceNodes] = useState<Record<string, boolean>>({})
  const [selectedWorkspacePath, setSelectedWorkspacePath] = useState<string>()
  const [workspaceFilePreview, setWorkspaceFilePreview] = useState<WorkspaceFilePreview | null>(null)
  const [workspacePreviewLoading, setWorkspacePreviewLoading] = useState(false)
  const [workspacePreviewError, setWorkspacePreviewError] = useState<string | null>(null)

  const opsResource = useAsyncResource(useCallback(() => dashboardDataService.getOpsSnapshot(), []))
  const projectsResource = useAsyncResource(useCallback(() => dashboardDataService.getProjects(), []))
  const memoriesResource = useAsyncResource(useCallback(() => dashboardDataService.getMemories(), []))
  const docsResource = useAsyncResource(useCallback(() => dashboardDataService.getDocs(), []))
  const teamResource = useAsyncResource(useCallback(() => dashboardDataService.getTeam(), []))
  const cronJobsResource = useAsyncResource(useCallback(() => dashboardDataService.getCronJobs(), []))
  const workspaceProjectsResource = useAsyncResource(useCallback(() => dashboardDataService.getWorkspaceProjects(), []))
  const workspaceExplorerTreeResource = useAsyncResource(useCallback(() => dashboardDataService.getWorkspaceExplorerTree(), []))

  useEffect(() => {
    if (!date && memoriesResource.data?.[0]) setDate(memoriesResource.data[0].date)
  }, [date, memoriesResource.data])

  useEffect(() => {
    if (!docId && docsResource.data?.[0]) setDocId(docsResource.data[0].id)
  }, [docId, docsResource.data])

  useEffect(() => {
    dashboardDataService.getSource().then(setDataSource).catch(() => setDataSource('error'))
  }, [])

  const selectedDoc = docsResource.data?.find((d) => d.id === docId)
  const dates = useMemo(() => [...new Set((memoriesResource.data ?? []).map((m) => m.date))], [memoriesResource.data])
  const visibleMemories = (memoriesResource.data ?? []).filter((m) => (memoryTab === 'Recent' ? m.date === date : m.isPinned))

  const cronJobs = cronJobsResource.data ?? []
  const filteredCronJobs = cronJobs.filter((job) => (cronFilter === 'all' ? true : job.category === cronFilter))


  const parseSizeBytes = (value: string) => {
    const match = value.trim().match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i)
    if (!match) return 0
    const amount = Number(match[1])
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const unitIndex = units.indexOf(match[2].toUpperCase())
    if (Number.isNaN(amount) || unitIndex < 0) return 0
    return amount * 1024 ** unitIndex
  }

  const workspaceProjects = workspaceProjectsResource.data ?? []
  const filteredWorkspaceProjects = workspaceProjects
    .filter((project) => (workspaceTagFilter === 'all' ? true : project.tag === workspaceTagFilter))
    .filter((project) => (workspaceRepoFilter === 'all' ? true : workspaceRepoFilter === 'git' ? project.isGitRepo : !project.isGitRepo))

  const sortedWorkspaceProjects = [...filteredWorkspaceProjects].sort((a, b) => {
    const direction = workspaceSortDir === 'asc' ? 1 : -1
    if (workspaceSort === 'name') return a.name.localeCompare(b.name) * direction
    if (workspaceSort === 'sizeEstimate') return (parseSizeBytes(a.sizeEstimate) - parseSizeBytes(b.sizeEstimate)) * direction
    if (workspaceSort === 'tag') return a.tag.localeCompare(b.tag) * direction
    return (Date.parse(a.lastModified) - Date.parse(b.lastModified)) * direction
  })


  const filteredWorkspaceTree = useMemo(
    () => filterWorkspaceTree(workspaceExplorerTreeResource.data ?? [], workspaceSearch),
    [workspaceExplorerTreeResource.data, workspaceSearch],
  )

  const toggleWorkspaceNode = (path: string) => {
    setExpandedWorkspaceNodes((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const loadWorkspaceFilePreview = async (targetPath: string) => {
    setSelectedWorkspacePath(targetPath)
    setWorkspacePreviewError(null)
    setWorkspacePreviewLoading(true)
    try {
      const preview = await dashboardDataService.getWorkspaceFilePreview(targetPath)
      setWorkspaceFilePreview(preview)
    } catch (error) {
      setWorkspaceFilePreview(null)
      setWorkspacePreviewError(error instanceof Error ? error.message : 'Failed to load file preview')
    } finally {
      setWorkspacePreviewLoading(false)
    }
  }

  const toggleWorkspaceSort = (key: 'name' | 'lastModified' | 'sizeEstimate' | 'tag') => {
    if (workspaceSort === key) {
      setWorkspaceSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setWorkspaceSort(key)
    setWorkspaceSortDir(key === 'name' || key === 'tag' ? 'asc' : 'desc')
  }

  const cronMetrics = {
    total: cronJobs.length,
    enabled: cronJobs.filter((job) => job.enabled).length,
    disabled: cronJobs.filter((job) => !job.enabled).length,
    dueSoon: cronJobs.filter(dueSoon).length,
  }

  const renderWorkspaceTree = (nodes: WorkspaceExplorerNode[], depth = 0): React.ReactNode => (
    nodes.map((node) => {
      const isDir = node.type === 'dir'
      const isExpanded = Boolean(expandedWorkspaceNodes[node.path])
      return (
        <div key={node.path}>
          <button
            className={`workspace-tree-item ${selectedWorkspacePath === node.path ? 'active' : ''}`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => {
              if (isDir) {
                toggleWorkspaceNode(node.path)
                return
              }
              loadWorkspaceFilePreview(node.path)
            }}
          >
            <span>{isDir ? (isExpanded ? '▾' : '▸') : '•'}</span>
            <span>{node.name}</span>
          </button>
          {isDir && isExpanded && node.children && renderWorkspaceTree(node.children, depth + 1)}
        </div>
      )
    })
  )

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
                  <ResourceState loading={opsResource.loading} error={opsResource.error} isEmpty={!opsResource.data} loadingMessage="Loading live operations…" errorMessage={(error) => `Failed to load operations: ${error}`} emptyMessage="No operations snapshot available." onRetry={opsResource.reload} loadingClassName="panel muted" errorClassName="panel" emptyClassName="panel muted">
                    <>
                      <div className="ops-metrics">
                        <div className="panel metric-card"><div className="muted">Active Runs</div><strong>{opsResource.data?.metrics.activeRuns}</strong></div>
                        <div className="panel metric-card"><div className="muted">Blocked Runs</div><strong>{opsResource.data?.metrics.blockedRuns}</strong></div>
                        <div className="panel metric-card"><div className="muted">QA Pass Rate (Today)</div><strong>{opsResource.data?.metrics.qaPassRateToday}%</strong></div>
                        <div className="panel metric-card"><div className="muted">Last Successful Deploy</div><strong>{opsResource.data?.metrics.lastSuccessfulDeployCommit}</strong></div>
                      </div>

                      <div className="panel ops-table-wrap">
                        <div className="row" style={{ marginBottom: 10 }}>
                          <strong>Agent Status Overview</strong>
                          <span className="badge">{opsResource.data?.agents.length ?? 0} agents</span>
                        </div>
                        <table className="ops-table">
                          <thead>
                            <tr>
                              <th>Agent</th>
                              <th>State</th>
                              <th>Current Work</th>
                              <th>Since</th>
                              <th>Last Update</th>
                              <th>Run ID / Commit</th>
                              <th>Next Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(opsResource.data?.agents ?? []).map((agent) => (
                              <tr key={agent.id}>
                                <td>
                                  <div className="agent-cell">
                                    <Image
                                      src={agentAvatarByName[agent.agent] ?? '/avatars/pinchy.png'}
                                      alt={`${agent.agent} avatar`}
                                      width={24}
                                      height={24}
                                      className="agent-avatar"
                                    />
                                    <span>{agent.agent}</span>
                                  </div>
                                </td>
                                <td><span className={`pill-state ${toneClassByState(agent.state)}`}>{agent.state}</span></td>
                                <td>{agent.currentWork}</td>
                                <td>{agent.since}</td>
                                <td>{agent.lastUpdate}</td>
                                <td><code>{agent.runIdOrCommit}</code></td>
                                <td>{agent.nextAction}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="panel ops-timeline" style={{ marginTop: 14 }}>
                        <div className="row" style={{ marginBottom: 10 }}><strong>Execution Timeline</strong></div>
                        {(opsResource.data?.timeline ?? []).map((event) => (
                          <div key={event.id} className="timeline-item">
                            <div className="muted timeline-time">{event.timestamp}</div>
                            <div>{event.message}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  </ResourceState>
                </div>
              )}

              {activeView === 'Cron Jobs' && (
                <div className="cron-jobs-view">
                  <ResourceState loading={cronJobsResource.loading} error={cronJobsResource.error} isEmpty={cronJobs.length === 0} loadingMessage="Loading cron jobs…" errorMessage={(error) => `Failed to load cron jobs: ${error}`} emptyMessage="No cron jobs available." onRetry={cronJobsResource.reload} loadingClassName="panel muted" errorClassName="panel" emptyClassName="panel muted">
                    <>
                      <div className="ops-metrics">
                        <div className="panel metric-card"><div className="muted">Total</div><strong>{cronMetrics.total}</strong></div>
                        <div className="panel metric-card"><div className="muted">Enabled</div><strong>{cronMetrics.enabled}</strong></div>
                        <div className="panel metric-card"><div className="muted">Disabled</div><strong>{cronMetrics.disabled}</strong></div>
                        <div className="panel metric-card"><div className="muted">Due Soon (&lt;1h)</div><strong>{cronMetrics.dueSoon}</strong></div>
                        <div className="panel metric-card"><div className="muted">Project Temp</div><strong>{cronJobs.filter((job) => job.category === 'project-temp').length}</strong></div>
                      </div>

                      <div className="panel cron-jobs-table-wrap">
                        <div className="row" style={{ marginBottom: 10 }}>
                          <strong>Cron Job Overview</strong>
                          <div className="row" style={{ gap: 8 }}>
                            <button className={`nav-btn ${cronFilter === 'all' ? 'active' : ''}`} onClick={() => setCronFilter('all')}>All</button>
                            <button className={`nav-btn ${cronFilter === 'system' ? 'active' : ''}`} onClick={() => setCronFilter('system')}>System</button>
                            <button className={`nav-btn ${cronFilter === 'project-temp' ? 'active' : ''}`} onClick={() => setCronFilter('project-temp')}>Project Temp</button>
                          </div>
                        </div>

                        <table className="ops-table">
                          <thead>
                            <tr><th>Name</th><th>Category</th><th>Schedule</th><th>Enabled</th><th>Scope / Session Target</th><th>Next Run</th><th>Last Run</th><th>ID</th></tr>
                          </thead>
                          <tbody>
                            {filteredCronJobs.map((job) => (
                              <tr key={job.id}>
                                <td>{job.name}</td>
                                <td>
                                  <span className={`badge ${job.category === 'project-temp' ? 'badge-temp' : ''}`}>
                                    {job.category === 'project-temp' ? 'temporary/tactical' : 'system'}
                                  </span>
                                </td>
                                <td>{job.scheduleSummary}</td>
                                <td><span className={`pill-state ${job.enabled ? 'tone-running' : 'tone-idle'}`}>{job.enabled ? 'enabled' : 'disabled'}</span></td>
                                <td>{job.scopeTarget}</td>
                                <td>{job.nextRunTime ? new Date(job.nextRunTime).toLocaleString('en-US') : 'N/A'}</td>
                                <td>{job.lastRunStatus}</td>
                                <td><code>{job.id.slice(0, 8)}</code></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  </ResourceState>
                </div>
              )}



              {activeView === 'Workspace Projects' && (
                <div className="workspace-projects-view">
                  <ResourceState
                    loading={workspaceProjectsResource.loading}
                    error={workspaceProjectsResource.error}
                    isEmpty={workspaceProjects.length === 0}
                    loadingMessage="Scanning workspace projects…"
                    errorMessage={(error) => `Failed to load workspace projects: ${error}`}
                    emptyMessage="No workspace projects found."
                    onRetry={workspaceProjectsResource.reload}
                    loadingClassName="panel muted"
                    errorClassName="panel"
                    emptyClassName="panel muted"
                  >
                    <>
                      <div className="panel workspace-controls">
                        <div className="row" style={{ gap: 8 }}>
                          <strong>Workspace Projects</strong>
                          <span className="badge">{sortedWorkspaceProjects.length} visible / {workspaceProjects.length} total</span>
                        </div>
                        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                          <select className="control-select" value={workspaceTagFilter} onChange={(event) => setWorkspaceTagFilter(event.target.value as 'all' | WorkspaceProject['tag'])}>
                            <option value="all">All tags</option>
                            <option value="active">active</option>
                            <option value="legacy-candidate">legacy-candidate</option>
                            <option value="experimental">experimental</option>
                          </select>
                          <select className="control-select" value={workspaceRepoFilter} onChange={(event) => setWorkspaceRepoFilter(event.target.value as 'all' | 'git' | 'non-git')}>
                            <option value="all">All repos</option>
                            <option value="git">Git repos</option>
                            <option value="non-git">Non-git</option>
                          </select>
                        </div>
                      </div>

                      <div className="panel workspace-table-wrap">
                        <table className="ops-table workspace-table">
                          <thead>
                            <tr>
                              <th><button className="sort-btn" onClick={() => toggleWorkspaceSort('name')}>Name <ArrowDownUp size={12} /></button></th>
                              <th><button className="sort-btn" onClick={() => toggleWorkspaceSort('lastModified')}>Last Modified <ArrowDownUp size={12} /></button></th>
                              <th><button className="sort-btn" onClick={() => toggleWorkspaceSort('sizeEstimate')}>Size Estimate <ArrowDownUp size={12} /></button></th>
                              <th>Git Summary</th>
                              <th><button className="sort-btn" onClick={() => toggleWorkspaceSort('tag')}>Tag <ArrowDownUp size={12} /></button></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedWorkspaceProjects.map((project) => (
                              <tr key={project.name}>
                                <td><strong>{project.name}</strong></td>
                                <td>{new Date(project.lastModified).toLocaleString('en-US')}</td>
                                <td>{project.sizeEstimate}</td>
                                <td>{project.isGitRepo ? `repo${project.gitBranch ? ` · ${project.gitBranch}` : ''}` : 'not a repo'}</td>
                                <td><span className="badge">{project.tag}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  </ResourceState>
                </div>
              )}

              {activeView === 'Projects' && <div className="projects"><ResourceState loading={projectsResource.loading} error={projectsResource.error} isEmpty={(projectsResource.data ?? []).length === 0} loadingMessage="Loading projects…" errorMessage={(error) => `Failed to load projects: ${error}`} emptyMessage="No projects available." onRetry={projectsResource.reload} loadingClassName="panel project-card" errorClassName="panel project-card" emptyClassName="panel project-card muted">{(projectsResource.data ?? []).map((p) => <div key={p.id} className="panel project-card"><div className="row"><strong>{p.name}</strong><span className="badge">{p.status}</span></div><p className="muted">{p.taskCount} tasks · {p.lastActivity}</p><div className="progress"><div style={{ width: `${p.progress}%` }} /></div></div>)}</ResourceState></div>}

              {activeView === 'Workspace Explorer' && (
                <div className="workspace-explorer">
                  <div className="panel workspace-tree-pane">
                    <div className="row" style={{ marginBottom: 8, gap: 8 }}>
                      <strong>Workspace Explorer</strong>
                      <button className="nav-btn" onClick={workspaceExplorerTreeResource.reload}>Refresh</button>
                    </div>
                    <div className="workspace-search-row">
                      <Search size={14} />
                      <input value={workspaceSearch} onChange={(e) => setWorkspaceSearch(e.target.value)} placeholder="Search file or path..." className="workspace-search" />
                    </div>
                    <ResourceState loading={workspaceExplorerTreeResource.loading} error={workspaceExplorerTreeResource.error} isEmpty={filteredWorkspaceTree.length === 0} loadingMessage="Scanning workspace tree…" errorMessage={(error) => `Failed to load workspace tree: ${error}`} emptyMessage="No files found." onRetry={workspaceExplorerTreeResource.reload} loadingClassName="muted" errorClassName="" emptyClassName="muted">
                      {renderWorkspaceTree(filteredWorkspaceTree)}
                    </ResourceState>
                  </div>

                  <div className="panel workspace-preview-pane">
                    {!selectedWorkspacePath && <EmptyState message="Select a file from the left panel." className="muted" />}
                    {workspacePreviewLoading && <p className="muted">Loading file preview…</p>}
                    {workspacePreviewError && <p className="muted">{workspacePreviewError}</p>}
                    {!workspacePreviewLoading && workspaceFilePreview && (
                      <>
                        <div className="row" style={{ marginBottom: 8 }}>
                          <strong>{workspaceFilePreview.name}</strong>
                          <span className="badge">{workspaceFilePreview.extension ?? 'n/a'}</span>
                        </div>
                        <p className="muted">{workspaceFilePreview.path} · {formatBytes(workspaceFilePreview.size)} · {new Date(workspaceFilePreview.modifiedTime).toLocaleString('en-US')}</p>
                        {workspaceFilePreview.previewSupported ? (
                          <pre className="workspace-markdown-preview">{workspaceFilePreview.content}</pre>
                        ) : (
                          <p className="muted">preview not supported</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeView === 'Memory' && <div className="memory"><div className="panel sidebar-list"><ResourceState loading={memoriesResource.loading} error={memoriesResource.error} isEmpty={dates.length === 0} loadingMessage="Loading memories…" errorMessage={(error) => `Failed to load memories: ${error}`} emptyMessage="No memory dates found." onRetry={memoriesResource.reload} loadingClassName="muted" errorClassName="" emptyClassName="muted">{dates.map((d) => <button key={d} className="nav-btn" style={{ width: '100%', justifyContent: 'flex-start', paddingInline: 8, marginBottom: 6 }} onClick={() => setDate(d)}>{d}</button>)}</ResourceState></div><div className="panel memory-main"><div className="row" style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8 }}><button className="nav-btn" onClick={() => setMemoryTab('Recent')}>Recent</button><button className="nav-btn" onClick={() => setMemoryTab('Long-term')}>Long-term</button></div><span className="badge">{memoryTab}</span></div><ResourceState loading={memoriesResource.loading} error={memoriesResource.error} isEmpty={visibleMemories.length === 0} loadingMessage="Loading memories…" errorMessage={(error) => `Failed to load memories: ${error}`} emptyMessage="No memory entries in this view." onRetry={memoriesResource.reload} loadingClassName="muted" errorClassName="" emptyClassName="muted">{visibleMemories.map((m) => <div key={m.id} className="panel" style={{ padding: 12, marginBottom: 8 }}><div className="muted">{m.timestamp}</div><div>{m.content}</div></div>)}</ResourceState></div></div>}

              {activeView === 'Docs' && <div className="docs"><div className="panel docs-list"><ResourceState loading={docsResource.loading} error={docsResource.error} isEmpty={(docsResource.data ?? []).length === 0} loadingMessage="Loading docs…" errorMessage={(error) => `Failed to load docs: ${error}`} emptyMessage="No docs available." onRetry={docsResource.reload} loadingClassName="muted" errorClassName="" emptyClassName="muted">{(docsResource.data ?? []).map((d) => <div key={d.id} className="panel" style={{ padding: 10, marginBottom: 8, borderColor: docId === d.id ? '#4c8bf5' : '#222' }} onClick={() => setDocId(d.id)}><div className="row"><strong style={{ fontSize: 13 }}>{d.title}</strong><span className="badge">{d.format}</span></div><div className="muted">{d.category} · {d.createdDate}</div><p className="muted">{d.preview}</p></div>)}</ResourceState></div><AnimatePresence mode="wait">{selectedDoc ? <motion.div key={selectedDoc.id} className="panel preview" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}><div className="muted">{selectedDoc.category}</div><h3>{selectedDoc.title}</h3><p>{selectedDoc.preview}</p><div className="muted">Created: {selectedDoc.createdDate}</div></motion.div> : !docsResource.loading && !docsResource.error && <EmptyState message="Select a document to preview." className="panel preview muted" />}</AnimatePresence></div>}

              {activeView === 'Team' && <div className="team"><div className="panel" style={{ padding: 20, textAlign: 'center' }}><em style={{ color: '#8cb4ff' }}>&quot;Operational clarity first: who is running what right now.&quot;</em><p className="muted">Mission statement shifted from board management to live execution visibility.</p></div><div className="team-grid"><ResourceState loading={teamResource.loading} error={teamResource.error} isEmpty={(teamResource.data ?? []).length === 0} loadingMessage="Loading team…" errorMessage={(error) => `Failed to load team: ${error}`} emptyMessage="No team members found." onRetry={teamResource.reload} loadingClassName="panel agent muted" errorClassName="panel agent" emptyClassName="panel agent muted">{(teamResource.data ?? []).map((m) => <div key={m.id} className="panel agent"><div className="row"><strong>{m.name}</strong><span className="badge">{m.status}</span></div><div className="muted">{m.role} · {m.model}</div><div style={{ marginTop: 8 }}>{m.currentTask}</div><div className="muted">{m.deviceInfo}</div></div>)}</ResourceState></div></div>}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}
