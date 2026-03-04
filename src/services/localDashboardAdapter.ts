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
  DashboardApiAdapter,
  DashboardDataSource,
  UpdateTaskStatusRequest,
} from '@/src/services/dashboardContracts'

interface LocalDashboardResponse {
  source: DashboardDataSource
  tasks: ApiTask[]
  activities: ApiActivity[]
  projects: ApiProject[]
  memories: ApiMemoryEntry[]
  docs: ApiDocument[]
  team: ApiTeamMember[]
  cronJobs: ApiCronJob[]
  workspaceProjects: ApiWorkspaceProject[]
  operations: ApiOpsSnapshot
}

export class LocalDashboardAdapter implements DashboardApiAdapter {
  constructor(private readonly fetchImpl?: typeof fetch) {}

  private async getPayload(): Promise<LocalDashboardResponse> {
    const fetchFn = this.fetchImpl
      ? (input: RequestInfo | URL, init?: RequestInit) => this.fetchImpl!.call(globalThis, input, init)
      : globalThis.fetch.bind(globalThis)

    const response = await fetchFn('/api/local/dashboard', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Local dashboard request failed (${response.status})`)
    }

    return (await response.json()) as LocalDashboardResponse
  }

  async getTasks() {
    return (await this.getPayload()).tasks
  }

  async updateTaskStatus(taskId: string, payload: UpdateTaskStatusRequest) {
    const tasks = (await this.getPayload()).tasks
    const target = tasks.find((task) => task.id === taskId)
    if (!target) {
      throw new Error('Task not found')
    }

    return { ...target, status: payload.status }
  }

  async getActivities() {
    return (await this.getPayload()).activities
  }

  async getProjects() {
    return (await this.getPayload()).projects
  }

  async getMemories() {
    return (await this.getPayload()).memories
  }

  async getDocs() {
    return (await this.getPayload()).docs
  }

  async getTeam() {
    return (await this.getPayload()).team
  }

  async getCronJobs() {
    return (await this.getPayload()).cronJobs
  }

  async getWorkspaceProjects() {
    return (await this.getPayload()).workspaceProjects
  }

  async getOpsSnapshot() {
    return (await this.getPayload()).operations
  }

  async getSource() {
    return (await this.getPayload()).source
  }
}
