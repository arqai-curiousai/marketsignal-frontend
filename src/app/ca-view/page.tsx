// app/ca/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Clock,
  BarChart3,
  Calendar,
  TrendingUp,
  Upload,
  Bot,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Download,
  Filter,
  Plus,
  MessageCircle,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StatCard {
  id: string;
  label: string;
  value: string | number;
  trend: {
    value: string;
    positive: boolean;
  };
  icon: React.ElementType;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
}

interface Deadline {
  id: string;
  type: 'GST' | 'TDS' | 'ITR' | 'AUDIT' | 'ROC';
  client: string;
  title: string;
  dueDate: string;
  status: 'due-soon' | 'upcoming';
}

interface Activity {
  id: string;
  type: 'upload' | 'reconciliation' | 'insight' | 'filing';
  client: string;
  description: string;
  timestamp: string;
}

interface Client {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'overdue';
  upcomingTasks: number;
}

interface AIPrompt {
  id: string;
  text: string;
  category: 'reconciliation' | 'query' | 'report' | 'analysis';
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const colors = {
  emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
  amber: 'from-amber-500/20 to-yellow-500/20 text-amber-400',
  blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
  purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
  red: 'from-red-500/20 to-rose-500/20 text-red-400',
} as const;

const badgeStyles = {
  'due-soon': 'bg-red-500/10 text-red-400 border-red-500/30',
  upcoming: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/30',
} as const;

// ============================================================================
// REUSABLE COMPONENTS (Single Responsibility Principle)
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => (
  <motion.div
    className={`
      bg-gradient-to-br from-slate-900/90 to-slate-800/70 backdrop-blur-xl
      border border-slate-700/50 rounded-2xl shadow-xl
      transition-all duration-300
      ${hover ? 'hover:border-amber-500/30 hover:shadow-2xl' : ''}
      ${className}
    `}
    whileHover={hover ? { y: -2 } : undefined}
  >
    {children}
  </motion.div>
);

interface BadgeProps {
  children: React.ReactNode;
  variant: keyof typeof badgeStyles;
}

const Badge: React.FC<BadgeProps> = ({ children, variant }) => (
  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border rounded-full ${badgeStyles[variant]}`}>
    {children}
  </span>
);

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatisticCard: React.FC<StatCard> = ({ label, value, trend, icon: Icon, color }) => (
  <Card hover className="p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-400 mb-2">{label}</p>
        <h3 className="text-3xl font-bold text-slate-50 mb-2">{value}</h3>
        <div className={`flex items-center gap-1 text-sm ${trend.positive ? 'text-emerald-400' : 'text-amber-400'}`}>
          <TrendingUp className={`w-4 h-4 ${!trend.positive && 'rotate-180'}`} />
          <span>{trend.value}</span>
        </div>
      </div>
      <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-xl`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </Card>
);

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users, badge: 5 },
    { id: 'documents', label: 'Documents', icon: FileText, badge: 12 },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle2 },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border-r border-slate-700/50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-50">Arthasarthi</h1>
              <p className="text-xs text-slate-400">CA Workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onSectionChange(item.id);
              onClose();
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
              ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-50'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center text-slate-950 font-bold">
            RK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-50 truncate">CA Rajesh Kumar</p>
            <p className="text-xs text-slate-400 truncate">rajesh@kumar.com</p>
          </div>
          <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// AI ASSISTANT PANEL
// ============================================================================

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');

  const quickPrompts: AIPrompt[] = [
    { id: '1', text: 'Reconcile GSTR-2B with purchase register', category: 'reconciliation' },
    { id: '2', text: 'Summarize 26AS vs books mismatches', category: 'query' },
    { id: '3', text: 'Draft mail to client about GST notice', category: 'report' },
    { id: '4', text: 'Explain latest change in ITC rules', category: 'query' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-slate-900 border-l border-slate-700/50 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg">
                    <Bot className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-50">Arthasarthi Copilot</h2>
                    <p className="text-sm text-slate-400">Grounded in tax laws & your vault</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* AI Welcome Message */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-sm p-4">
                      <p className="text-sm text-slate-200">
                        Hello! I'm your AI assistant specialized in tax laws, 26AS, GST & your vault. How can I help you today?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">Suggested actions:</p>
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => setMessage(prompt.text)}
                      className="w-full text-left p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl text-sm text-slate-300 hover:bg-slate-800/50 hover:border-amber-500/30 hover:text-amber-400 transition-all"
                    >
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything about tax, GST, reconciliation..."
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/50 transition-all">
                  Send
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  View sources
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CADashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Mock Data
  const stats: StatCard[] = [
    {
      id: '1',
      label: 'Active Clients',
      value: '47',
      trend: { value: '+3 this month', positive: true },
      icon: Users,
      color: 'emerald',
    },
    {
      id: '2',
      label: 'Pending Actions',
      value: '12',
      trend: { value: '8 due soon', positive: false },
      icon: AlertCircle,
      color: 'amber',
    },
    {
      id: '3',
      label: 'Documents Processed',
      value: '234',
      trend: { value: '+45 this week', positive: true },
      icon: FileText,
      color: 'blue',
    },
    {
      id: '4',
      label: 'Time Saved',
      value: '156h',
      trend: { value: 'This month', positive: true },
      icon: Clock,
      color: 'purple',
    },
  ];

  const upcomingDeadlines: Deadline[] = [
    { id: '1', type: 'GST', client: 'ABC Ltd', title: 'GST Return Filing - Client ABC Ltd', dueDate: '20/11/2025', status: 'due-soon' },
    { id: '2', type: 'TDS', client: 'XYZ Pvt Ltd', title: 'TDS Quarterly Return - Client XYZ Pvt Ltd', dueDate: '25/11/2025', status: 'upcoming' },
    { id: '3', type: 'AUDIT', client: 'PQR Corp', title: 'Audit Report Submission - Client PQR Corp', dueDate: '30/11/2025', status: 'upcoming' },
    { id: '4', type: 'ITR', client: 'John Doe', title: 'ITR Filing - Client John Doe', dueDate: '05/12/2025', status: 'upcoming' },
  ];

  const recentActivity: Activity[] = [
    { id: '1', type: 'upload', client: 'ABC Ltd', description: 'Bank statement for Sep 2025', timestamp: '2 hours ago' },
    { id: '2', type: 'reconciliation', client: 'XYZ Pvt Ltd', description: 'GST ITC matching - 100% matched', timestamp: '5 hours ago' },
    { id: '3', type: 'insight', client: 'PQR Corp', description: 'Tax saving opportunity identified', timestamp: '1 day ago' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#050810] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-50">Practice Dashboard</h1>
                <p className="text-sm text-slate-400">Manage your clients and compliance workflows</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* AI Assistant Button */}
              <button
                onClick={() => setIsAIOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl text-amber-400 hover:border-amber-500/50 transition-all"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">AI Assistant</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatisticCard {...stat} />
                </motion.div>
              ))}
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Deadlines */}
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-red-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-50">Upcoming Deadlines</h2>
                  </div>
                  <button className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <motion.div
                      key={deadline.id}
                      whileHover={{ x: 4 }}
                      className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl hover:bg-slate-800/50 hover:border-slate-600/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={deadline.status}>{deadline.type}</Badge>
                            <span className="text-xs text-slate-400">{deadline.client}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-200 mb-1">{deadline.title}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>Due {deadline.dueDate}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-50">Recent Activity</h2>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-amber-400 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{activity.type === 'upload' ? 'Document uploaded' : activity.type === 'reconciliation' ? 'Reconciliation completed' : 'AI Insight generated'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{activity.client}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-50 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Upload, label: 'Upload Documents', color: colors.amber },
                  { icon: Bot, label: 'Ask AI Assistant', color: colors.blue },
                  { icon: Users, label: 'Add New Client', color: colors.emerald },
                  { icon: Download, label: 'Generate Report', color: colors.purple },
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 bg-gradient-to-br ${action.color} rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all text-left group`}
                  >
                    <action.icon className="w-8 h-8 mb-3" />
                    <p className="text-sm font-medium text-slate-200">{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}