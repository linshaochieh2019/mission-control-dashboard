import { Activity, CronJob, Document, MemoryEntry, OpsSnapshot, Project, Task, TeamMember, WorkspaceProject } from './types'

export const mockTasks: Task[] = [
  { id: '1', title: 'Implement Auth Flow', description: 'Setup JWT and OAuth for user authentication.', assignee: 'H', status: 'In Progress' },
  { id: '2', title: 'API Endpoints', description: 'Design and implement RESTful API endpoints for tasks.', assignee: 'J', status: 'Review' },
  { id: '3', title: 'Database Schema', description: 'Define the initial database schema for the project.', assignee: 'H', status: 'Done' },
  { id: '4', title: 'UI Design System', description: 'Create a consistent UI design system for the dashboard.', assignee: 'J', status: 'Backlog' },
  { id: '5', title: 'Ops UI v2', description: 'Ship operational visibility redesign as default home view.', assignee: 'I', status: 'In Progress' },
  { id: '6', title: 'Live Activity Feed', description: 'Implement a real-time activity feed for agent actions.', assignee: 'J', status: 'In Progress' },
  { id: '7', title: 'Regression Test Pass', description: 'Run lint/type/build/tests before merge.', assignee: 'B', status: 'Review' },
  { id: '8', title: 'Release Sprint 3', description: 'Deploy local mode dashboard improvements.', assignee: 'P', status: 'Done' },
]

export const mockActivities: Activity[] = [
  { id: '1', timestamp: '10:45 AM', action: 'Inky started Ops UI v2 implementation' },
  { id: '2', timestamp: '11:15 AM', action: 'Jay moved API Endpoints to Review' },
  { id: '3', timestamp: '12:00 PM', action: 'Bloop queued QA regression sweep' },
  { id: '4', timestamp: '01:45 PM', action: 'Pinchy approved release cut for sprint-3-local-data-v1' },
]

export const mockProjects: Project[] = [
  { id: '1', name: 'Poker Companion App', progress: 65, status: 'Active', taskCount: 24, lastActivity: '2 hours ago' },
  { id: '2', name: 'TW Gap Checker', progress: 20, status: 'Planning', taskCount: 12, lastActivity: '1 day ago' },
  { id: '3', name: 'Mission Control Dashboard', progress: 74, status: 'Active', taskCount: 15, lastActivity: 'Just now' },
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
  { id: '2', name: 'Inky', role: 'Developer', model: 'Standard', currentTask: 'Implementing Ops UI v2', status: 'active', deviceInfo: 'Worker-A', parentId: '1' },
  { id: '3', name: 'Coral', role: 'Designer', model: 'Standard', currentTask: 'Refining visual language', status: 'idle', deviceInfo: 'Worker-B', parentId: '1' },
  { id: '4', name: 'Bloop', role: 'QA Engineer', model: 'Standard', currentTask: 'Running lint/type/build checks', status: 'active', deviceInfo: 'Worker-C', parentId: '1' },
]

export const mockCronJobs: CronJob[] = [
  {
    id: 'cron-system-standup',
    name: 'Daily Standup Digest',
    scheduleSummary: 'Every day at 08:00 (Asia/Taipei)',
    enabled: true,
    scopeTarget: 'agent:main:discord:standup-channel',
    nextRunTime: '2026-03-04T00:00:00.000Z',
    lastRunStatus: 'ok',
    category: 'system',
  },
  {
    id: 'cron-system-retro',
    name: 'Weekly Retro Prompt',
    scheduleSummary: 'Every Friday at 18:00 (Asia/Taipei)',
    enabled: true,
    scopeTarget: 'agent:main:discord:retro-channel',
    nextRunTime: '2026-03-06T10:00:00.000Z',
    lastRunStatus: 'ok',
    category: 'system',
  },
  {
    id: 'cron-temp-15min-tick',
    name: '15-min Tactical Tick',
    scheduleSummary: 'Every 15 minutes',
    enabled: true,
    scopeTarget: 'session:project/mission-control-dashboard',
    nextRunTime: '2026-03-03T06:30:00.000Z',
    lastRunStatus: 'running',
    category: 'project-temp',
  },
  {
    id: 'cron-temp-warmup',
    name: 'Temporary PR Warmup Check',
    scheduleSummary: 'Every 30 minutes',
    enabled: false,
    scopeTarget: 'session:project/poker-companion-app',
    nextRunTime: '2026-03-03T07:00:00.000Z',
    lastRunStatus: 'unknown',
    category: 'project-temp',
  },
]

export const mockWorkspaceProjects: WorkspaceProject[] = [
  {
    id: 'wsp-mission-control-dashboard',
    name: 'mission-control-dashboard',
    path: '/Users/pinchylin/.openclaw/workspace/mission-control-dashboard',
    lastModified: '2026-03-04T01:22:00.000Z',
    sizeBytes: 52_000_000,
    isGitRepo: true,
    gitBranch: 'main',
    gitStatusSummary: 'clean',
    tag: 'active',
  },
  {
    id: 'wsp-poker-companion-app',
    name: 'poker-companion-app',
    path: '/Users/pinchylin/.openclaw/workspace/poker-companion-app',
    lastModified: '2026-02-20T13:10:00.000Z',
    sizeBytes: 18_000_000,
    isGitRepo: true,
    gitBranch: 'feature/ui-refresh',
    gitStatusSummary: '3 modified',
    tag: 'experimental',
  },
]

export const mockOpsSnapshot: OpsSnapshot = {
  metrics: {
    activeRuns: 3,
    blockedRuns: 1,
    qaPassRateToday: 82,
    medianCycleTimeHours: 5.2,
    lastSuccessfulDeployCommit: 'c8f02d9',
  },
  agents: [
    {
      id: 'agent-inky',
      agent: 'Inky',
      currentWork: 'Implement Ops UI v2 redesign',
      state: 'Running',
      since: '09:41',
      lastUpdate: '2m ago',
      runIdOrCommit: 'run-6f4bedf9',
      nextAction: 'Finalize table + timeline panel',
    },
    {
      id: 'agent-bloop',
      agent: 'Bloop',
      currentWork: 'Regression checks for sprint-3-local-data-v1',
      state: 'Waiting QA',
      since: '10:12',
      lastUpdate: '6m ago',
      runIdOrCommit: 'qa-1a73',
      nextAction: 'Execute full test matrix',
    },
    {
      id: 'agent-coral',
      agent: 'Coral',
      currentWork: 'Visual polish for ops dashboard',
      state: 'Blocked',
      since: '10:32',
      lastUpdate: '9m ago',
      runIdOrCommit: 'ux-8841',
      nextAction: 'Need updated color tokens',
    },
    {
      id: 'agent-jay',
      agent: 'Jay',
      currentWork: 'Idle (awaiting assignment)',
      state: 'Idle',
      since: '11:04',
      lastUpdate: '11m ago',
      runIdOrCommit: '—',
      nextAction: 'Pick next backlog item',
    },
  ],
  timeline: [
    { id: 'evt-1', timestamp: '12:14', message: 'Deploy succeeded on commit c8f02d9', severity: 'success' },
    { id: 'evt-2', timestamp: '12:09', message: 'Coral flagged missing color token mappings', severity: 'warning' },
    { id: 'evt-3', timestamp: '12:03', message: 'Bloop entered QA verification lane', severity: 'info' },
    { id: 'evt-4', timestamp: '11:58', message: 'Inky updated local dashboard payload schema', severity: 'info' },
  ],
  lanes: [
    { id: 'coding', title: 'Coding', count: 2, items: ['Inky · Ops UI v2', 'Jay · API Endpoints'] },
    { id: 'qa', title: 'QA', count: 1, items: ['Bloop · Regression suite'] },
    { id: 'fix-required', title: 'Fix Required', count: 1, items: ['Coral · Token mismatch'] },
    { id: 'completed-today', title: 'Completed Today', count: 3, items: ['Deploy pipeline update', 'Calendar bugfix', 'Docs index sync'] },
  ],
}
