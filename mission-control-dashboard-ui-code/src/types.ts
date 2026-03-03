export type AppView = 'Task Board' | 'Calendar' | 'Projects' | 'Memory' | 'Docs' | 'Team';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: 'J' | 'H';
  status: 'Backlog' | 'In Progress' | 'Review' | 'Done';
}

export interface Activity {
  id: string;
  timestamp: string;
  action: string;
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  status: 'Active' | 'Planning' | 'Paused';
  taskCount: number;
  lastActivity: string;
}

export interface MemoryEntry {
  id: string;
  date: string;
  timestamp: string;
  content: string;
  isPinned?: boolean;
}

export interface Document {
  id: string;
  title: string;
  category: 'Planning' | 'PRD' | 'Newsletter' | 'Architecture' | 'Research';
  format: 'MD' | 'PDF';
  createdDate: string;
  preview: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  model: string;
  currentTask: string;
  status: 'active' | 'idle';
  deviceInfo: string;
  parentId?: string;
}
