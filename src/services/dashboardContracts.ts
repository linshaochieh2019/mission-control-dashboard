import {
  Activity,
  CronJob,
  CronJobCategory,
  CronJobLastRunStatus,
  Document,
  DocumentCategory,
  DocumentFormat,
  MemoryEntry,
  OpsAgentRow,
  OpsMetricStrip,
  OpsPipelineLane,
  OpsSnapshot,
  OpsTimelineEvent,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  TeamMember,
  TeamMemberStatus,
  WorkspaceExplorerNode,
  WorkspaceFilePreview,
  WorkspaceProject,
  WorkspaceProjectTag,
} from '@/src/types'

export interface ApiTask {
  id: string
  title: string
  description: string
  assignee: string
  status: TaskStatus
}

export interface ApiActivity {
  id: string
  timestamp: string
  action: string
}

export interface ApiProject {
  id: string
  name: string
  progress: number
  status: ProjectStatus
  taskCount: number
  lastActivity: string
}

export interface ApiMemoryEntry {
  id: string
  date: string
  timestamp: string
  content: string
  isPinned?: boolean
}

export interface ApiDocument {
  id: string
  title: string
  category: DocumentCategory
  format: DocumentFormat
  createdDate: string
  preview: string
}

export interface ApiTeamMember {
  id: string
  name: string
  role: string
  model: string
  currentTask: string
  status: TeamMemberStatus
  deviceInfo: string
  parentId?: string
}

export interface ApiCronJob {
  id: string
  name: string
  scheduleSummary: string
  enabled: boolean
  scopeTarget: string
  nextRunTime: string | null
  lastRunStatus: CronJobLastRunStatus
  category: CronJobCategory
}

export interface ApiOpsSnapshot {
  metrics: OpsMetricStrip
  agents: OpsAgentRow[]
  timeline: OpsTimelineEvent[]
  lanes: OpsPipelineLane[]
}

export interface ApiWorkspaceProject {
  id: string
  name: string
  path: string
  lastModified: string
  sizeBytes: number
  isGitRepo: boolean
  gitBranch: string | null
  gitStatusSummary: string
  tag: WorkspaceProjectTag
}

export interface ApiWorkspaceExplorerNode {
  path: string
  name: string
  type: 'dir' | 'file'
  extension: string | null
  size: number
  modifiedTime: string
  children?: ApiWorkspaceExplorerNode[]
}

export interface ApiWorkspaceFilePreview {
  path: string
  name: string
  type: 'dir' | 'file'
  extension: string | null
  size: number
  modifiedTime: string
  content: string | null
  previewSupported: boolean
}

export interface DashboardApiContract {
  tasks: ApiTask[]
  activities: ApiActivity[]
  projects: ApiProject[]
  memories: ApiMemoryEntry[]
  docs: ApiDocument[]
  team: ApiTeamMember[]
  cronJobs: ApiCronJob[]
  workspaceProjects?: ApiWorkspaceProject[]
  operations?: ApiOpsSnapshot
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus
}

export type DashboardDataSource = 'local' | 'mock' | 'error'

export interface DashboardApiAdapter {
  getTasks(): Promise<ApiTask[]>
  updateTaskStatus(taskId: ApiTask['id'], payload: UpdateTaskStatusRequest): Promise<ApiTask>
  getActivities(): Promise<ApiActivity[]>
  getProjects(): Promise<ApiProject[]>
  getMemories(): Promise<ApiMemoryEntry[]>
  getDocs(): Promise<ApiDocument[]>
  getTeam(): Promise<ApiTeamMember[]>
  getCronJobs(): Promise<ApiCronJob[]>
  getWorkspaceProjects?(): Promise<ApiWorkspaceProject[]>
  getWorkspaceExplorerTree?(): Promise<ApiWorkspaceExplorerNode[]>
  getWorkspaceFilePreview?(relativePath: string): Promise<ApiWorkspaceFilePreview>
  getOpsSnapshot?(): Promise<ApiOpsSnapshot>
  getSource?(): Promise<DashboardDataSource>
}

export const toTask = (task: ApiTask): Task => ({ ...task })
export const toActivity = (activity: ApiActivity): Activity => ({ ...activity })
export const toProject = (project: ApiProject): Project => ({ ...project })
export const toMemoryEntry = (memory: ApiMemoryEntry): MemoryEntry => ({ ...memory })
export const toDocument = (doc: ApiDocument): Document => ({ ...doc })
export const toTeamMember = (member: ApiTeamMember): TeamMember => ({ ...member })
export const toCronJob = (job: ApiCronJob): CronJob => ({ ...job })
export const toWorkspaceProject = (project: ApiWorkspaceProject): WorkspaceProject => ({ ...project })
export const toWorkspaceExplorerNode = (node: ApiWorkspaceExplorerNode): WorkspaceExplorerNode => ({
  ...node,
  children: node.children?.map(toWorkspaceExplorerNode),
})
export const toWorkspaceFilePreview = (file: ApiWorkspaceFilePreview): WorkspaceFilePreview => ({ ...file })
export const toOpsSnapshot = (snapshot: ApiOpsSnapshot): OpsSnapshot => ({ ...snapshot })
