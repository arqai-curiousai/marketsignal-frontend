// app/citizen/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle2,
  Sparkles,
  Upload,
  Bot,
  BookOpen,
  Download,
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  Folder,
  BarChart3,
  Home,
  Receipt,
  PiggyBank,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInitials, getUserDisplayName, formatUserEmail } from '@/lib/utils/user.utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StatCard {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: React.ElementType;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
  trend?: string;
}

interface Insight {
  id: string;
  type: 'opportunity' | 'action' | 'warning';
  title: string;
  description: string;
  impact?: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadDate: string;
  size: string;
  status: 'processed' | 'processing' | 'pending';
}

interface ProgressItem {
  id: string;
  label: string;
  completed: boolean;
}

interface AIPrompt {
  id: string;
  text: string;
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

const statusStyles = {
  processed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  processing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  pending: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
} as const;

// ============================================================================
// REUSABLE COMPONENTS
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
  variant: 'success' | 'warning' | 'danger' | 'info';
}

const Badge: React.FC<BadgeProps> = ({ children, variant }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border rounded-full ${styles[variant]}`}>
      {children}
    </span>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatisticCard: React.FC<StatCard> = ({ label, value, sublabel, icon: Icon, color, trend }) => (
  <Card hover className="p-6">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-slate-400">{label}</p>
      <div className={`p-2.5 bg-gradient-to-br ${colors[color]} rounded-lg`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-slate-50 mb-1">{value}</h3>
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-400">{sublabel}</p>
      {trend && <p className="text-xs text-emerald-400">{trend}</p>}
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
  user: {
    displayName: string;
    email: string;
    initials: string;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'documents', label: 'My Documents', icon: Folder, badge: 3 },
    { id: 'filing', label: 'Tax Filing', icon: FileText },
    { id: 'savings', label: 'Tax Savings', icon: PiggyBank },
    { id: 'ai-assistant', label: 'Ask AI', icon: MessageCircle },
    { id: 'learn', label: 'Learn', icon: BookOpen },
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
              <p className="text-xs text-slate-400">AI Tax Copilot</p>
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
              ${activeSection === item.id
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
            {user?.initials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-50 truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'Not logged in'}</p>
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
    { id: '1', text: 'Can you review my Form 16 and suggest extra deductions?' },
    { id: '2', text: 'Should I choose old or new tax regime?' },
    { id: '3', text: 'How much more can I invest under 80C?' },
    { id: '4', text: 'Explain HRA exemption in simple language' },
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
                    <h2 className="text-lg font-semibold text-slate-50">Arthasarthi AI</h2>
                    <p className="text-sm text-slate-400">Your personal tax advisor</p>
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
                        Hi! I'm here to help you save money on taxes and make filing easy. What would you like to know?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">Quick questions:</p>
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
                  placeholder="Ask me anything about taxes..."
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/50 transition-all">
                  Send
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

export default function CitizenDashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user: authUser } = useAuth();

  // Compute user display properties
  const user = authUser ? {
    displayName: getUserDisplayName(authUser),
    email: formatUserEmail(authUser.email),
    initials: getUserInitials(getUserDisplayName(authUser)),
  } : null;

  // Mock Data
  const stats: StatCard[] = [
    {
      id: '1',
      label: 'Potential Tax Savings',
      value: '₹24,500',
      sublabel: 'Identified',
      icon: TrendingUp,
      color: 'emerald',
      trend: 'NEW',
    },
    {
      id: '2',
      label: 'Documents Uploaded',
      value: '12',
      sublabel: '3 pending review',
      icon: FileText,
      color: 'blue',
    },
    {
      id: '3',
      label: 'Deductions Claimed',
      value: '₹1.5L',
      sublabel: 'Out of ₹2L limit',
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      id: '4',
      label: 'Days Until Filing',
      value: '45',
      sublabel: 'Deadline: Dec 31',
      icon: Calendar,
      color: 'amber',
    },
  ];

  const insights: Insight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Maximize 80C Deduction',
      description: 'You can invest an additional ₹50,000 in ELSS or PPF to claim full 80C benefit and save ₹15,600 in taxes.',
      impact: '₹15,600',
      priority: 'high',
      action: 'Invest Now',
    },
    {
      id: '2',
      type: 'action',
      title: 'Submit Rent Receipts',
      description: 'Upload rent receipts to claim HRA exemption and save approximately ₹8,900 in taxes.',
      impact: '₹8,900',
      priority: 'high',
      action: 'Upload Receipts',
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Health Insurance Premium',
      description: 'Consider increasing health insurance coverage to claim up to ₹25,000 deduction under Section 80D.',
      priority: 'medium',
      action: 'Explore Options',
    },
  ];

  const recentDocuments: Document[] = [
    { id: '1', name: 'Form 16 - TechCorp India', type: 'PDF', category: 'Income', uploadDate: '10 Nov 2025', size: '2.4 MB', status: 'processed' },
    { id: '2', name: 'SBI Bank Statement - Oct 2025', type: 'PDF', category: 'Income', uploadDate: '12 Nov 2025', size: '1.8 MB', status: 'processed' },
    { id: '3', name: 'LIC Premium Receipt', type: 'PDF', category: 'Deductions', uploadDate: '14 Nov 2025', size: '856 KB', status: 'processing' },
  ];

  const progressItems: ProgressItem[] = [
    { id: '1', label: 'Income Details', completed: true },
    { id: '2', label: 'Deductions & Investments', completed: true },
    { id: '3', label: 'Document Upload', completed: false },
    { id: '4', label: 'Review & Submit', completed: false },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#050810] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
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
                <h1 className="text-2xl font-bold text-slate-50">Financial Wellness Dashboard</h1>
                <p className="text-sm text-slate-400">Your partner in smarter tax planning and financial compliance</p>
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
                <span className="hidden sm:inline text-sm font-medium">Ask AI</span>
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

            {/* AI Insights */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-50">AI-Powered Insights</h2>
                    <p className="text-sm text-slate-400">Personalized recommendations to optimize your taxes</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-5 bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-slate-700/30 rounded-xl hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl ${insight.type === 'opportunity' ? colors.emerald :
                          insight.type === 'warning' ? colors.red : colors.amber
                        }`}>
                        {insight.type === 'opportunity' ? <TrendingUp className="w-5 h-5" /> :
                          insight.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                            <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-slate-50">{insight.title}</h3>
                          {insight.impact && (
                            <Badge variant="success">Save {insight.impact}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{insight.description}</p>
                        <div className="flex items-center gap-3">
                          <Badge variant={insight.priority === 'high' ? 'danger' : 'warning'}>
                            {insight.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <button className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
                            {insight.action} <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Documents */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                      <Folder className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-50">Recent Documents</h2>
                  </div>
                  <button className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {recentDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      whileHover={{ x: 4 }}
                      className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl hover:bg-slate-800/50 hover:border-slate-600/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg">
                          <FileText className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{doc.size}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-400">{doc.uploadDate}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium border rounded-full ${statusStyles[doc.status]}`}>
                          {doc.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload New Document</span>
                </motion.button>
              </Card>

              {/* Filing Progress */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-50">Filing Progress</h2>
                    <p className="text-sm text-slate-400">FY 2024-25</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {progressItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${item.completed
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                          }`}>
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </div>
                        {index < progressItems.length - 1 && (
                          <div className={`w-0.5 h-8 ml-5 ${item.completed ? 'bg-emerald-500/30' : 'bg-slate-700/30'
                            }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.completed ? 'text-slate-200' : 'text-slate-400'
                          }`}>
                          {item.label}
                        </p>
                        {item.completed && (
                          <p className="text-xs text-emerald-400 mt-0.5">Completed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full mt-6 p-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/50 transition-all flex items-center justify-center gap-2"
                >
                  Continue Filing
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}