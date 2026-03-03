import {
  ApiActivity,
  ApiCalendarEvent,
  ApiDocument,
  ApiMemoryEntry,
  ApiProject,
  ApiTask,
  ApiTeamMember,
  DashboardApiAdapter,
  DashboardDataSource,
  UpdateTaskStatusRequest,
} from '@/src/services/dashboardContracts'

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`)

export class ApiDashboardAdapter implements DashboardApiAdapter {
  constructor(private readonly baseUrl: string, private readonly fetchImpl: typeof fetch = fetch) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${ensureLeadingSlash(path)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    })

    if (!response.ok) {
      throw new Error(`Dashboard API request failed (${response.status})`)
    }

    return (await response.json()) as T
  }

  getTasks() {
    return this.request<ApiTask[]>('/tasks')
  }

  updateTaskStatus(taskId: string, payload: UpdateTaskStatusRequest) {
    return this.request<ApiTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }

  getActivities() {
    return this.request<ApiActivity[]>('/activities')
  }

  getProjects() {
    return this.request<ApiProject[]>('/projects')
  }

  getMemories() {
    return this.request<ApiMemoryEntry[]>('/memories')
  }

  getDocs() {
    return this.request<ApiDocument[]>('/docs')
  }

  getTeam() {
    return this.request<ApiTeamMember[]>('/team')
  }

  getCalendarEvents() {
    return this.request<ApiCalendarEvent[]>('/calendar-events')
  }

  async getSource(): Promise<DashboardDataSource> {
    return 'mock'
  }
}
