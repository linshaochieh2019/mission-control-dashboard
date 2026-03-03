# Mission Control Dashboard — Build Guide for Pinchy

## What You're Building

A **"Mission Control" personal dashboard** — a Next.js web app hosted on localhost that serves as the central command center for managing AI agents, tasks, projects, memories, documents, and team structure. Think of it as a Linear-inspired dark-mode dashboard where everything about your agent workflow is visible at a glance.

The design aesthetic is **clean, minimal, and dark** — inspired by Linear's UI. Dark backgrounds (`#0A0A0A`), subtle card borders (`#222`), blue accent color (`#4C8BF5`), Inter + JetBrains Mono fonts.

---

## The 6 Screens to Build

### 1. Task Board (Kanban)

The main work-tracking view. Two parts:

- **Left panel — Live Activity Feed**: A real-time scrollable log showing timestamped actions (e.g., "10:45 AM — Henry picked up task: Implement auth flow"). This gives visibility into what agents are actually doing moment-to-moment.

- **Right area — Kanban Board**: 4 columns — **Backlog**, **In Progress**, **Review**, **Done**. Each column has a header with task count and a "+" button. Task cards show a title, short description, and an assignee badge (avatar initial). Cards should support drag-and-drop between columns.

**Why this matters**: The Task Board is the heartbeat of the system. Agents auto-pick up tasks from Backlog each "heartbeat" cycle. The Review column is specifically for tasks that need human approval before moving to Done.

### 2. Calendar

A monthly calendar view showing cron jobs and scheduled tasks.

- Standard month grid (Mon-Sun columns)
- Navigation: Today / Prev / Next buttons
- Events rendered as colored pills on their respective days (e.g., "Daily Standup" in teal, "Tech Debt Review" in green, "Sprint Check" in amber)

**Why this matters**: Agents often say "I'll schedule that" but never actually do it. The calendar makes scheduled work visible and accountable. If the calendar is empty, you know the agent isn't being proactive.

### 3. Projects

A grid of project cards showing all major ongoing work.

Each card contains:
- Project name
- Status badge: **Active** (green), **Planning** (blue), or **Paused** (gray)
- Task count (e.g., "24 tasks")
- Progress bar (animated, showing % complete)
- Last activity timestamp
- Overflow menu (three dots)

**Why this matters**: Prevents getting scatterbrained across too many things. Shows at a glance which projects are moving and which are stalled. Great for "reverse prompting" — asking the agent "what task can we do right now to progress one of our major projects?"

### 4. Memory

A journal-style view of the agent's memories, organized by day.

- **Left sidebar**: Date list (clickable, acts as filter)
- **Right content area**: Two tabs — "Recent Memories" and "Long-term Memories"
  - Recent Memories: Entries filtered by the selected date, each showing a clock icon, timestamp, and content text
  - Long-term Memories: Only shows pinned/important entries
- Entries can be pinned (pin icon)

**Why this matters**: Replaces the messy unorganized `memories.md` file. Makes it easy to find old thoughts, decisions, and context from previous sessions.

### 5. Docs

A document library with search, filtering, and preview.

- **Left section — Document List**:
  - Search bar at the top
  - Category filter pills: All, Planning, PRD, Newsletter, Architecture, Research
  - Document rows showing: title, format badge (MD/PDF), preview snippet, creation date
- **Right section — Document Preview Panel**:
  - Slides in when a document is selected (animated)
  - Shows category label, full title, content preview
  - Download and external link buttons
  - Metadata (created date, file size)

**Why this matters**: Agents create lots of documents (PRDs, newsletters, architecture docs, planning docs) that get buried in chat history. This gives them a proper home with search and categorization.

### 6. Team

An org chart showing all agents, their roles, and current status.

- **Top banner**: Mission statement (centered, italicized quote + subtitle)
- **Lead agent card**: Prominently displayed at top (e.g., "Pinchy — Project Manager", model: Opus, device: Server Node-01, current task)
- **Visual connector lines** linking lead to team members
- **Team member cards** in a 3-column grid below, each showing:
  - Avatar with initials + status indicator (green dot = active, gray = idle)
  - Name and role
  - Model type and device info
  - Current task assignment

**Why this matters**: When running multiple agents and sub-agents, you need visibility into who handles what, what they're working on, and whether they're active. The mission statement at the top keeps all agents aligned on the shared goal.

---

## Shared UI Elements

### Sidebar Navigation
Fixed left sidebar (~64px wide) with 6 icon buttons, one per screen. The active screen's icon is highlighted. Icons used (from Lucide):
- Task Board: `LayoutDashboard`
- Calendar: `Calendar`
- Projects: `FolderKanban`
- Memory: `Brain`
- Docs: `FileText`
- Team: `Users`

### Header Bar
Each screen has a header showing:
- Screen title + version badge (e.g., "Task Board v1.0.4-beta")
- User avatar circles (top-right corner)

### Animations
View transitions should fade + slide when navigating between screens. Progress bars animate on load. The Docs preview panel slides in from the right. Use Framer Motion (or the `motion` package) for all animations.

---

## Data Models

```typescript
type AppView = 'Task Board' | 'Calendar' | 'Projects' | 'Memory' | 'Docs' | 'Team'

interface Task {
  id: string
  title: string
  description: string
  assignee: string        // avatar initial(s)
  status: 'Backlog' | 'In Progress' | 'Review' | 'Done'
}

interface Activity {
  id: string
  timestamp: string       // e.g., "10:45 AM"
  action: string          // e.g., "Henry picked up task: Implement auth flow"
}

interface Project {
  id: string
  name: string
  progress: number        // 0-100
  status: 'Active' | 'Planning' | 'Paused'
  taskCount: number
  lastActivity: string    // e.g., "2 hours ago"
}

interface MemoryEntry {
  id: string
  date: string            // "YYYY-MM-DD"
  timestamp: string       // e.g., "09:00 AM"
  content: string
  isPinned?: boolean
}

interface Document {
  id: string
  title: string
  category: 'Planning' | 'PRD' | 'Newsletter' | 'Architecture' | 'Research'
  format: 'MD' | 'PDF'
  createdDate: string
  preview: string
}

interface TeamMember {
  id: string
  name: string
  role: string            // e.g., "Developer", "Designer"
  model: string           // e.g., "Opus", "Standard"
  currentTask: string
  status: 'active' | 'idle'
  deviceInfo: string      // e.g., "Server Node-01"
  parentId?: string       // for org hierarchy (lead has no parent)
}
```

---

## About the Reference Code

The `mission-control-dashboard-ui-code/` folder in this directory contains a **working reference implementation** built as a single-page Vite + React + TypeScript app. Here's how to use it:

### What's in the reference

| File | What it contains |
|---|---|
| `package.json` | Dependencies — React 19, Vite 6, Tailwind CSS 4, Lucide React, Motion (Framer Motion), plus Express/SQLite/Gemini API deps |
| `vite.config.ts` | Vite config with React plugin, Tailwind CSS integration, path aliases (`@/` = root) |
| `tsconfig.json` | TypeScript config — ES2022 target, ESNext modules, strict mode |
| `src/types.ts` | All TypeScript interfaces listed above |
| `src/mockData.ts` | Sample data for every screen (10 tasks, 5 activities, 5 projects, 6 memories, 8 docs, 4 team members) |
| `src/App.tsx` | The entire UI in one file (~495 lines) — all 6 screens, sidebar, navigation, animations |
| `src/index.css` | Global styles — dark theme colors, fonts (Inter + JetBrains Mono), kanban column styles, hover effects, custom scrollbar |
| `src/main.tsx` | React entry point |

### How to use the reference

1. **For layout and structure**: `App.tsx` shows exactly how each screen is laid out — column widths, grid configurations, card structures, spacing. Use this as your blueprint.

2. **For styling**: `index.css` defines the color palette, typography, and utility classes. The dark theme values are all there.

3. **For data shape**: `types.ts` and `mockData.ts` show the exact data structures. Start with mock data, then wire up real data later.

4. **For interactions**: The reference shows view switching with animated transitions, tab switching (Memory screen), document selection with preview panel, category filtering (Docs screen), and date navigation (Memory + Calendar).

### What the reference does NOT include
- No backend/API integration (it's all mock data)
- No drag-and-drop on the Kanban board (structure is ready for it)
- No real-time updates or WebSocket connections
- No authentication
- No persistent storage
- No actual cron job management

These are things you'll need to build on top of the reference UI.

---

## Design Tokens (from the reference CSS)

```
Background:     #0A0A0A
Card:           #141414
Border:         #222222
Text primary:   #E5E5E5
Text muted:     #888888
Accent blue:    #4C8BF5

Font sans:      Inter (weights: 400, 500, 600)
Font mono:      JetBrains Mono (weights: 400, 500)
```

---

## Build Priority

Recommended order for building screens:

1. **Task Board** — Core screen, most complex (Kanban + activity feed)
2. **Projects** — Simple card grid, quick win
3. **Team** — Org chart, helps visualize the agent setup
4. **Calendar** — Month grid with events
5. **Memory** — Journal view with date filtering + tabs
6. **Docs** — Document list with search, filter, and preview panel

Start with the sidebar navigation and screen-switching mechanism first, then build each screen one at a time.

---

## Validation Commands

Use these commands before pushing changes:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test` (Vitest + Testing Library)
