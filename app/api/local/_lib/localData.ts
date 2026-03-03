import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { mockCronJobs, mockTasks } from '@/src/mockData'
import {
  ApiActivity,
  ApiCronJob,
  ApiDocument,
  ApiMemoryEntry,
  ApiOpsSnapshot,
  ApiProject,
  ApiTask,
  ApiTeamMember,
} from '@/src/services/dashboardContracts'
import { OpsAgentRow, OpsRunState } from '@/src/types'

export type DataSource = 'local' | 'mock' | 'error'

export interface LocalSessionOverview {
  id: string
  startedAt: string
  endedAt: string | null
  requester: string
  label: string
  status: string
}

export interface LocalSubagentStatus {
  id: string
  childSessionKey: string
  requesterSessionKey: string
  status: string
  endedReason?: string
  createdAt: string
}

export interface LocalDashboardPayload {
  source: DataSource
  tasks: ApiTask[]
  activities: ApiActivity[]
  projects: ApiProject[]
  memories: ApiMemoryEntry[]
  docs: ApiDocument[]
  team: ApiTeamMember[]
  cronJobs: ApiCronJob[]
  operations: ApiOpsSnapshot
  sessions: LocalSessionOverview[]
  subagents: LocalSubagentStatus[]
  warnings: string[]
}

const relativeMinutes = (iso?: string | null) => {
  if (!iso) return 'N/A'
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 'N/A'
  const diffMin = Math.max(0, Math.round((Date.now() - ms) / 60000))
  return `${diffMin}m ago`
}

const AGENT_ORDER = ['Pinchy', 'Inky', 'Coral', 'Bloop'] as const

const stateFromRunStatus = (status?: string): OpsRunState => {
  if (status === 'running') return 'Running'
  if (status === 'error' || status === 'failed') return 'Blocked'
  return 'Idle'
}

const buildOpsSnapshot = (tasks: ApiTask[], activities: ApiActivity[], sessions: LocalSessionOverview[], subagents: LocalSubagentStatus[]): ApiOpsSnapshot => {
  const activeRuns = tasks.filter((task) => task.status === 'In Progress').length
  const blockedRuns = tasks.filter((task) => task.status === 'Backlog').length
  const qaRuns = tasks.filter((task) => task.status === 'Review').length
  const completedToday = tasks.filter((task) => task.status === 'Done').length

  const latestRunByAgent = new Map<string, LocalSubagentStatus>()
  for (const run of subagents) {
    const raw = run.childSessionKey.split(':')[1] ?? ''
    const agentName = raw ? `${raw.charAt(0).toUpperCase()}${raw.slice(1)}` : 'Unknown'
    if (!latestRunByAgent.has(agentName)) latestRunByAgent.set(agentName, run)
  }

  const agents: OpsAgentRow[] = AGENT_ORDER.map((agentName) => {
    const run = latestRunByAgent.get(agentName)
    const state = run ? stateFromRunStatus(run.status) : 'Idle'
    const currentWork = state === 'Idle' ? 'NULL' : run?.endedReason ?? 'Running task'
    const since = run?.createdAt ? new Date(run.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
    const lastUpdate = relativeMinutes(run?.createdAt)

    return {
      id: `ops-agent-${agentName.toLowerCase()}`,
      agent: agentName,
      state,
      currentWork,
      since,
      lastUpdate,
      runIdOrCommit: run?.id ?? 'N/A',
      nextAction: state === 'Running' ? 'Continue execution' : state === 'Blocked' ? 'Resolve blocker' : state === 'Waiting QA' ? 'Need QA verification' : 'Await assignment',
    }
  })

  const latestDeployRun = sessions.find((session) => session.status === 'ok')

  return {
    metrics: {
      activeRuns,
      blockedRuns,
      qaPassRateToday: qaRuns + completedToday === 0 ? 100 : Math.round((completedToday / (qaRuns + completedToday)) * 100),
      medianCycleTimeHours: 4.6,
      lastSuccessfulDeployCommit: latestDeployRun?.id.slice(0, 8) ?? 'N/A',
    },
    agents,
    timeline: activities
      .slice(0, 15)
      .map((activity, idx) => ({ id: `timeline-${idx}-${activity.id}`, timestamp: activity.timestamp, message: activity.action, severity: idx === 0 ? 'success' : 'info' })),
    lanes: [
      { id: 'coding', title: 'Coding', count: activeRuns, items: tasks.filter((task) => task.status === 'In Progress').map((task) => `${task.assignee} · ${task.title}`) },
      { id: 'qa', title: 'QA', count: qaRuns, items: tasks.filter((task) => task.status === 'Review').map((task) => `${task.assignee} · ${task.title}`) },
      { id: 'fix-required', title: 'Fix Required', count: blockedRuns, items: tasks.filter((task) => task.status === 'Backlog').map((task) => `${task.assignee} · ${task.title}`) },
      { id: 'completed-today', title: 'Completed Today', count: completedToday, items: tasks.filter((task) => task.status === 'Done').map((task) => `${task.assignee} · ${task.title}`) },
    ],
  }
}

const withFallback = (warnings: string[]): LocalDashboardPayload => {
  const tasks = structuredClone(mockTasks)
  const activities: ApiActivity[] = []
  const sessions: LocalSessionOverview[] = []

  return {
    source: warnings.length > 0 ? 'error' : 'mock',
    tasks,
    activities,
    projects: [],
    memories: [],
    docs: [],
    team: [],
    cronJobs: structuredClone(mockCronJobs),
    operations: buildOpsSnapshot(tasks, activities, sessions, []),
    sessions,
    subagents: [],
    warnings,
  }
}

const resolveWorkspaceRoot = () => process.env.OPENCLAW_WORKSPACE_ROOT ?? path.resolve(process.cwd(), '..')
const resolveOpenClawHome = () => process.env.OPENCLAW_HOME ?? path.join(os.homedir(), '.openclaw')

const safeReadJson = async <T>(filePath: string): Promise<T | null> => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

const toTimestamp = (value: number | undefined) => (value ? new Date(value).toISOString() : '')

type RawCronJob = {
  id?: string
  name?: string
  enabled?: boolean
  sessionKey?: string
  sessionTarget?: string
  schedule?: { kind?: string; expr?: string; tz?: string; atMs?: number; everyMs?: number }
  state?: { nextRunAtMs?: number; lastRunStatus?: string; lastStatus?: string }
  payload?: { message?: string }
}

const scheduleSummary = (job: RawCronJob) => {
  const schedule = job.schedule ?? {}
  if (schedule.kind === 'cron' && schedule.expr) {
    return `${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ''}`
  }
  if (schedule.kind === 'at' && schedule.atMs) {
    return `One-shot at ${new Date(schedule.atMs).toLocaleString('en-US')}`
  }
  if (schedule.everyMs) {
    const minutes = Math.round(schedule.everyMs / 60000)
    return `Every ${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  return schedule.kind ?? 'Unknown schedule'
}

const categorizeCronJob = (job: RawCronJob): ApiCronJob['category'] => {
  const name = `${job.name ?? ''} ${job.payload?.message ?? ''}`.toLowerCase()
  const expr = (job.schedule?.expr ?? '').toLowerCase()
  const isFastTick = /\*\/([0-2]?\d)/.test(expr)
  const looksTemporary = /temp|temporary|tactical|tick|warmup|experiment|trial/.test(name)
  const isolatedSession = job.sessionTarget === 'isolated'
  if (looksTemporary || isFastTick || (isolatedSession && /15|30/.test(expr))) return 'project-temp'
  return 'system'
}

const normalizeLastRunStatus = (job: RawCronJob): ApiCronJob['lastRunStatus'] => {
  const status = (job.state?.lastRunStatus ?? job.state?.lastStatus ?? 'unknown').toLowerCase()
  if (status === 'ok' || status === 'error' || status === 'running') return status
  return 'unknown'
}

const readCronJobs = async (openclawHome: string): Promise<ApiCronJob[]> => {
  const jobsPath = path.join(openclawHome, 'cron', 'jobs.json')
  const payload = await safeReadJson<{ jobs?: RawCronJob[] }>(jobsPath)
  const jobs = payload?.jobs ?? []

  return jobs.map((job) => ({
    id: String(job.id ?? crypto.randomUUID()),
    name: String(job.name ?? 'Unnamed cron job'),
    scheduleSummary: scheduleSummary(job),
    enabled: Boolean(job.enabled),
    scopeTarget: String(job.sessionKey ?? job.sessionTarget ?? 'unknown'),
    nextRunTime: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : null,
    lastRunStatus: normalizeLastRunStatus(job),
    category: categorizeCronJob(job),
  }))
}

const RECENT_WINDOW_MS = 2 * 60 * 60 * 1000

const readSessionData = async (openclawHome: string) => {
  const runsPath = path.join(openclawHome, 'subagents', 'runs.json')
  const payload = await safeReadJson<{ runs?: Record<string, Record<string, unknown>> }>(runsPath)
  const allRuns = Object.values(payload?.runs ?? {})
  const now = Date.now()
  const runs = allRuns.filter((run) => {
    const startedAt = Number((run.startedAt as number) ?? 0)
    const endedAt = Number((run.endedAt as number) ?? 0)
    const ts = startedAt || endedAt
    return ts > 0 && now - ts <= RECENT_WINDOW_MS
  })

  const sessions: LocalSessionOverview[] = runs
    .sort((a, b) => Number((b.startedAt as number) ?? 0) - Number((a.startedAt as number) ?? 0))
    .slice(0, 12)
    .map((run) => ({
      id: String(run.runId ?? run.childSessionKey ?? crypto.randomUUID()),
      startedAt: toTimestamp(run.startedAt as number | undefined),
      endedAt: run.endedAt ? toTimestamp(run.endedAt as number) : null,
      requester: String(run.requesterDisplayKey ?? run.requesterSessionKey ?? 'unknown'),
      label: String(run.label ?? 'subagent-run'),
      status: String((run.outcome as { status?: string } | undefined)?.status ?? 'running'),
    }))

  const subagents: LocalSubagentStatus[] = runs
    .sort((a, b) => Number((b.createdAt as number) ?? 0) - Number((a.createdAt as number) ?? 0))
    .slice(0, 12)
    .map((run) => ({
      id: String(run.runId ?? crypto.randomUUID()),
      childSessionKey: String(run.childSessionKey ?? 'unknown'),
      requesterSessionKey: String(run.requesterSessionKey ?? 'unknown'),
      status: String((run.outcome as { status?: string } | undefined)?.status ?? 'running'),
      endedReason: run.endedReason ? String(run.endedReason) : undefined,
      createdAt: toTimestamp(run.createdAt as number | undefined),
    }))

  const activities: ApiActivity[] = sessions.map((session) => ({
    id: `session-${session.id}`,
    timestamp: new Date(session.startedAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    action: `${session.label} · ${session.status} · ${session.requester}`,
  }))

  return { sessions, subagents, activities }
}

const summarizeText = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 140)

const readWorkspaceData = async (workspaceRoot: string) => {
  const memoryDir = path.join(workspaceRoot, 'memory')
  const docsDir = path.join(workspaceRoot, 'docs')

  const memoryEntries = await fs.readdir(memoryDir).catch(() => [])
  const memoryFiles = memoryEntries.filter((name) => name.endsWith('.md')).sort().reverse().slice(0, 8)

  const memories: ApiMemoryEntry[] = await Promise.all(
    memoryFiles.map(async (name, index) => {
      const filePath = path.join(memoryDir, name)
      const content = await fs.readFile(filePath, 'utf8').catch(() => '')
      const firstLine = summarizeText(content.split('\n').find((line) => line.trim()) ?? 'No content')
      const date = name.replace(/\.md$/, '')
      return {
        id: `mem-${index}-${name}`,
        date,
        timestamp: date,
        content: firstLine,
        isPinned: index === 0,
      }
    }),
  )

  const docCandidates = [
    ...(await fs.readdir(docsDir).catch(() => [])).map((name) => path.join(docsDir, name)),
    'AGENTS.md',
    'SOUL.md',
    'USER.md',
    'MEMORY.md',
    'HEARTBEAT.md',
  ].map((item) => (path.isAbsolute(item) ? item : path.join(workspaceRoot, item)))

  const docs: ApiDocument[] = (
    await Promise.all(
      docCandidates.map(async (filePath) => {
        try {
          const stat = await fs.stat(filePath)
          if (!stat.isFile()) return null
          const content = await fs.readFile(filePath, 'utf8')
          const ext = path.extname(filePath).toLowerCase()
          const createdDate = stat.mtime.toISOString().slice(0, 10)
          return {
            id: `doc-${path.basename(filePath)}`,
            title: path.basename(filePath),
            category: filePath.includes('/docs/') ? 'Planning' : 'Research',
            format: ext === '.md' ? 'MD' : 'PDF',
            createdDate,
            preview: summarizeText(content || 'No preview available'),
          } as ApiDocument
        } catch {
          return null
        }
      }),
    )
  )
    .filter((item): item is ApiDocument => Boolean(item))
    .slice(0, 12)

  const projects: ApiProject[] = [
    {
      id: 'workspace-memory',
      name: 'Workspace Memory Health',
      progress: Math.min(100, memories.length * 12),
      status: 'Active',
      taskCount: memories.length,
      lastActivity: memories[0]?.date ?? 'N/A',
    },
    {
      id: 'workspace-docs',
      name: 'Workspace Docs Coverage',
      progress: Math.min(100, docs.length * 8),
      status: 'Active',
      taskCount: docs.length,
      lastActivity: docs[0]?.createdDate ?? 'N/A',
    },
  ]

  return { memories, docs, projects }
}

const toTaskStatus = (status: string): ApiTask['status'] => {
  if (status === 'ok') return 'Done'
  if (status === 'running') return 'In Progress'
  if (status === 'error' || status === 'failed') return 'Review'
  return 'Backlog'
}

const buildLiveTasks = (sessions: LocalSessionOverview[], subagents: LocalSubagentStatus[]): ApiTask[] => {
  const fromSubagents: ApiTask[] = subagents.slice(0, 8).map((run, index) => ({
    id: `task-subagent-${run.id}`,
    title: `Subagent ${run.childSessionKey.split(':')[1] ?? index + 1}`,
    description: run.endedReason ? `Latest status: ${run.endedReason}` : 'Awaiting final status',
    assignee: (run.childSessionKey.split(':')[1] ?? 'A').slice(0, 1).toUpperCase(),
    status: toTaskStatus(run.status),
  }))

  const reviewCandidate = sessions.find((s) => s.status !== 'ok')
  const reviewTask: ApiTask[] = reviewCandidate
    ? [
        {
          id: `task-review-${reviewCandidate.id}`,
          title: 'Review abnormal run outcome',
          description: `${reviewCandidate.label} finished with status ${reviewCandidate.status}`,
          assignee: 'P',
          status: 'Review',
        },
      ]
    : []

  return [...fromSubagents, ...reviewTask].slice(0, 10)
}

export const buildLocalCronJobsPayload = async () => {
  const openclawHome = resolveOpenClawHome()
  const jobs = await readCronJobs(openclawHome)
  return {
    source: jobs.length > 0 ? ('local' as const) : ('mock' as const),
    cronJobs: jobs.length > 0 ? jobs : structuredClone(mockCronJobs),
  }
}

export const buildLocalDashboardPayload = async (): Promise<LocalDashboardPayload> => {
  const workspaceRoot = resolveWorkspaceRoot()
  const openclawHome = resolveOpenClawHome()
  const warnings: string[] = []

  try {
    const [{ sessions, subagents, activities }, { memories, docs, projects }, cronJobs] = await Promise.all([
      readSessionData(openclawHome),
      readWorkspaceData(workspaceRoot),
      readCronJobs(openclawHome),
    ])

    const team: ApiTeamMember[] = subagents.slice(0, 6).map((item, index) => ({
      id: item.id,
      name: item.childSessionKey.split(':')[1] ?? `agent-${index + 1}`,
      role: 'Subagent',
      model: 'openclaw-runtime',
      currentTask: item.endedReason ? `Ended: ${item.endedReason}` : 'Running task',
      status: item.status === 'ok' ? 'idle' : 'active',
      deviceInfo: item.requesterSessionKey,
    }))

    const tasks = buildLiveTasks(sessions, subagents)
    const effectiveTasks = tasks.length > 0 ? tasks : structuredClone(mockTasks)

    return {
      source: 'local',
      tasks: effectiveTasks,
      activities,
      projects,
      memories,
      docs,
      team,
      cronJobs: cronJobs.length > 0 ? cronJobs : structuredClone(mockCronJobs),
      operations: buildOpsSnapshot(effectiveTasks, activities, sessions, subagents),
      sessions,
      subagents,
      warnings,
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Unknown local-data error')
    return withFallback(warnings)
  }
}
