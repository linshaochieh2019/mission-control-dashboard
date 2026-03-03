export type AppView = 'Live Agent Operations' | 'Cron Jobs' | 'Projects' | 'Memory' | 'Docs' | 'Team'

export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done'

export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  status: TaskStatus
}

export interface Activity {
  id: string
  timestamp: string
  action: string
}

export type ProjectStatus = 'Active' | 'Planning' | 'Paused'

export interface Project {
  id: string
  name: string
  progress: number
  status: ProjectStatus
  taskCount: number
  lastActivity: string
}

export interface MemoryEntry {
  id: string
  date: string
  timestamp: string
  content: string
  isPinned?: boolean
}

export type DocumentCategory = 'Planning' | 'PRD' | 'Newsletter' | 'Architecture' | 'Research'
export type DocumentFormat = 'MD' | 'PDF'

export interface Document {
  id: string
  title: string
  category: DocumentCategory
  format: DocumentFormat
  createdDate: string
  preview: string
}

export type TeamMemberStatus = 'active' | 'idle'

export interface TeamMember {
  id: string
  name: string
  role: string
  model: string
  currentTask: string
  status: TeamMemberStatus
  deviceInfo: string
  parentId?: string
}

export type CronJobCategory = 'system' | 'project-temp'
export type CronJobLastRunStatus = 'ok' | 'error' | 'running' | 'unknown'

export interface CronJob {
  id: string
  name: string
  scheduleSummary: string
  enabled: boolean
  scopeTarget: string
  nextRunTime: string | null
  lastRunStatus: CronJobLastRunStatus
  category: CronJobCategory
}

export type OpsRunState = 'Running' | 'Waiting QA' | 'Blocked' | 'Idle'

export interface OpsMetricStrip {
  activeRuns: number
  blockedRuns: number
  qaPassRateToday: number
  medianCycleTimeHours: number
  lastSuccessfulDeployCommit: string
}

export interface OpsAgentRow {
  id: string
  agent: string
  currentWork: string
  state: OpsRunState
  since: string
  lastUpdate: string
  runIdOrCommit: string
  nextAction: string
}

export interface OpsTimelineEvent {
  id: string
  timestamp: string
  message: string
  severity?: 'info' | 'warning' | 'success'
}

export interface OpsPipelineLane {
  id: 'coding' | 'qa' | 'fix-required' | 'completed-today'
  title: 'Coding' | 'QA' | 'Fix Required' | 'Completed Today'
  count: number
  items: string[]
}

export interface OpsSnapshot {
  metrics: OpsMetricStrip
  agents: OpsAgentRow[]
  timeline: OpsTimelineEvent[]
  lanes: OpsPipelineLane[]
}
