'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Settings, LogOut, Plus,
  Calendar, Clock, X, Scale, BookOpen, Shield, HelpCircle,
  ChevronDown, ChevronRight, ChevronLeft, History, User
} from 'lucide-react';
import { ChatSession } from '@/lib/types';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils/cn';

interface SidebarProps {
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

const navigationItems = [
  { icon: MessageSquare, label: 'Chat', id: 'chat', active: true },
  { icon: Scale, label: 'Legal Resources', id: 'resources' },
  { icon: Shield, label: 'Security', id: 'security' },
  { icon: HelpCircle, label: 'Help', id: 'help' },
  { icon: History, label: 'History', id: 'history' },
];

export function Sidebar({ currentSessionId, onSessionSelect, onNewChat }: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('chat');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { user, logout } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await chatService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return sessionDate.toLocaleDateString();
  };

  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = formatDate(session.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  return (
    <div className="relative">
      {/* Elegant Collapse Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute top-6 -right-4 z-50",
          "w-8 h-8 rounded-full",
          "bg-gradient-to-r from-purple-500 to-fuchsia-500",
          "border-2 border-purple-400/30",
          "shadow-xl hover:shadow-purple-500/25",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "group overflow-hidden"
        )}
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)"
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear"
          }}
        />
        
        <motion.div
          animate={{ 
            rotate: isCollapsed ? 180 : 0,
            scale: isCollapsed ? 0.8 : 1
          }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="relative z-10"
        >
          <ChevronLeft className="w-4 h-4 text-white drop-shadow-sm" />
        </motion.div>
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        animate={{ 
          width: isCollapsed ? 60 : 320,
          opacity: isCollapsed ? 0.9 : 1
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="h-full bg-gradient-to-b from-[#0a0118] via-indigo-950 to-black/30 border-r border-purple-900/30 flex flex-col relative overflow-hidden"
      >
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-fuchsia-950/20 pointer-events-none" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2
          }}
        />
        
                {/* Top Search */}
        <div className={cn("p-6 border-b border-purple-900/30", isCollapsed && "hidden")}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-400/60" />
            <input
              type="text"
              placeholder="Search Ctrl+K"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-gray-900/50 border border-purple-800/30 py-3 pl-12 pr-4 text-base text-purple-100 placeholder-purple-400/60 focus:border-purple-600/50 focus:outline-none transition-colors backdrop-blur-sm font-medium"
            />
          </div>
        </div>

                {/* Navigation */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className={cn("p-4", isCollapsed && "px-1")}>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === 'history') {
                    setIsHistoryExpanded(!isHistoryExpanded);
                  } else if (item.id === 'chat') {
                    onNewChat();
                  }
                }}
                className={cn(
                  "flex items-center w-full rounded-xl transition-all duration-300 group relative overflow-hidden mb-2",
                  isCollapsed ? "px-2 py-3 justify-center" : "gap-4 px-4 py-3 text-base",
                  activeSection === item.id
                    ? "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-100 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                    : "text-purple-300/70 hover:text-purple-100 hover:bg-purple-900/20 border border-transparent hover:border-purple-800/30 hover:shadow-md"
                )}
              >
              <item.icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5")} />
              {!isCollapsed && (
                <>
                  <span className="font-semibold">{item.label}</span>
                  {item.id === 'history' && (
                    <motion.div
                      animate={{ rotate: isHistoryExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-auto"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Chat History Section */}
        <AnimatePresence mode="wait">
          {activeSection === 'history' && isHistoryExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                height: "auto", 
                y: 0,
                transition: { 
                  duration: 0.4, 
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { duration: 0.3, delay: 0.1 },
                  height: { duration: 0.4 },
                  y: { duration: 0.3, delay: 0.1 }
                }
              }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                y: -10,
                transition: { 
                  duration: 0.3, 
                  ease: [0.4, 0, 1, 1],
                  opacity: { duration: 0.2 },
                  height: { duration: 0.3, delay: 0.1 },
                  y: { duration: 0.2 }
                }
              }}
              className="px-2 pb-4 overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                </div>
              ) : Object.keys(groupedSessions).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSessions).map(([date, sessions]) => (
                    <div key={date} className="space-y-1">
                      <h3 className="text-sm font-bold text-purple-400/80 uppercase tracking-wider px-4 py-2">
                        {date}
                      </h3>
                      {sessions.map((session) => (
                        <motion.div
                          key={session.id}
                          className={cn(
                            'group relative w-full rounded-xl p-3 transition-all duration-300 cursor-pointer mx-2 mb-1',
                            currentSessionId === session.id
                              ? 'bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 text-purple-100 border border-purple-500/20 shadow-md'
                              : 'hover:bg-purple-900/15 text-purple-300/80 hover:text-purple-200 border border-transparent hover:border-purple-800/20'
                          )}
                          whileHover={{ x: 4, scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <div 
                            className="flex items-start gap-2"
                            onClick={() => onSessionSelect(session.id)}
                          >
                            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base truncate">
                                {session.title}
                              </p>
                              <div className="mt-1 flex items-center gap-1 text-sm text-purple-400/60">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-700"
                            >
                              <X className="h-3 w-3 text-gray-500 hover:text-gray-300" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* User Profile Section */}
        {!isCollapsed && user && (
          <div className="border-t border-purple-900/30 p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/30">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-purple-400/70 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className={cn("border-t border-purple-900/30 p-4", isCollapsed && "p-2")}>
          <button className={cn(
            "flex items-center w-full rounded-xl transition-all duration-300 mb-2 text-base font-medium text-purple-300/70 hover:text-purple-100 hover:bg-purple-900/20",
            isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3"
          )}>
            <Settings className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1, duration: 0.2 } }}
                  exit={{ opacity: 0, width: 0, transition: { duration: 0.15 } }}
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button 
            onClick={logout}
            className={cn(
              "flex items-center w-full rounded-xl transition-all duration-300 text-base font-medium text-purple-300/70 hover:text-fuchsia-400 hover:bg-fuchsia-900/20",
              isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1, duration: 0.2 } }}
                  exit={{ opacity: 0, width: 0, transition: { duration: 0.15 } }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </div>
  );
} 