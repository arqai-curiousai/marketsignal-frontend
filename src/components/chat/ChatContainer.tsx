'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Scale, Send, Paperclip } from 'lucide-react';
import { Message } from './Message';
import { Message as MessageType } from '@/lib/types';
import { chatService } from '@/services/chat.service';
import { cn } from '@/lib/utils/cn';

interface Orb {
  style: React.CSSProperties;
  animate: {
    x: (string | number)[];
    y: (string | number)[];
    scale: number[];
    opacity: number[];
  };
  transition: {
    duration: number;
    repeat: number;
    ease: string;
    delay: number;
  };
}

interface ChatContainerProps {
  sessionId?: string;
  className?: string;
}

const SUGGESTIONS = [
  'What are the recent amendments to the Indian Penal Code?',
  'Explain Article 21 of the Constitution',
  'What is the procedure for filing a PIL?',
  'Rights of an arrested person in India',
  'Difference between bail and anticipatory bail',
];

export function ChatContainer({ sessionId: initialSessionId, className }: ChatContainerProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [message, setMessage] = useState('');
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate orb styles on client mount to prevent hydration mismatch
  useEffect(() => {
    const generateOrbs = () => {
      return [...Array(6)].map(() => ({
        style: {
          width: Math.random() * 200 + 100,
          height: Math.random() * 200 + 100,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        },
        animate: {
          x: [0, Math.random() * 200 - 100, 0],
          y: [0, Math.random() * 200 - 100, 0],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        },
        transition: {
          duration: Math.random() * 20 + 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 10,
        },
      }));
    };
    setOrbs(generateOrbs());
  }, []);

  // Load chat history if sessionId exists
  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  const loadChatHistory = async () => {
    if (!sessionId) return;
    
    try {
      const history = await chatService.getChatHistory(sessionId);
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    }
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || message.trim();
    if (!messageContent || isLoading) return;

    setError(null);
    const userMessage: MessageType = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add a placeholder for the assistant's response
    const assistantPlaceholder: MessageType = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const response = await chatService.sendMessage(messageContent, sessionId);
      
      // Update the session ID if this is a new conversation
      if (!sessionId && response && typeof response === 'object' && 'sessionId' in response) {
        setSessionId(response.sessionId as string);
      }

      // Create the assistant message
      const assistantMessage: MessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: typeof response === 'string' ? response : (response as any)?.content || 'No response received',
        timestamp: new Date(),
      };

      // Replace the placeholder with the actual response
      setMessages((prev) => 
        prev.map((msg) =>
          msg.id === assistantPlaceholder.id ? assistantMessage : msg
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      
      // Remove the typing message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('temp-assistant')));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  };

  return (
    <div className={cn('flex flex-col h-full bg-gradient-to-br from-[#0a0118] via-indigo-950 to-black/50 relative overflow-hidden', className)}>
      {/* Zen "Aurora" Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-purple-600/20 via-transparent to-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div 
          className="absolute -bottom-1/2 -right-1/4 w-[150%] h-[150%] bg-gradient-to-tl from-fuchsia-600/20 via-transparent to-transparent rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear', delay: 5 }}
        />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-30" />
      </div>

      {messages.length === 0 ? (
        // Grok-style centered welcome area
        <div className="flex flex-col items-center justify-center flex-1 p-8 relative z-10">
          {/* Large Legal AI Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-2xl shadow-purple-500/25"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Scale className="h-16 w-16 text-white" />
              </motion.div>
              <div>
                <h1 className="text-6xl font-light text-white tracking-tight">
                  Legal <span className="font-semibold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-purple-300/80 text-lg mt-2">Indian Law Assistant</p>
              </div>
            </div>
          </motion.div>

          {/* Centered Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl"
          >
            {/* Premium Input Container */}
            <div className="relative group">
              {/* Enhanced glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 rounded-3xl blur-sm group-focus-within:blur-md transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
              
              <div className="relative flex items-end gap-4 rounded-3xl bg-gray-900/80 backdrop-blur-xl border-2 border-purple-800/40 p-6 focus-within:border-purple-500/60 transition-all duration-500 shadow-2xl shadow-purple-900/20">
                <motion.button 
                  className="p-3 text-purple-400/60 hover:text-purple-300 transition-all duration-300 rounded-2xl hover:bg-purple-900/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Paperclip className="h-6 w-6" />
                </motion.button>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to know about Indian law?"
                  disabled={isLoading}
                  className="flex-1 resize-none bg-transparent text-white text-lg placeholder-purple-400/50 focus:outline-none min-h-[32px] max-h-[120px] font-medium leading-relaxed py-2"
                  rows={1}
                />
                <motion.button
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isLoading}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300 font-medium",
                    !message.trim() || isLoading
                      ? "text-purple-600/40 cursor-not-allowed"
                      : "text-white bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 shadow-lg hover:shadow-purple-500/25"
                  )}
                  whileHover={!message.trim() || isLoading ? {} : { scale: 1.05 }}
                  whileTap={!message.trim() || isLoading ? {} : { scale: 0.95 }}
                >
                  <Send className="h-6 w-6" />
                </motion.button>
              </div>

                            {/* Enhanced Suggestions */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-6 py-3 rounded-2xl bg-gray-900/60 backdrop-blur-sm border border-purple-800/30 text-purple-300/90 text-base font-medium hover:bg-purple-900/30 hover:border-purple-500/50 hover:text-purple-100 transition-all duration-300 shadow-lg hover:shadow-purple-900/20"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        // Chat conversation area
        <>
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto px-4 py-6 relative z-10"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <Message
                    key={message.id}
                    message={message}
                    isTyping={isTyping && index === messages.length - 1 && message.role === 'assistant' && !message.content}
                  />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mx-4 mb-2"
              >
                <div className="max-w-4xl mx-auto p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Bottom Input Area */}
          <div className="border-t border-purple-900/30 p-6 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                {/* Enhanced glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 rounded-3xl blur-sm group-focus-within:blur-md transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
                
                <div className="relative flex items-end gap-4 rounded-3xl bg-gray-900/80 backdrop-blur-xl border-2 border-purple-800/40 p-6 focus-within:border-purple-500/60 transition-all duration-500 shadow-2xl shadow-purple-900/20">
                  <motion.button 
                    className="p-3 text-purple-400/60 hover:text-purple-300 transition-all duration-300 rounded-2xl hover:bg-purple-900/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Paperclip className="h-6 w-6" />
                  </motion.button>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Indian law, cases, or legal procedures..."
                    disabled={isLoading}
                    className="flex-1 resize-none bg-transparent text-white text-lg placeholder-purple-400/50 focus:outline-none min-h-[32px] max-h-[120px] font-medium leading-relaxed py-2"
                    rows={1}
                  />
                  <motion.button
                    onClick={() => handleSendMessage()}
                    disabled={!message.trim() || isLoading}
                    className={cn(
                      "p-3 rounded-2xl transition-all duration-300 font-medium",
                      !message.trim() || isLoading
                        ? "text-purple-600/40 cursor-not-allowed"
                        : "text-white bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 shadow-lg hover:shadow-purple-500/25"
                    )}
                    whileHover={!message.trim() || isLoading ? {} : { scale: 1.05 }}
                    whileTap={!message.trim() || isLoading ? {} : { scale: 0.95 }}
                  >
                    {isLoading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 