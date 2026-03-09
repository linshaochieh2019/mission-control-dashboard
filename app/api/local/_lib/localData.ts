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
  ApiWorkspaceProject,
} from '@/src/services/dashboardContracts'
import { OpsAgentRow, OpsRunState, TaskStatus, WorkspaceProjectTag } from '@/src/types'

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
  workspaceProjects: ApiWorkspaceProject[]
  operations: ApiOpsSnapshot
  sessions: LocalSessionOverview[]
  subagents: LocalSubagentStatus[]
  warnings: string[]
}

const statusToOpsState = (status: TaskStatus): OpsRunState => {
  if (status === 'In Progress') return 'Running'
  if (status === 'Review') return 'Waiting QA'
  if (status === 'Backlog') return 'Blocked'
  return 'Idle'
}

const buildOpsSnapshot = (tasks: ApiTask[], activities: ApiActivity[], sessions: LocalSessionOverview[]): ApiOpsSnapshot => {
  const activeRuns = tasks.filter((task) => task.status === 'In Progress').length
  const blockedRuns = tasks.filter((task) => task.status === 'Backlog').length
  const qaRuns = tasks.filter((task) => task.status === 'Review').length
  const completedToday = tasks.filter((task) => task.status === 'Done').length

  const agents: OpsAgentRow[] = tasks.slice(0, 10).map((task, index) => {
    const linkedSession = sessions[index]
    return {
      id: `ops-${task.id}`,
      agent: task.assignee,
      currentWork: task.title,
      state: statusToOpsState(task.status),
      since: linkedSession?.startedAt ? new Date(linkedSession.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      lastUpdate: `${2 + index}m ago`,
      runIdOrCommit: linkedSession?.id ?? `task-${task.id}`,
      nextAction: task.status === 'Review' ? 'Need QA verification' : task.status === 'Backlog' ? 'Resolve blocker' : 'Continue execution',
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
    workspaceProjects: [],
    operations: buildOpsSnapshot(tasks, activities, sessions),
    sessions,
    subagents: [],
    warnings,
  }
}

const resolveWorkspaceRoot = () => process.env.OPENCLAW_WORKSPACE_ROOT ?? path.resolve(process.cwd(), '..')
const resolveWorkspaceProjectsRoot = () => process.env.OPENCLAW_WORKSPACE_COLLECTION_ROOT ?? path.join(os.homedir(), '.openclaw', 'workspace')
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

const readSessionData = async (openclawHome: string) => {
  const runsPath = path.join(openclawHome, 'subagents', 'runs.json')
  const payload = await safeReadJson<{ runs?: Record<string, Record<string, unknown>> }>(runsPath)
  const runs = Object.values(payload?.runs ?? {})

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

const NOISE_DIRS = new Set(['node_modules', '.git', '.next', '.DS_Store', 'dist', 'build', '.turbo', '.cache'])

const estimateDirectorySize = async (targetPath: string, depth = 0): Promise<number> => {
  if (depth > 3) return 0
  const entries = await fs.readdir(targetPath, { withFileTypes: true }).catch(() => [])
  let total = 0

  for (const entry of entries) {
    if (NOISE_DIRS.has(entry.name)) continue
    if (entry.name.startsWith('.') && entry.name !== '.github') continue

    const fullPath = path.join(targetPath, entry.name)
    if (entry.isFile()) {
      const stat = await fs.stat(fullPath).catch(() => null)
      total += stat?.size ?? 0
      continue
    }

    if (entry.isDirectory()) {
      total += await estimateDirectorySize(fullPath, depth + 1)
    }
  }

  return total
}

const summarizeGitStatus = async (projectPath: string): Promise<{ isGitRepo: boolean; gitBranch: string | null; gitStatusSummary: string }> => {
  const gitDir = path.join(projectPath, '.git')
  const isGitRepo = Boolean(await fs.stat(gitDir).catch(() => null))
  if (!isGitRepo) return { isGitRepo: false, gitBranch: null, gitStatusSummary: 'not a git repo' }

  const headContent = await fs.readFile(path.join(gitDir, 'HEAD'), 'utf8').catch(() => '')
  const branchMatch = headContent.match(/ref:\s+refs\/heads\/(.+)/)
  const gitBranch = branchMatch?.[1] ?? 'detached'

  const statusOutput = await fs.readFile(path.join(gitDir, 'FETCH_HEAD'), 'utf8').catch(() => '')
  const indexStat = await fs.stat(path.join(gitDir, 'index')).catch(() => null)
  const recentlyTouched = indexStat && Date.now() - indexStat.mtimeMs < 1000 * 60 * 60 * 24 * 3
  const hasFetch = statusOutput.trim().length > 0
  const gitStatusSummary = recentlyTouched ? 'recent activity' : hasFetch ? 'tracked' : 'clean'

  return { isGitRepo: true, gitBranch, gitStatusSummary }
}

const classifyProjectTag = (name: string, mtimeMs: number, gitSummary: { isGitRepo: boolean; gitStatusSummary: string }): WorkspaceProjectTag => {
  const lower = name.toLowerCase()
  if (/exp|sandbox|playground|prototype|poc|lab/.test(lower)) return 'experimental'

  const ageDays = (Date.now() - mtimeMs) / (1000 * 60 * 60 * 24)
  if (ageDays > 90) return 'legacy-candidate'
  if (!gitSummary.isGitRepo && ageDays > 45) return 'legacy-candidate'
  if (gitSummary.gitStatusSummary === 'recent activity') return 'active'

  return ageDays < 30 ? 'active' : 'legacy-candidate'
}

const readWorkspaceProjects = async (workspaceProjectsRoot: string): Promise<ApiWorkspaceProject[]> => {
  const entries = await fs.readdir(workspaceProjectsRoot, { withFileTypes: true }).catch(() => [])
  const candidates = entries.filter((entry) => {
    if (!entry.isDirectory()) return false
    if (NOISE_DIRS.has(entry.name)) return false
    if (entry.name.startsWith('.')) return entry.name === '.github'
    return true
  })

  const projects = await Promise.all(
    candidates.map(async (entry) => {
      const projectPath = path.join(workspaceProjectsRoot, entry.name)
      const stat = await fs.stat(projectPath).catch(() => null)
      if (!stat?.isDirectory()) return null

      const [sizeBytes, gitStatus] = await Promise.all([estimateDirectorySize(projectPath), summarizeGitStatus(projectPath)])
      return {
        id: `workspace-${entry.name}`,
        name: entry.name,
        path: projectPath,
        lastModified: stat.mtime.toISOString(),
        sizeBytes,
        isGitRepo: gitStatus.isGitRepo,
        gitBranch: gitStatus.gitBranch,
        gitStatusSummary: gitStatus.gitStatusSummary,
        tag: classifyProjectTag(entry.name, stat.mtimeMs, gitStatus),
      } as ApiWorkspaceProject
    }),
  )

  return projects.filter((item): item is ApiWorkspaceProject => Boolean(item))
}

export interface LocalWorkspaceExplorerNode {
  path: string
  name: string
  type: 'dir' | 'file'
  extension: string | null
  size: number
  modifiedTime: string
  children?: LocalWorkspaceExplorerNode[]
}

const EXPLORER_EXCLUDED_DIRS = new Set([
  ...NOISE_DIRS,
  'coverage',
  'tmp',
  'temp',
  'target',
  'bin',
  'obj',
])

const shouldSkipEntry = (name: string, isDirectory: boolean) => {
  if (EXPLORER_EXCLUDED_DIRS.has(name)) return true
  if (name.startsWith('.')) {
    if (name === '.github') return false
    return true
  }

  if (isDirectory && /^(tmp|temp|cache)/i.test(name)) return true
  return false
}

const toRelativePath = (absolutePath: string, workspaceRoot: string) => path.relative(workspaceRoot, absolutePath).replaceAll(path.sep, '/')

const buildWorkspaceExplorerTree = async (absoluteDir: string, workspaceRoot: string, depth = 0): Promise<LocalWorkspaceExplorerNode[]> => {
  if (depth > 8) return []

  const entries = await fs.readdir(absoluteDir, { withFileTypes: true }).catch(() => [])
  const nodes = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(absoluteDir, entry.name)
      if (shouldSkipEntry(entry.name, entry.isDirectory())) return null

      const stat = await fs.stat(fullPath).catch(() => null)
      if (!stat) return null

      const relativePath = toRelativePath(fullPath, workspaceRoot)

      if (entry.isDirectory()) {
        const children = await buildWorkspaceExplorerTree(fullPath, workspaceRoot, depth + 1)
        return {
          path: relativePath,
          name: entry.name,
          type: 'dir' as const,
          extension: null,
          size: 0,
          modifiedTime: stat.mtime.toISOString(),
          children,
        }
      }

      if (!entry.isFile()) return null
      const extension = path.extname(entry.name).slice(1).toLowerCase() || null
      return {
        path: relativePath,
        name: entry.name,
        type: 'file' as const,
        extension,
        size: stat.size,
        modifiedTime: stat.mtime.toISOString(),
      }
    }),
  )

  return nodes
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.type !== b!.type) return a!.type === 'dir' ? -1 : 1
      return a!.name.localeCompare(b!.name)
    }) as LocalWorkspaceExplorerNode[]
}

const resolveWorkspaceAbsolutePath = (workspaceRoot: string, relativePath: string) => {
  const safeRelativePath = relativePath.replace(/^\/+/, '')
  const absolutePath = path.resolve(workspaceRoot, safeRelativePath)
  const normalizedRoot = path.resolve(workspaceRoot)

  if (!absolutePath.startsWith(normalizedRoot)) {
    throw new Error('Invalid workspace path')
  }

  return absolutePath
}

export const readWorkspaceExplorerTree = async (workspaceRoot = resolveWorkspaceRoot()) => buildWorkspaceExplorerTree(workspaceRoot, workspaceRoot)

export const readWorkspaceFilePreview = async (relativePath: string, workspaceRoot = resolveWorkspaceRoot()) => {
  const absolutePath = resolveWorkspaceAbsolutePath(workspaceRoot, relativePath)
  const stat = await fs.stat(absolutePath)
  const extension = path.extname(absolutePath).slice(1).toLowerCase() || null
  const name = path.basename(absolutePath)

  if (!stat.isFile()) {
    return {
      path: toRelativePath(absolutePath, workspaceRoot),
      name,
      type: 'dir' as const,
      extension: null,
      size: 0,
      modifiedTime: stat.mtime.toISOString(),
      content: null,
      previewSupported: false,
    }
  }

  const isMarkdown = extension === 'md' || extension === 'markdown'
  const content = isMarkdown ? await fs.readFile(absolutePath, 'utf8') : null

  return {
    path: toRelativePath(absolutePath, workspaceRoot),
    name,
    type: 'file' as const,
    extension,
    size: stat.size,
    modifiedTime: stat.mtime.toISOString(),
    content,
    previewSupported: isMarkdown,
  }
}

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

const buildLiveTasks = (sessions: LocalSessionOverview[], subagents: LocalSubagentStatus[], docs: ApiDocument[]): ApiTask[] => {
  const fromSubagents: ApiTask[] = subagents.slice(0, 6).map((run, index) => ({
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

  const docsTask: ApiTask[] = docs.slice(0, 2).map((doc) => ({
    id: `task-doc-${doc.id}`,
    title: `Review ${doc.title}`,
    description: `Keep ${doc.title} aligned with current execution state`,
    assignee: 'J',
    status: 'Backlog',
  }))

  return [...fromSubagents, ...reviewTask, ...docsTask].slice(0, 10)
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
  const workspaceProjectsRoot = resolveWorkspaceProjectsRoot()
  const openclawHome = resolveOpenClawHome()
  const warnings: string[] = []

  try {
    const [{ sessions, subagents, activities }, { memories, docs, projects }, cronJobs, workspaceProjects] = await Promise.all([
      readSessionData(openclawHome),
      readWorkspaceData(workspaceRoot),
      readCronJobs(openclawHome),
      readWorkspaceProjects(workspaceProjectsRoot),
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

    const tasks = buildLiveTasks(sessions, subagents, docs)
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
      workspaceProjects,
      operations: buildOpsSnapshot(effectiveTasks, activities, sessions),
      sessions,
      subagents,
      warnings,
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Unknown local-data error')
    return withFallback(warnings)
  }
}
