// app/ca/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  FileText,
  Clock,
  Sparkles,
  Bot,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  Settings,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserInitials,
  getUserDisplayName,
  formatUserEmail,
} from '@/lib/utils/user.utils';

// ============================================================================
// TYPES
// ============================================================================

interface CaDashboardResponse {
  stats: {
    activeClients: number;
    pendingFilingsThisMonth: number;
    avgHoursSavedPerWeek: number;
    deepvueCoveragePercent: number;
  };
  clients: Array<{
    id: string;
    name: string;
    pan: string;
    gstin?: string;
    status: 'onboarding' | 'in-progress' | 'ready-to-file' | 'filed';
    nextDeadlineLabel: string;
    riskLevel: 'low' | 'medium' | 'high';
    tasksDue: number;
  }>;
  deadlines: Array<{
    id: string;
    label: string;
    clientName: string | null;
    dueDate: string;
    type: 'GST' | 'ITR' | 'TDS' | 'Audit';
    urgency: 'due-soon' | 'upcoming';
  }>;
  documentQueue: Array<{
    id: string;
    clientName: string;
    fileName: string;
    type: 'pan' | 'gstin' | 'bank' | 'invoice' | 'other';
    uploadedAt: string;
    status: 'processing' | 'ready' | 'failed';
  }>;
  insights: Array<{
    id: string;
    title: string;
    impact: 'time' | 'revenue' | 'risk';
    summary: string;
    suggestedAction: string;
  }>;
}

// ============================================================================
// DESIGN TOKENS – SAFFRON + ZEN
// ============================================================================

const saffron = {
  primary: 'from-[#FF8A00] via-[#FFB547] to-[#FFDC8A]',
  soft: 'from-[#FF8A00]/10 via-[#FFB547]/10 to-transparent',
  pill: 'bg-[#24140A] text-[#FFB547] border border-[#FF8A00]/40',
};

const bg = {
  base: 'bg-[#050608]',
  card: 'bg-gradient-to-br from-[#0B0C10] via-[#050608] to-[#050608]',
  subtle: 'bg-[#090B10]',
};

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover }) => (
  <motion.div
    className={`
      ${bg.card} border border-white/5 rounded-2xl shadow-lg
      transition-all duration-300
      ${hover ? 'hover:border-[#FFB547]/50 hover:shadow-xl' : ''}
      ${className}
    `}
    whileHover={hover ? { y: -2 } : undefined}
  >
    {children}
  </motion.div>
);

const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`h-3 rounded-full bg-white/5 animate-pulse ${className}`}
  />
);

// ============================================================================
// DATA HOOK
// ============================================================================

const useCaDashboard = () => {
  const [data, setData] = useState<CaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ca/dashboard');
        if (!res.ok) {
          throw new Error('Failed to load dashboard');
        }
        const json: CaDashboardResponse = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Unable to load CA workspace right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
};

// ============================================================================
// SIDEBAR
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

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  user,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'deadlines', label: 'Deadlines', icon: Calendar },
    { id: 'ai', label: 'AI Workspace', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const content = (
    <div
      className={`flex h-full flex-col border-r border-white/5 bg-gradient-to-b ${bg.base} from-black/80 to-black/95 backdrop-blur-xl`}
    >
      {/* Logo */}
      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
                inline-flex h-10 w-10 items-center justify-center rounded-2xl
                bg-gradient-to-br ${saffron.primary}
              `}
            >
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold tracking-wide text-white">
                Arthasarthi
              </p>
              <p className="text-xs text-white/60">CA Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-full p-1 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                onClose();
              }}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm
                transition-all
                ${
                  active
                    ? 'bg-gradient-to-r from-[#2A190D] to-transparent text-[#FFB547] border border-[#FF8A00]/40'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
          <div
            className={`
              flex h-9 w-9 items-center justify-center rounded-full
              bg-gradient-to-br ${saffron.primary} text-xs font-semibold text-black
            `}
          >
            {user?.initials ?? 'CA'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user?.displayName ?? 'CA User'}
            </p>
            <p className="truncate text-[11px] text-white/60">
              {user?.email ?? 'Not signed in'}
            </p>
          </div>
          <button className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 lg:block">{content}</aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// AI PANEL (SLIDE-OVER)
// ============================================================================

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ open, onClose }) => {
  const [message, setMessage] = useState('');

  const quickPrompts = [
    'Summarize mismatches between 26AS and books for Client A.',
    'Show ITC risk and blocked credits for my top 10 GST clients.',
    'Draft a mail to client about GST return delay with penalties.',
    'Explain implications of 206AB for my high-risk deductees.',
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/5 ${bg.subtle}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-xl
                      bg-gradient-to-br ${saffron.primary}
                    `}
                  >
                    <Bot className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Arthasarthi Copilot
                    </p>
                    <p className="text-[11px] text-white/60">
                      For CA workflows & notices
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm text-white/80">
                <p className="text-xs text-white/50">
                  Ask anything about GST, ITR, notices, reconciliations.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setMessage(p)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-[11px] text-white/80 hover:border-[#FFB547]/40 hover:bg-white/10"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the client / notice / query..."
                      className="h-full w-full resize-none bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                  <button
                    className={`
                      flex h-9 w-9 items-center justify-center rounded-2xl
                      bg-gradient-to-br ${saffron.primary} text-black
                    `}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const CaDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const { data, loading, error } = useCaDashboard();

  const userMeta = user
    ? {
        displayName: getUserDisplayName(user),
        email: formatUserEmail(user),
        initials: getUserInitials(user),
      }
    : null;

  const stats = data?.stats;

  return (
    <div className={`flex min-h-screen ${bg.base} text-white`}>
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userMeta}
      />

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050608]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Dashboard
                </p>
                <h1 className="text-sm font-semibold text-white">
                  CA Command Center
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/60 sm:flex">
                <Search className="h-3.5 w-3.5" />
                <input
                  placeholder="Search clients, PAN, GSTIN..."
                  className="w-40 bg-transparent text-[11px] text-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => setAiOpen(true)}
                className={`
                  hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium
                  bg-gradient-to-r ${saffron.soft} text-[#FFB547]
                  border border-[#FF8A00]/40 hover:border-[#FFDC8A]/70 sm:flex
                `}
              >
                <Bot className="h-3.5 w-3.5" />
                Ask Copilot
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
          {/* Error */}
          {error && (
            <Card className="mb-4 border-red-500/40 bg-red-950/40">
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Top summary row */}
          <div className="grid gap-3 md:grid-cols-4">
            <Card hover className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">Active clients</p>
                <Users className="h-4 w-4 text-[#FFB547]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                {loading || !stats ? (
                  <SkeletonLine className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-2xl font-semibold">
                    {stats.activeClients}
                  </p>
                )}
                <span className="text-[11px] text-white/40">
                  Each client is a case workspace
                </span>
              </div>
            </Card>

            <Card hover className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">
                  Filings due this month
                </p>
                <FileText className="h-4 w-4 text-[#FFB547]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                {loading || !stats ? (
                  <SkeletonLine className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-2xl font-semibold">
                    {stats.pendingFilingsThisMonth}
                  </p>
                )}
                <span className="text-[11px] text-white/40">
                  Across GST / ITR / TDS
                </span>
              </div>
            </Card>

            <Card hover className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">
                  Hours saved / week (AI)
                </p>
                <Clock className="h-4 w-4 text-[#FFB547]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                {loading || !stats ? (
                  <SkeletonLine className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-2xl font-semibold">
                    {stats.avgHoursSavedPerWeek.toFixed(1)}
                  </p>
                )}
                <span className="text-[11px] text-white/40">
                  Reconciliation & working papers
                </span>
              </div>
            </Card>

            <Card hover className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">
                  Deepvue coverage
                </p>
                <Sparkles className="h-4 w-4 text-[#FFB547]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                {loading || !stats ? (
                  <SkeletonLine className="mt-1 h-6 w-14" />
                ) : (
                  <p className="text-2xl font-semibold">
                    {stats.deepvueCoveragePercent.toFixed(0)}%
                  </p>
                )}
                <span className="text-[11px] text-white/40">
                  Clients linked to GST / ITR / KYC feeds
                </span>
              </div>
            </Card>
          </div>

          {/* Middle grid */}
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {/* Client pipeline */}
            <Card className="lg:col-span-2" hover>
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-white/80">
                    Client pipeline
                  </p>
                  <p className="text-[11px] text-white/50">
                    Each client is a case: status, risk, next deadline.
                  </p>
                </div>
                <button className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 hover:border-[#FFB547]/40">
                  View all
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {loading && (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3"
                      >
                        <SkeletonLine className="w-32" />
                        <SkeletonLine className="w-16" />
                        <SkeletonLine className="w-20" />
                      </div>
                    ))}
                  </div>
                )}

                {!loading && data?.clients?.length === 0 && (
                  <div className="p-4 text-[11px] text-white/50">
                    No clients yet. Upload your first client’s PAN / GST
                    documents to create a workspace.
                  </div>
                )}

                {!loading &&
                  data?.clients?.slice(0, 6).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 px-4 py-3 text-xs"
                    >
                      <div className="flex-1">
                        <p className="text-[12px] font-medium text-white">
                          {client.name}
                        </p>
                        <p className="text-[11px] text-white/50">
                          PAN {client.pan}
                          {client.gstin && ` • GSTIN ${client.gstin}`}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end text-[11px] text-white/60 sm:flex">
                        <span className="mb-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px]">
                          {client.status.replace('-', ' ')}
                        </span>
                        <span>{client.nextDeadlineLabel}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[11px]">
                        <span
                          className={`
                            rounded-full px-2 py-0.5 text-[10px]
                            ${
                              client.riskLevel === 'high'
                                ? 'bg-red-500/15 text-red-300'
                                : client.riskLevel === 'medium'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }
                          `}
                        >
                          {client.riskLevel === 'high'
                            ? 'High risk'
                            : client.riskLevel === 'medium'
                            ? 'Watchlist'
                            : 'Stable'}
                        </span>
                        <span className="text-white/50">
                          {client.tasksDue} tasks
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Document intake + AI insights */}
            <div className="space-y-4">
              {/* Document queue */}
              <Card hover>
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-white/80">
                      Document intake
                    </p>
                    <p className="text-[11px] text-white/50">
                      Upload PAN / GST / bank docs – we OCR & auto-attach to
                      clients.
                    </p>
                  </div>
                  <button className="flex items-center gap-1 rounded-full border border-[#FF8A00]/60 bg-gradient-to-r from-[#2A190D] to-transparent px-3 py-1 text-[11px] text-[#FFB547]">
                    <Upload className="h-3.5 w-3.5" />
                    New upload
                  </button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto p-4 text-[11px]">
                  {loading && (
                    <>
                      <SkeletonLine className="w-40" />
                      <SkeletonLine className="w-28" />
                      <SkeletonLine className="w-32" />
                    </>
                  )}
                  {!loading && data?.documentQueue?.length === 0 && (
                    <p className="text-white/45">
                      No documents in queue. Drag & drop PDF, image or Excel to
                      start processing.
                    </p>
                  )}
                  {!loading &&
                    data?.documentQueue?.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="truncate text-[11px] font-medium text-white">
                            {doc.fileName}
                          </p>
                          <p className="truncate text-[10px] text-white/50">
                            {doc.clientName} • {doc.type.toUpperCase()}
                          </p>
                        </div>
                        <div className="ml-3 text-[10px] text-white/60">
                          {doc.status === 'processing' && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">
                              Processing…
                            </span>
                          )}
                          {doc.status === 'ready' && (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                              Attached
                            </span>
                          )}
                          {doc.status === 'failed' && (
                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-200">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Insights */}
              <Card hover>
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-white/80">
                      Copilot insights
                    </p>
                    <p className="text-[11px] text-white/50">
                      Suggestions to save hours & reduce risk.
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-[#FFB547]" />
                </div>
                <div className="space-y-2 p-4 text-[11px]">
                  {loading && (
                    <>
                      <SkeletonLine className="w-48" />
                      <SkeletonLine className="w-40" />
                    </>
                  )}
                  {!loading &&
                    data?.insights?.slice(0, 3).map((insight) => (
                      <div
                        key={insight.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <p className="mb-1 text-[11px] font-medium text-white">
                          {insight.title}
                        </p>
                        <p className="text-[11px] text-white/60">
                          {insight.summary}
                        </p>
                        <p className="mt-1 text-[10px] text-[#FFB547]">
                          {insight.suggestedAction}
                        </p>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Deadlines strip */}
          <Card className="mt-5" hover>
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-white/80">
                  Compliance calendar
                </p>
                <p className="text-[11px] text-white/50">
                  Upcoming GST, ITR, TDS & audit deadlines across clients.
                </p>
              </div>
              <Calendar className="h-4 w-4 text-[#FFB547]" />
            </div>
            <div className="flex flex-wrap gap-2 p-4 text-[11px]">
              {loading && (
                <>
                  <SkeletonLine className="h-5 w-32" />
                  <SkeletonLine className="h-5 w-40" />
                </>
              )}
              {!loading &&
                data?.deadlines?.slice(0, 10).map((d) => (
                  <div
                    key={d.id}
                    className={`
                      rounded-full border px-3 py-1
                      text-[11px]
                      ${
                        d.urgency === 'due-soon'
                          ? 'border-red-500/40 bg-red-500/10 text-red-100'
                          : 'border-[#FF8A00]/40 bg-[#2A190D] text-[#FFDC8A]'
                      }
                    `}
                  >
                    <span className="font-medium">{d.label}</span>
                    {d.clientName && <span> • {d.clientName}</span>}
                  </div>
                ))}
            </div>
          </Card>
        </main>
      </div>

      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default CaDashboardPage;
