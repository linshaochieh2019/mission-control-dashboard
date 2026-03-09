import { mockActivities, mockCronJobs, mockDocs, mockMemories, mockOpsSnapshot, mockProjects, mockTasks, mockTeam } from '@/src/mockData'
import { ApiDashboardAdapter } from '@/src/services/apiDashboardAdapter'
import { LocalDashboardAdapter } from '@/src/services/localDashboardAdapter'
import {
  ApiActivity,
  ApiOpsSnapshot,
  ApiTask,
  DashboardApiAdapter,
  DashboardDataSource,
  toActivity,
  toCronJob,
  toDocument,
  toMemoryEntry,
  toOpsSnapshot,
  toProject,
  toTask,
  toTeamMember,
  toWorkspaceExplorerNode,
  toWorkspaceFilePreview,
  toWorkspaceProject,
} from '@/src/services/dashboardContracts'
import { Activity, CronJob, Document, MemoryEntry, OpsAgentRow, OpsRunState, OpsSnapshot, Project, Task, TaskStatus, TeamMember, WorkspaceExplorerNode, WorkspaceFilePreview, WorkspaceProject } from '@/src/types'

export interface DashboardDataService {
  getTasks(): Promise<Task[]>
  updateTaskStatus(taskId: Task['id'], status: Task['status']): Promise<Task>
  getActivities(): Promise<Activity[]>
  getProjects(): Promise<Project[]>
  getMemories(): Promise<MemoryEntry[]>
  getDocs(): Promise<Document[]>
  getTeam(): Promise<TeamMember[]>
  getCronJobs(): Promise<CronJob[]>
  getWorkspaceProjects(): Promise<WorkspaceProject[]>
  getWorkspaceExplorerTree(): Promise<WorkspaceExplorerNode[]>
  getWorkspaceFilePreview(relativePath: string): Promise<WorkspaceFilePreview>
  getOpsSnapshot(): Promise<OpsSnapshot>
  getSource(): Promise<DashboardDataSource>
}

const resolveWithLatency = async <T>(value: T, delayMs = 120): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  return structuredClone(value)
}

const deriveStateFromTaskStatus = (status: TaskStatus): OpsRunState => {
  if (status === 'In Progress') return 'Running'
  if (status === 'Review') return 'Waiting QA'
  if (status === 'Backlog') return 'Blocked'
  return 'Idle'
}

const deriveOpsSnapshot = (tasks: ApiTask[], activities: ApiActivity[]): ApiOpsSnapshot => {
  const activeRuns = tasks.filter((task) => task.status === 'In Progress').length
  const blockedRuns = tasks.filter((task) => task.status === 'Backlog').length
  const reviewedToday = tasks.filter((task) => task.status === 'Review').length
  const completedToday = tasks.filter((task) => task.status === 'Done').length
  const qaPassRateToday = reviewedToday + completedToday === 0 ? 100 : Math.round((completedToday / (reviewedToday + completedToday)) * 100)

  const agents: OpsAgentRow[] = tasks.slice(0, 8).map((task, index) => ({
    id: `agent-row-${task.id}`,
    agent: task.assignee,
    currentWork: task.title,
    state: deriveStateFromTaskStatus(task.status),
    since: `${9 + (index % 6)}:${String((index * 11) % 60).padStart(2, '0')}`,
    lastUpdate: `${2 + index}m ago`,
    runIdOrCommit: `run-${task.id}`,
    nextAction: task.status === 'Review' ? 'Await QA signal' : task.status === 'Backlog' ? 'Unblock requirements' : 'Continue execution',
  }))

  return {
    metrics: {
      activeRuns,
      blockedRuns,
      qaPassRateToday,
      medianCycleTimeHours: 4.8,
      lastSuccessfulDeployCommit: 'local-mode',
    },
    agents,
    timeline: activities.slice(0, 12).map((activity) => ({
      id: activity.id,
      timestamp: activity.timestamp,
      message: activity.action,
      severity: 'info',
    })),
    lanes: [
      { id: 'coding', title: 'Coding', count: activeRuns, items: tasks.filter((task) => task.status === 'In Progress').map((task) => task.title) },
      { id: 'qa', title: 'QA', count: reviewedToday, items: tasks.filter((task) => task.status === 'Review').map((task) => task.title) },
      { id: 'fix-required', title: 'Fix Required', count: blockedRuns, items: tasks.filter((task) => task.status === 'Backlog').map((task) => task.title) },
      { id: 'completed-today', title: 'Completed Today', count: completedToday, items: tasks.filter((task) => task.status === 'Done').map((task) => task.title) },
    ],
  }
}

export class MockDashboardDataService implements DashboardDataService {
  private tasks = structuredClone(mockTasks)

  getTasks() {
    return resolveWithLatency(this.tasks)
  }

  async updateTaskStatus(taskId: Task['id'], status: TaskStatus) {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId)

    if (taskIndex === -1) {
      throw new Error('Task not found')
    }

    this.tasks[taskIndex] = { ...this.tasks[taskIndex], status }
    return resolveWithLatency(this.tasks[taskIndex], 180)
  }

  getActivities() {
    return resolveWithLatency(mockActivities)
  }

  getProjects() {
    return resolveWithLatency(mockProjects)
  }

  getMemories() {
    return resolveWithLatency(mockMemories)
  }

  getDocs() {
    return resolveWithLatency(mockDocs)
  }

  getTeam() {
    return resolveWithLatency(mockTeam)
  }

  getCronJobs() {
    return resolveWithLatency(mockCronJobs)
  }

  getWorkspaceProjects() {
    return resolveWithLatency([])
  }

  getWorkspaceExplorerTree() {
    return resolveWithLatency([])
  }

  getWorkspaceFilePreview(relativePath: string) {
    return resolveWithLatency({
      path: relativePath,
      name: relativePath.split('/').pop() ?? relativePath,
      type: 'file' as const,
      extension: relativePath.split('.').pop() ?? null,
      size: 0,
      modifiedTime: new Date().toISOString(),
      content: null,
      previewSupported: false,
    })
  }

  getOpsSnapshot() {
    return resolveWithLatency(mockOpsSnapshot)
  }

  getSource() {
    return resolveWithLatency<DashboardDataSource>('mock', 0)
  }
}

export class ApiDashboardDataService implements DashboardDataService {
  constructor(private readonly adapter: DashboardApiAdapter) {}

  async getTasks() {
    return (await this.adapter.getTasks()).map(toTask)
  }

  async updateTaskStatus(taskId: Task['id'], status: TaskStatus) {
    return toTask(await this.adapter.updateTaskStatus(taskId, { status }))
  }

  async getActivities() {
    return (await this.adapter.getActivities()).map(toActivity)
  }

  async getProjects() {
    return (await this.adapter.getProjects()).map(toProject)
  }

  async getMemories() {
    return (await this.adapter.getMemories()).map(toMemoryEntry)
  }

  async getDocs() {
    return (await this.adapter.getDocs()).map(toDocument)
  }

  async getTeam() {
    return (await this.adapter.getTeam()).map(toTeamMember)
  }

  async getCronJobs() {
    return (await this.adapter.getCronJobs()).map(toCronJob)
  }

  async getWorkspaceProjects() {
    return (await this.adapter.getWorkspaceProjects?.() ?? []).map(toWorkspaceProject)
  }

  async getWorkspaceExplorerTree() {
    return (await this.adapter.getWorkspaceExplorerTree?.() ?? []).map(toWorkspaceExplorerNode)
  }

  async getWorkspaceFilePreview(relativePath: string) {
    if (!this.adapter.getWorkspaceFilePreview) {
      throw new Error('Workspace file preview is not available for this data source')
    }

    return toWorkspaceFilePreview(await this.adapter.getWorkspaceFilePreview(relativePath))
  }

  async getOpsSnapshot() {
    if (this.adapter.getOpsSnapshot) {
      return toOpsSnapshot(await this.adapter.getOpsSnapshot())
    }

    const [tasks, activities] = await Promise.all([this.adapter.getTasks(), this.adapter.getActivities()])
    return toOpsSnapshot(deriveOpsSnapshot(tasks, activities))
  }

  async getSource() {
    return (await this.adapter.getSource?.()) ?? 'mock'
  }
}

export const createDashboardDataService = (
  baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_API_BASE_URL,
  mode = process.env.NEXT_PUBLIC_DASHBOARD_DATA_MODE ?? 'local',
): DashboardDataService => {
  if (mode === 'local') {
    return new ApiDashboardDataService(new LocalDashboardAdapter())
  }

  if (baseUrl) {
    return new ApiDashboardDataService(new ApiDashboardAdapter(baseUrl))
  }

  return new MockDashboardDataService()
}

// Default to mock data unless local mode or an API base URL is explicitly configured.
export const dashboardDataService: DashboardDataService = createDashboardDataService()
