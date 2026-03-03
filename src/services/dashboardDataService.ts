import { mockActivities, mockCalendarEvents, mockDocs, mockMemories, mockProjects, mockTasks, mockTeam } from '@/src/mockData'
import { ApiDashboardAdapter } from '@/src/services/apiDashboardAdapter'
import { LocalDashboardAdapter } from '@/src/services/localDashboardAdapter'
import {
  DashboardApiAdapter,
  DashboardDataSource,
  toActivity,
  toCalendarEvent,
  toDocument,
  toMemoryEntry,
  toProject,
  toTask,
  toTeamMember,
} from '@/src/services/dashboardContracts'
import { Activity, CalendarEvent, Document, MemoryEntry, Project, Task, TaskStatus, TeamMember } from '@/src/types'

export interface DashboardDataService {
  getTasks(): Promise<Task[]>
  updateTaskStatus(taskId: Task['id'], status: Task['status']): Promise<Task>
  getActivities(): Promise<Activity[]>
  getProjects(): Promise<Project[]>
  getMemories(): Promise<MemoryEntry[]>
  getDocs(): Promise<Document[]>
  getTeam(): Promise<TeamMember[]>
  getCalendarEvents(): Promise<CalendarEvent[]>
  getSource(): Promise<DashboardDataSource>
}

const resolveWithLatency = async <T>(value: T, delayMs = 120): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  return structuredClone(value)
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

  getCalendarEvents() {
    return resolveWithLatency(mockCalendarEvents)
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

  async getCalendarEvents() {
    return (await this.adapter.getCalendarEvents()).map(toCalendarEvent)
  }

  async getSource() {
    return (await this.adapter.getSource?.()) ?? 'mock'
  }
}

export const createDashboardDataService = (
  baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_API_BASE_URL,
  mode = process.env.NEXT_PUBLIC_DASHBOARD_DATA_MODE,
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
