import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  FolderKanban, 
  Brain, 
  FileText, 
  Users,
  Search,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Clock,
  Activity as ActivityIcon,
  CheckCircle2,
  Circle,
  AlertCircle,
  Pin,
  Download,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView, Task, Activity, Project, MemoryEntry, Document, TeamMember } from './types';
import { mockTasks, mockActivities, mockProjects, mockMemories, mockDocs, mockTeam } from './mockData';

// --- Components ---

const Sidebar = ({ activeView, setActiveView }: { activeView: AppView, setActiveView: (view: AppView) => void }) => {
  const navItems: { id: AppView; icon: any }[] = [
    { id: 'Task Board', icon: LayoutDashboard },
    { id: 'Calendar', icon: CalendarIcon },
    { id: 'Projects', icon: FolderKanban },
    { id: 'Memory', icon: Brain },
    { id: 'Docs', icon: FileText },
    { id: 'Team', icon: Users },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-bg border-r border-border flex flex-col items-center py-6 gap-6 z-50">
      <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center mb-4">
        <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`p-2 rounded-lg transition-all duration-200 group relative ${
            activeView === item.id ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text hover:bg-white/5'
          }`}
        >
          <item.icon size={20} />
          <span className="absolute left-14 px-2 py-1 bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {item.id}
          </span>
        </button>
      ))}
    </div>
  );
};

// --- View Components ---

const TaskBoard = () => {
  const columns: Task['status'][] = ['Backlog', 'In Progress', 'Review', 'Done'];
  
  return (
    <div className="flex h-full gap-6">
      {/* Live Activity Feed */}
      <div className="w-64 border-r border-border pr-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
          <ActivityIcon size={14} />
          Live Activity
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-muted">{activity.timestamp}</span>
              <p className="text-xs leading-relaxed text-text/80">{activity.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map((col) => (
          <div key={col} className="kanban-column">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text">{col}</span>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-muted">
                  {mockTasks.filter(t => t.status === col).length}
                </span>
              </div>
              <Plus size={14} className="text-muted cursor-pointer hover:text-text" />
            </div>
            <div className="flex flex-col gap-3">
              {mockTasks.filter(t => t.status === col).map((task) => (
                <div key={task.id} className="bg-card border border-border rounded-lg p-3 card-hover cursor-grab active:cursor-grabbing">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-medium text-text leading-tight">{task.title}</h4>
                    <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] font-bold text-accent">
                      {task.assignee}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted line-clamp-2 leading-normal">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Calendar = () => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">March 2026</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-card border border-border rounded-md text-xs hover:bg-white/5 transition-colors">Today</button>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button className="px-3 py-1.5 bg-card hover:bg-white/5 border-r border-border text-xs">Prev</button>
            <button className="px-3 py-1.5 bg-card hover:bg-white/5 text-xs">Next</button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-7 border-t border-l border-border">
        {weekDays.map(wd => (
          <div key={wd} className="p-3 border-r border-b border-border text-[10px] font-mono text-muted uppercase tracking-widest text-center">
            {wd}
          </div>
        ))}
        {/* Empty cells for February offset */}
        <div className="p-3 border-r border-b border-border bg-white/[0.02]" />
        <div className="p-3 border-r border-b border-border bg-white/[0.02]" />
        <div className="p-3 border-r border-b border-border bg-white/[0.02]" />
        <div className="p-3 border-r border-b border-border bg-white/[0.02]" />
        <div className="p-3 border-r border-b border-border bg-white/[0.02]" />
        
        {days.map(day => (
          <div key={day} className="p-2 border-r border-b border-border min-h-[100px] flex flex-col gap-1 hover:bg-white/[0.01] transition-colors">
            <span className="text-xs font-mono text-muted mb-1">{day}</span>
            {/* Mock Events */}
            {day <= 5 && (
              <div className="px-1.5 py-0.5 bg-accent/20 border border-accent/30 rounded text-[9px] text-accent truncate">
                Daily Standup
              </div>
            )}
            {day === 5 && (
              <div className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[9px] text-emerald-400 truncate">
                Tech Debt Review
              </div>
            )}
            {day === 12 && (
              <div className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[9px] text-amber-400 truncate">
                Sprint Check
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Projects = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockProjects.map((project) => (
        <div key={project.id} className="bg-card border border-border rounded-xl p-5 card-hover flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">{project.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  project.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  project.status === 'Planning' ? 'bg-accent/10 border-accent/20 text-accent' :
                  'bg-muted/10 border-muted/20 text-muted'
                }`}>
                  {project.status}
                </span>
                <span className="text-[10px] text-muted font-mono">{project.taskCount} tasks</span>
              </div>
            </div>
            <MoreHorizontal size={16} className="text-muted cursor-pointer hover:text-text" />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted">Progress</span>
              <span className="text-text">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                className="h-full bg-accent"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-border flex justify-between items-center">
            <span className="text-[10px] text-muted">Last activity: {project.lastActivity}</span>
            <ChevronRight size={14} className="text-muted" />
          </div>
        </div>
      ))}
    </div>
  );
};

const Memory = () => {
  const [activeTab, setActiveTab] = useState<'Recent' | 'Long-term'>('Recent');
  const [selectedDate, setSelectedDate] = useState(mockMemories[0].date);
  
  const dates = Array.from(new Set(mockMemories.map(m => m.date)));
  const filteredMemories = mockMemories.filter(m => 
    activeTab === 'Recent' ? m.date === selectedDate : m.isPinned
  );

  return (
    <div className="flex h-full gap-6">
      {/* Date Sidebar */}
      <div className="w-64 border-r border-border pr-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium mb-2">Journal</h2>
          {dates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selectedDate === date && activeTab === 'Recent' ? 'bg-white/5 text-text' : 'text-muted hover:text-text hover:bg-white/5'
              }`}
            >
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex gap-4 border-b border-border pb-4">
          <button 
            onClick={() => setActiveTab('Recent')}
            className={`text-xs font-medium transition-colors relative ${activeTab === 'Recent' ? 'text-accent' : 'text-muted hover:text-text'}`}
          >
            Recent Memories
            {activeTab === 'Recent' && <motion.div layoutId="mem-tab" className="absolute -bottom-4 left-0 right-0 h-0.5 bg-accent" />}
          </button>
          <button 
            onClick={() => setActiveTab('Long-term')}
            className={`text-xs font-medium transition-colors relative ${activeTab === 'Long-term' ? 'text-accent' : 'text-muted hover:text-text'}`}
          >
            Long-term Memories
            {activeTab === 'Long-term' && <motion.div layoutId="mem-tab" className="absolute -bottom-4 left-0 right-0 h-0.5 bg-accent" />}
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide">
          {filteredMemories.map(memory => (
            <div key={memory.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2 relative group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-muted" />
                  <span className="text-[10px] font-mono text-muted">{memory.timestamp}</span>
                </div>
                {memory.isPinned && <Pin size={12} className="text-accent fill-accent" />}
              </div>
              <p className="text-xs text-text/90 leading-relaxed">{memory.content}</p>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={14} className="text-muted cursor-pointer hover:text-text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Docs = () => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(mockDocs[0]);
  const categories = ['All', 'Planning', 'PRD', 'Newsletter', 'Architecture', 'Research'];

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} className="px-3 py-1 bg-white/5 border border-border rounded-full text-[10px] text-muted hover:text-text hover:border-muted transition-colors whitespace-nowrap">
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col border border-border rounded-lg overflow-hidden">
          {mockDocs.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => setSelectedDoc(doc)}
              className={`flex items-center justify-between p-4 border-b border-border last:border-0 cursor-pointer transition-colors ${
                selectedDoc?.id === doc.id ? 'bg-accent/5' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-medium">{doc.title}</h4>
                  <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-muted font-mono">{doc.format}</span>
                </div>
                <p className="text-[11px] text-muted line-clamp-1">{doc.preview}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-muted font-mono">{doc.createdDate}</span>
                <ChevronRight size={14} className="text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Panel */}
      <AnimatePresence mode="wait">
        {selectedDoc && (
          <motion.div 
            key={selectedDoc.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-96 bg-card border border-border rounded-xl p-6 flex flex-col gap-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">{selectedDoc.category}</span>
                <h2 className="text-lg font-medium">{selectedDoc.title}</h2>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 text-muted hover:text-text transition-colors"><Download size={16} /></button>
                <button className="p-1.5 text-muted hover:text-text transition-colors"><ExternalLink size={16} /></button>
              </div>
            </div>
            
            <div className="flex-1 text-xs text-text/80 leading-relaxed overflow-y-auto scrollbar-hide">
              <p className="mb-4">{selectedDoc.preview}</p>
              <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-between items-center text-[10px] text-muted font-mono">
              <span>Created: {selectedDoc.createdDate}</span>
              <span>Size: 1.2 MB</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Team = () => {
  const lead = mockTeam.find(m => !m.parentId);
  const members = mockTeam.filter(m => m.parentId === lead?.id);

  return (
    <div className="flex flex-col gap-8">
      {/* Banner */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 text-center">
        <h2 className="text-sm font-medium text-accent mb-2 italic">"Building the future of autonomous agent orchestration."</h2>
        <p className="text-xs text-muted">Mission Statement: To create a seamless interface between human intent and machine execution.</p>
      </div>

      {/* Org Chart */}
      <div className="flex flex-col items-center gap-12">
        {/* Lead Agent */}
        {lead && <AgentCard member={lead} isLead />}
        
        {/* Connection Lines (Visual only) */}
        <div className="relative w-full max-w-4xl h-px bg-border">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-border -translate-y-full" />
          <div className="absolute top-0 left-0 w-px h-6 bg-border" />
          <div className="absolute top-0 right-0 w-px h-6 bg-border" />
          <div className="absolute top-0 left-1/2 w-px h-6 bg-border" />
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {members.map(member => (
            <AgentCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AgentCard: React.FC<{ member: TeamMember; isLead?: boolean }> = ({ member, isLead }) => {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 flex flex-col gap-4 relative ${isLead ? 'w-80' : 'flex-1'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
          isLead ? 'bg-accent text-white' : 'bg-white/5 text-muted'
        }`}>
          {member.name[0]}
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-medium">{member.name}</h3>
          <span className="text-[10px] text-muted">{member.role}</span>
        </div>
        <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted'}`} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Model</span>
          <span className="text-[11px] font-medium">{member.model}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Device</span>
          <span className="text-[11px] font-medium">{member.deviceInfo}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Current Task</span>
        <span className="text-[11px] text-text/80 line-clamp-1">{member.currentTask}</span>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('Task Board');

  return (
    <div className="min-h-screen pl-16">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="p-8 max-w-[1440px] mx-auto h-screen flex flex-col">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium">{activeView}</h1>
            <span className="text-xs font-mono text-muted bg-white/5 px-2 py-0.5 rounded">v1.0.4-beta</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full border-2 border-bg bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">J</div>
              <div className="w-7 h-7 rounded-full border-2 border-bg bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">H</div>
            </div>
            <button className="p-2 text-muted hover:text-text transition-colors">
              <AlertCircle size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === 'Task Board' && <TaskBoard />}
              {activeView === 'Calendar' && <Calendar />}
              {activeView === 'Projects' && <Projects />}
              {activeView === 'Memory' && <Memory />}
              {activeView === 'Docs' && <Docs />}
              {activeView === 'Team' && <Team />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
