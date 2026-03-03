import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { mockCalendarEvents, mockTasks } from '@/src/mockData'
import { ApiActivity, ApiCalendarEvent, ApiDocument, ApiMemoryEntry, ApiProject, ApiTask, ApiTeamMember } from '@/src/services/dashboardContracts'

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
  calendarEvents: ApiCalendarEvent[]
  sessions: LocalSessionOverview[]
  subagents: LocalSubagentStatus[]
  warnings: string[]
}

const withFallback = (warnings: string[]): LocalDashboardPayload => ({
  source: warnings.length > 0 ? 'error' : 'mock',
  tasks: structuredClone(mockTasks),
  activities: [],
  projects: [],
  memories: [],
  docs: [],
  team: [],
  calendarEvents: structuredClone(mockCalendarEvents),
  sessions: [],
  subagents: [],
  warnings,
})

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

export const buildLocalDashboardPayload = async (): Promise<LocalDashboardPayload> => {
  const workspaceRoot = resolveWorkspaceRoot()
  const openclawHome = resolveOpenClawHome()
  const warnings: string[] = []

  try {
    const [{ sessions, subagents, activities }, { memories, docs, projects }] = await Promise.all([
      readSessionData(openclawHome),
      readWorkspaceData(workspaceRoot),
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

    return {
      source: 'local',
      tasks: structuredClone(mockTasks),
      activities,
      projects,
      memories,
      docs,
      team,
      calendarEvents: structuredClone(mockCalendarEvents),
      sessions,
      subagents,
      warnings,
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Unknown local-data error')
    return withFallback(warnings)
  }
}
