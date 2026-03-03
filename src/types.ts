export type AppView = 'Task Board' | 'Calendar' | 'Projects' | 'Memory' | 'Docs' | 'Team'

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

export type CalendarEventVariant = 'default' | 'highlight'

export interface CalendarEvent {
  id: string
  date: string
  label: string
  variant?: CalendarEventVariant
}
