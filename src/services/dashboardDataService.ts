import { mockActivities, mockCalendarEvents, mockDocs, mockMemories, mockProjects, mockTasks, mockTeam } from '@/src/mockData'
import { Activity, CalendarEvent, Document, MemoryEntry, Project, Task, TeamMember } from '@/src/types'

export interface DashboardDataService {
  getTasks(): Promise<Task[]>
  getActivities(): Promise<Activity[]>
  getProjects(): Promise<Project[]>
  getMemories(): Promise<MemoryEntry[]>
  getDocs(): Promise<Document[]>
  getTeam(): Promise<TeamMember[]>
  getCalendarEvents(): Promise<CalendarEvent[]>
}

const resolveWithLatency = async <T>(value: T, delayMs = 120): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  return structuredClone(value)
}

class MockDashboardDataService implements DashboardDataService {
  getTasks() {
    return resolveWithLatency(mockTasks)
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
}

// Backend-ready seam: swap this with an API-backed implementation when endpoints are ready.
export const dashboardDataService: DashboardDataService = new MockDashboardDataService()
