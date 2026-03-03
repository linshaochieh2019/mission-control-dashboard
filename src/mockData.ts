import { Activity, CalendarEvent, Document, MemoryEntry, Project, Task, TeamMember } from './types'

export const mockTasks: Task[] = [
  { id: '1', title: 'Implement Auth Flow', description: 'Setup JWT and OAuth for user authentication.', assignee: 'H', status: 'In Progress' },
  { id: '2', title: 'API Endpoints', description: 'Design and implement RESTful API endpoints for tasks.', assignee: 'J', status: 'Review' },
  { id: '3', title: 'Database Schema', description: 'Define the initial database schema for the project.', assignee: 'H', status: 'Done' },
  { id: '4', title: 'UI Design System', description: 'Create a consistent UI design system for the dashboard.', assignee: 'J', status: 'Backlog' },
  { id: '5', title: 'Kanban Board Component', description: 'Build drag and drop board interactions.', assignee: 'H', status: 'In Progress' },
  { id: '6', title: 'Live Activity Feed', description: 'Implement a real-time activity feed for agent actions.', assignee: 'J', status: 'In Progress' },
  { id: '7', title: 'Calendar Integration', description: 'Integrate a calendar view for scheduled tasks.', assignee: 'H', status: 'Backlog' },
  { id: '8', title: 'Project Grid View', description: 'Create a grid view for project tracking.', assignee: 'J', status: 'Done' },
]

export const mockActivities: Activity[] = [
  { id: '1', timestamp: '10:45 AM', action: 'Henry picked up task: Implement auth flow' },
  { id: '2', timestamp: '11:15 AM', action: 'Henry moved API endpoints to Review' },
  { id: '3', timestamp: '12:00 PM', action: 'Jay started Live Activity Feed' },
  { id: '4', timestamp: '01:45 PM', action: 'Pinchy approved Database Schema' },
]

export const mockProjects: Project[] = [
  { id: '1', name: 'Poker Companion App', progress: 65, status: 'Active', taskCount: 24, lastActivity: '2 hours ago' },
  { id: '2', name: 'TW Gap Checker', progress: 20, status: 'Planning', taskCount: 12, lastActivity: '1 day ago' },
  { id: '3', name: 'Mission Control Dashboard', progress: 30, status: 'Active', taskCount: 15, lastActivity: 'Just now' },
]

export const mockMemories: MemoryEntry[] = [
  { id: '1', date: '2026-03-03', timestamp: '09:00 AM', content: 'Defined MVP layout for mission control panel.' },
  { id: '2', date: '2026-03-03', timestamp: '09:25 AM', content: 'Mapped backlog automation to heartbeat routine.', isPinned: true },
  { id: '3', date: '2026-03-02', timestamp: '03:10 PM', content: 'Reviewed screenshots and alignment with Linear-like style.' },
]

export const mockDocs: Document[] = [
  { id: '1', title: 'Project Roadmap 2026', category: 'Planning', format: 'MD', createdDate: '2026-01-15', preview: 'Primary goals for scaling the dashboard and orchestration stack.' },
  { id: '2', title: 'Auth Flow PRD', category: 'PRD', format: 'PDF', createdDate: '2026-02-10', preview: 'Requirements for the new authentication and approval layer.' },
  { id: '3', title: 'System Architecture', category: 'Architecture', format: 'PDF', createdDate: '2026-02-01', preview: 'High-level structure of services and data flow.' },
]

export const mockTeam: TeamMember[] = [
  { id: '1', name: 'Pinchy', role: 'Project Manager', model: 'Opus', currentTask: 'Overseeing Sprint 5', status: 'active', deviceInfo: 'Server Node-01' },
  { id: '2', name: 'Inky', role: 'Developer', model: 'Standard', currentTask: 'Implementing UI + interactions', status: 'active', deviceInfo: 'Worker-A', parentId: '1' },
  { id: '3', name: 'Coral', role: 'Designer', model: 'Standard', currentTask: 'Refining visual language', status: 'idle', deviceInfo: 'Worker-B', parentId: '1' },
  { id: '4', name: 'Bloop', role: 'QA Engineer', model: 'Standard', currentTask: 'Running lint/type/build checks', status: 'active', deviceInfo: 'Worker-C', parentId: '1' },
]

export const mockCalendarEvents: CalendarEvent[] = [
  { id: '1', date: '2026-03-01', label: 'Daily Standup' },
  { id: '2', date: '2026-03-02', label: 'Daily Standup' },
  { id: '3', date: '2026-03-03', label: 'Daily Standup' },
  { id: '4', date: '2026-03-04', label: 'Daily Standup' },
  { id: '5', date: '2026-03-05', label: 'Daily Standup' },
  { id: '6', date: '2026-03-12', label: 'Sprint Check', variant: 'highlight' },
]
