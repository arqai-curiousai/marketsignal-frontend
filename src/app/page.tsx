'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { setCSRFToken } from '@/lib/security/csrf';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const { isAuthenticated, isLoading, user } = useAuth();
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

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-indigo-950 to-[#100320]">
        <LoadingSpinner size="lg" message="Initializing Legal AI Assistant..." />
      </div>
    );
  }

  // Don't render anything if not authenticated (user will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#0a0118] via-indigo-950 to-[#100320] relative">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-transparent to-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      {/* <Header /> */}

      {/* Main Content Area */}
        {/* Sidebar */}
        <Sidebar
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
        />

        {/* Main Chat Area */}
        <main className="flex-1 overflow-hidden relative z-10">
          <ChatContainer
            key={currentSessionId || 'new'}
            sessionId={currentSessionId}
            className="h-full"
          />
        </main>
    </div>
  );
}
