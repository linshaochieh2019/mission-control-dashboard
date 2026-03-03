import { Task, Activity, Project, MemoryEntry, Document, TeamMember } from './types';

export const mockTasks: Task[] = [
  { id: '1', title: 'Implement Auth Flow', description: 'Setup JWT and OAuth for user authentication.', assignee: 'H', status: 'In Progress' },
  { id: '2', title: 'API Endpoints', description: 'Design and implement RESTful API endpoints for tasks.', assignee: 'J', status: 'Review' },
  { id: '3', title: 'Database Schema', description: 'Define the initial database schema for the project.', assignee: 'H', status: 'Done' },
  { id: '4', title: 'UI Design System', description: 'Create a consistent UI design system for the dashboard.', assignee: 'J', status: 'Backlog' },
  { id: '5', title: 'Kanban Board Component', description: 'Build the Kanban board component with drag and drop.', assignee: 'H', status: 'In Progress' },
  { id: '6', title: 'Live Activity Feed', description: 'Implement a real-time activity feed for agent actions.', assignee: 'J', status: 'In Progress' },
  { id: '7', title: 'Calendar Integration', description: 'Integrate a calendar view for scheduled tasks.', assignee: 'H', status: 'Backlog' },
  { id: '8', title: 'Project Grid View', description: 'Create a grid view for project tracking.', assignee: 'J', status: 'Done' },
  { id: '9', title: 'Memory Journaling', description: 'Implement a journal-style memory entry system.', assignee: 'H', status: 'Backlog' },
  { id: '10', title: 'Document Search', description: 'Add search functionality to the document list.', assignee: 'J', status: 'Review' },
];

export const mockActivities: Activity[] = [
  { id: '1', timestamp: '10:45 AM', action: 'Henry picked up task: Implement auth flow' },
  { id: '2', timestamp: '11:15 AM', action: 'Henry moved "API endpoints" to Review' },
  { id: '3', timestamp: '11:30 AM', action: 'Jay updated "UI Design System" description' },
  { id: '4', timestamp: '12:00 PM', action: 'Henry completed "Database Schema"' },
  { id: '5', timestamp: '01:15 PM', action: 'Jay started "Live Activity Feed"' },
];

export const mockProjects: Project[] = [
  { id: '1', name: 'Poker Companion App', progress: 65, status: 'Active', taskCount: 24, lastActivity: '2 hours ago' },
  { id: '2', name: 'TW Gap Checker', progress: 20, status: 'Planning', taskCount: 12, lastActivity: '1 day ago' },
  { id: '3', name: 'Research Layer', progress: 10, status: 'Planning', taskCount: 8, lastActivity: '3 days ago' },
  { id: '4', name: 'App Best Practices', progress: 45, status: 'Active', taskCount: 18, lastActivity: '5 hours ago' },
  { id: '5', name: 'Mission Control Dashboard', progress: 30, status: 'Active', taskCount: 15, lastActivity: 'Just now' },
];

export const mockMemories: MemoryEntry[] = [
  { id: '1', date: '2026-03-02', timestamp: '09:00 AM', content: 'Discussed the architecture for the new research layer. Decided on a modular approach.' },
  { id: '2', date: '2026-03-02', timestamp: '02:30 PM', content: 'Reviewed the UI design for the Kanban board. Suggested more subtle borders.' },
  { id: '3', date: '2026-03-01', timestamp: '10:00 AM', content: 'Sprint planning session. Focused on the core dashboard features.' },
  { id: '4', date: '2026-03-01', timestamp: '04:00 PM', content: 'Fixed a critical bug in the auth flow. JWT tokens were not being refreshed correctly.' },
  { id: '5', date: '2026-02-28', timestamp: '11:00 AM', content: 'Initial research on the TW Gap Checker. Identified key data sources.' },
  { id: '6', date: '2026-02-28', timestamp: '03:00 PM', content: 'Setup the development environment for the Poker Companion App.', isPinned: true },
];

export const mockDocs: Document[] = [
  { id: '1', title: 'Project Roadmap 2026', category: 'Planning', format: 'MD', createdDate: '2026-01-15', preview: 'Our primary goals for the year include scaling the research layer and...' },
  { id: '2', title: 'Auth Flow PRD', category: 'PRD', format: 'PDF', createdDate: '2026-02-10', preview: 'This document outlines the requirements for the new authentication system...' },
  { id: '3', title: 'Weekly Newsletter #42', category: 'Newsletter', format: 'MD', createdDate: '2026-02-25', preview: 'In this weeks update, we cover the progress on the Poker Companion App...' },
  { id: '4', title: 'System Architecture Diagram', category: 'Architecture', format: 'PDF', createdDate: '2026-02-01', preview: 'High-level overview of the system components and their interactions...' },
  { id: '5', title: 'User Research Findings', category: 'Research', format: 'MD', createdDate: '2026-02-15', preview: 'Key insights from the latest round of user interviews regarding dashboard...' },
  { id: '6', title: 'Sprint 5 Planning', category: 'Planning', format: 'MD', createdDate: '2026-03-01', preview: 'Tasks and objectives for the upcoming sprint starting on March 2nd...' },
  { id: '7', title: 'API Documentation v1', category: 'Architecture', format: 'MD', createdDate: '2026-02-20', preview: 'Detailed documentation for the public API endpoints and data models...' },
  { id: '8', title: 'Market Analysis Report', category: 'Research', format: 'PDF', createdDate: '2026-01-20', preview: 'Analysis of the current market trends in the AI dashboard space...' },
];

export const mockTeam: TeamMember[] = [
  { id: '1', name: 'Pinchy', role: 'Project Manager', model: 'Opus', currentTask: 'Overseeing Sprint 5', status: 'active', deviceInfo: 'Server Node-01' },
  { id: '2', name: 'Inky', role: 'Developer', model: 'Standard', currentTask: 'Implementing Auth Flow', status: 'active', deviceInfo: 'Worker-A', parentId: '1' },
  { id: '3', name: 'Coral', role: 'Designer', model: 'Standard', currentTask: 'UI Design System', status: 'idle', deviceInfo: 'Worker-B', parentId: '1' },
  { id: '4', name: 'Bloop', role: 'QA Engineer', model: 'Standard', currentTask: 'Testing API Endpoints', status: 'active', deviceInfo: 'Worker-C', parentId: '1' },
];
