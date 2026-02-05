// app/citizen/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  PiggyBank,
  FileText,
  Calendar,
  Bot,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  Settings,
  Bell,
  ArrowUpRight,
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

interface CitizenDashboardResponse {
  summary: {
    fyLabel: string;
    taxPosition: 'refund' | 'payable' | 'neutral';
    estimatedAmount: number;
    potentialSavings: number;
    taxHealthScore: number; // 0-100
    recommendedRegime: 'old' | 'new';
  };
  nextSteps: Array<{
    id: string;
    label: string;
    category: 'documents' | 'investment' | 'filing';
    completed: boolean;
  }>;
  documents: Array<{
    id: string;
    name: string;
    category: 'form16' | 'rent' | 'investment' | 'health' | 'donation' | 'other';
    fy: string;
    status: 'processed' | 'processing' | 'pending';
  }>;
  insights: Array<{
    id: string;
    title: string;
    type: 'saving' | 'warning' | 'info';
    body: string;
    savingAmount?: number;
  }>;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const saffron = {
  primary: 'from-[#FF8A00] via-[#FFB547] to-[#FFDC8A]',
  soft: 'from-[#FF8A00]/20 via-[#FFB547]/20 to-transparent',
};

const bg = {
  base: 'bg-[#050608]',
  card: 'bg-gradient-to-br from-[#0A0B0F] via-[#050608] to-[#050608]',
};

// ============================================================================
// REUSABLES
// ============================================================================

const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({
  children,
  className = '',
  hover,
}) => (
  <motion.div
    className={`
      ${bg.card} border border-white/5 rounded-2xl shadow-lg
      transition-all duration-300
      ${hover ? 'hover:border-[#FFB547]/60 hover:shadow-xl' : ''}
      ${className}
    `}
    whileHover={hover ? { y: -2 } : undefined}
  >
    {children}
  </motion.div>
);

const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-3 rounded-full bg-white/5 animate-pulse ${className}`} />
);

// ============================================================================
// DATA HOOK
// ============================================================================

const useCitizenDashboard = () => {
  const [data, setData] = useState<CitizenDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/citizen/dashboard');
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json: CitizenDashboardResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Unable to load your tax summary right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
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
    { id: 'home', label: 'Overview', icon: PiggyBank },
    { id: 'documents', label: 'Document Vault', icon: FileText },
    { id: 'planner', label: 'Tax Planner', icon: Calendar },
    { id: 'ai', label: 'Ask Copilot', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const content = (
    <div className={`flex h-full flex-col border-r border-white/5 ${bg.base}`}>
      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
                flex h-10 w-10 items-center justify-center rounded-2xl
                bg-gradient-to-br ${saffron.primary}
              `}
            >
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Arthasarthi</p>
              <p className="text-xs text-white/60">Your Tax Copilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = item.id === activeSection;
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
      <div className="border-t border-white/5 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5">
          <div
            className={`
              flex h-9 w-9 items-center justify-center rounded-full
              bg-gradient-to-br ${saffron.primary} text-xs font-semibold text-black
            `}
          >
            {user?.initials ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user?.displayName ?? 'Guest user'}
            </p>
            <p className="truncate text-[11px] text-white/60">
              {user?.email ?? 'Not signed in'}
            </p>
          </div>
          <button className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-red-400">
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
// AI PANEL
// ============================================================================

const CitizenAIPanel: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const [message, setMessage] = useState('');

  const quickPrompts = [
    'Can you read my Form 16 and tell me if I am missing any deductions?',
    'Should I stay in old regime or move to new regime this year?',
    'How much more can I invest under Section 80C and 80D?',
    'Explain in simple words why my tax refund reduced this year.',
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
            className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/5 ${bg.base}`}
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
                      Ask Arthasarthi
                    </p>
                    <p className="text-[11px] text-white/60">
                      Friendly tax answers, 24x7
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
                  Use simple language – we’ll translate tax jargon for you.
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
                      placeholder="Tell us what confuses you about your tax..."
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

const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error } = useCitizenDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const userMeta = user
    ? {
        displayName: getUserDisplayName(user),
        email: formatUserEmail(user),
        initials: getUserInitials(user),
      }
    : null;

  const summary = data?.summary;

  const positionLabel =
    summary?.taxPosition === 'refund'
      ? 'Estimated refund'
      : summary?.taxPosition === 'payable'
      ? 'Estimated payable'
      : 'Estimated tax position';

  return (
    <div className={`flex min-h-screen ${bg.base} text-white`}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={userMeta}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050608]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Dashboard
                </p>
                <h1 className="text-sm font-semibold text-white">
                  Your Tax Home
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-white/10 bg-black/40 p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
                <Bell className="h-4 w-4" />
              </button>
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

        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
          {error && (
            <Card className="mb-4 border-red-500/40 bg-red-950/40">
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-red-100">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Hero: tax position + health */}
          <div className="grid gap-4 md:grid-cols-[2fr,1.4fr]">
            <Card hover className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-white/60">
                    {summary?.fyLabel ?? 'Current financial year'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white">
                    {positionLabel}
                  </p>
                  <div className="mt-2">
                    {loading || !summary ? (
                      <SkeletonLine className="h-7 w-24" />
                    ) : (
                      <p className="text-3xl font-semibold">
                        ₹{summary.estimatedAmount.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-white/60">
                    We read your ITR / 26AS via secure integrations and keep
                    this updated as you upload documents.
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-2 text-right text-[11px] text-white/60 sm:flex">
                  <div
                    className={`
                      inline-flex flex-col items-end rounded-2xl border border-[#FFB547]/40
                      bg-gradient-to-br from-[#2A190D] to-transparent px-3 py-2
                    `}
                  >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#FFDC8A]">
                      Tax health
                    </span>
                    {loading || !summary ? (
                      <SkeletonLine className="mt-1 h-5 w-10" />
                    ) : (
                      <span className="mt-1 text-xl font-semibold text-[#FFDC8A]">
                        {summary.taxHealthScore}/100
                      </span>
                    )}
                    {summary && (
                      <span className="mt-1 text-[10px] text-[#FFB547]">
                        Recommended: {summary.recommendedRegime.toUpperCase()}{' '}
                        regime
                      </span>
                    )}
                  </div>
                  <button className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#FFB547] hover:text-[#FFDC8A]">
                    View how this is calculated
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
                {loading || !summary ? (
                  <SkeletonLine className="h-4 w-40" />
                ) : (
                  <div
                    className="inline-flex items-center gap-1 rounded-full border border-[#FF8A00]/40
                    bg-[#25150B] px-3 py-1 text-[#FFDC8A]"
                  >
                    <PiggyBank className="h-3.5 w-3.5" />
                    Potential savings this year:
                    <span className="font-semibold">
                      ₹{summary.potentialSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <span className="text-white/50">
                  We’ll show you legal, CA-grade ways to reduce this.
                </span>
              </div>
            </Card>

            {/* Next steps checklist */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80">
                    Simple next steps
                  </p>
                  <p className="text-[11px] text-white/60">
                    Do these and your taxes are basically done.
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-[#FFB547]" />
              </div>
              <div className="mt-3 space-y-2 text-[11px]">
                {loading && (
                  <>
                    <SkeletonLine className="w-40" />
                    <SkeletonLine className="w-32" />
                    <SkeletonLine className="w-28" />
                  </>
                )}
                {!loading &&
                  data?.nextSteps?.map((step) => (
                    <label
                      key={step.id}
                      className={`
                        flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2
                        ${
                          step.completed
                            ? 'opacity-70'
                            : 'hover:border-[#FFB547]/40'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="h-3 w-3 rounded border-white/30 bg-black"
                        defaultChecked={step.completed}
                      />
                      <div className="flex-1">
                        <p className="text-[11px] text-white">
                          {step.label}
                        </p>
                        <p className="text-[10px] text-white/50">
                          {step.category === 'documents'
                            ? 'Document'
                            : step.category === 'investment'
                            ? 'Investment'
                            : 'Filing step'}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            </Card>
          </div>

          {/* Middle: document vault + insights */}
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.7fr,1.3fr]">
            {/* Document vault */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <p className="text-xs font-medium text-white/80">
                    Document vault
                  </p>
                  <p className="text-[11px] text-white/60">
                    Upload Form 16, rent receipts, medical bills – we read and
                    organize everything.
                  </p>
                </div>
                <button
                  className={`
                    inline-flex items-center gap-1 rounded-full border border-[#FF8A00]/60
                    bg-gradient-to-r from-[#2A190D] to-transparent px-3 py-1 text-[11px]
                    text-[#FFB547]
                  `}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </button>
              </div>
              <div className="mt-3 grid gap-2 text-[11px] md:grid-cols-2">
                {loading && (
                  <>
                    <SkeletonLine className="h-5 w-full" />
                    <SkeletonLine className="h-5 w-full" />
                    <SkeletonLine className="h-5 w-full" />
                  </>
                )}
                {!loading &&
                  data?.documents?.slice(0, 6).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="truncate text-[11px] text-white">
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-white/50">
                          {doc.category.toUpperCase()} • {doc.fy}
                        </p>
                      </div>
                      <div className="ml-2 text-[10px]">
                        {doc.status === 'processing' && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">
                            Reading…
                          </span>
                        )}
                        {doc.status === 'processed' && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                            Ready
                          </span>
                        )}
                        {doc.status === 'pending' && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Insights */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <p className="text-xs font-medium text-white/80">
                    Smart insights
                  </p>
                  <p className="text-[11px] text-white/60">
                    CA-style advice in simple words.
                  </p>
                </div>
                <PiggyBank className="h-4 w-4 text-[#FFB547]" />
              </div>
              <div className="mt-3 space-y-2 text-[11px]">
                {loading && (
                  <>
                    <SkeletonLine className="w-48" />
                    <SkeletonLine className="w-44" />
                  </>
                )}
                {!loading &&
                  data?.insights?.slice(0, 4).map((insight) => (
                    <div
                      key={insight.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="text-[11px] font-medium text-white">
                        {insight.title}
                      </p>
                      <p className="mt-1 text-[11px] text-white/60">
                        {insight.body}
                      </p>
                      {insight.savingAmount != null && (
                        <p className="mt-1 text-[10px] text-[#FFB547]">
                          Potential saving:{' '}
                          <span className="font-semibold">
                            ₹{insight.savingAmount.toLocaleString('en-IN')}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </main>
      </div>

      <CitizenAIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default CitizenDashboardPage;
