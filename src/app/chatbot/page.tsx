'use client';

import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { setCSRFToken } from '@/lib/security/csrf';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ChatThemeTokens {
  readonly background: string;
  readonly glowPrimary: string;
  readonly glowSecondary: string;
  readonly halo: string;
  readonly topRibbon: string;
  readonly workspaceBadgeBg: string;
  readonly workspaceBadgeBorder: string;
  readonly workspaceBadgeText: string;
}

const getChatTheme = (): ChatThemeTokens => ({
  background:
    'bg-[radial-gradient(circle_at_top,_#050308,_#020617)]',
  glowPrimary: 'bg-orange-500/14',
  glowSecondary: 'bg-amber-400/14',
  halo: 'bg-gradient-to-r from-orange-500/10 via-transparent to-amber-400/10',
  topRibbon: 'bg-gradient-to-r from-orange-500/40 via-amber-300/40 to-yellow-400/40',
  workspaceBadgeBg: 'bg-slate-950/85',
  workspaceBadgeBorder: 'border-orange-500/40',
  workspaceBadgeText: 'text-orange-100',
});

const CHAT_THEME = getChatTheme();

const ChatbotPage: FC = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Initialize CSRF protection on mount
  useEffect(() => {
    setCSRFToken();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSessionSelect = (sessionId: string): void => {
    setCurrentSessionId(sessionId);
  };

  const handleNewChat = (): void => {
    setCurrentSessionId(undefined);
  };

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${CHAT_THEME.background}`}
      >
        <div className="relative">
          <motion.div
            className={`absolute -inset-16 rounded-full blur-3xl ${CHAT_THEME.glowPrimary}`}
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <LoadingSpinner size="lg" message="Preparing legalaid workspace..." />
        </div>
      </div>
    );
  }

  // Avoid rendering until redirect completes
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={`relative flex h-screen overflow-hidden ${CHAT_THEME.background}`}
    >
      {/* Enhanced Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute top-[-6rem] left-1/5 h-80 w-80 rounded-full blur-3xl ${CHAT_THEME.glowPrimary}`}
          animate={{ opacity: [0.3, 0.8, 0.3], x: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute bottom-[-6rem] right-1/5 h-80 w-80 rounded-full blur-3xl ${CHAT_THEME.glowSecondary}`}
          animate={{ opacity: [0.2, 0.7, 0.2], x: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${CHAT_THEME.halo}`}
          animate={{ opacity: [0.15, 0.4, 0.15], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Top ribbon / workspace indicator */}
      <motion.div
        className={`pointer-events-none absolute left-0 right-0 top-0 z-10 h-[2px] ${CHAT_THEME.topRibbon}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: '0% 50%' }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex h-full w-full">
        {/* Sidebar */}
        <Sidebar
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
        />

        {/* Main Chat Area */}
        <main className="relative flex-1 overflow-hidden">
          {/* Workspace badge at top-right */}
          <motion.div
            className="pointer-events-none absolute right-4 top-3 z-20 hidden md:block"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <div
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-[0.7rem] ${CHAT_THEME.workspaceBadgeBg} ${CHAT_THEME.workspaceBadgeBorder}`}
            >
              <span className={CHAT_THEME.workspaceBadgeText}>legalaid</span>
              <span className="h-1 w-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-300" />
              <span className="text-[0.65rem] text-slate-400">
                governed legal workspace
              </span>
            </div>
          </motion.div>

          <motion.div
            className="relative h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <ChatContainer
              key={currentSessionId || 'new'}
              sessionId={currentSessionId}
              className="h-full"
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ChatbotPage;
