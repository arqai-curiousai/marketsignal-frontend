'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, FileText, Gavel, ScrollText, User, Bot, Scale, Sparkles } from 'lucide-react';
import { Message as MessageType, LegalSource } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/Card';

interface MessageProps {
  message: MessageType;
  isTyping?: boolean;
}

const sourceIcons: Record<LegalSource['type'], React.ReactNode> = {
  case_law: <Gavel className="h-4 w-4" />,
  statute: <BookOpen className="h-4 w-4" />,
  regulation: <FileText className="h-4 w-4" />,
  policy: <ScrollText className="h-4 w-4" />,
};

export function Message({ message, isTyping = false }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-4 px-4 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-gray-600 to-slate-600 text-gray-300 shadow-gray-500/25'
            : 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-purple-500/25'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Scale className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex max-w-[70%] flex-col gap-3', isUser && 'items-end')}>
        <div className="flex-1">
          {isTyping ? (
            <div className="flex items-center gap-1 text-purple-400">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" />
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none text-gray-300">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <pre className="rounded-lg bg-gray-800 p-3 overflow-x-auto text-gray-300">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-300" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Legal Sources */}
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            <span className="flex items-center gap-1 text-xs text-purple-400 font-medium">
              <Sparkles className="h-3 w-3" />
              Sources:
            </span>
            {message.metadata.sources.map((source, index) => (
              <motion.a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 px-3 py-1.5 text-xs font-medium text-purple-200 transition-all hover:shadow-md border border-purple-800/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {sourceIcons[source.type]}
                <span className="max-w-[200px] truncate">{source.title}</span>
                <motion.div
                  className="h-1 w-1 rounded-full bg-purple-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.a>
            ))}
          </motion.div>
        )}

        {/* Timestamp and metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 text-xs text-gray-400"
        >
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.metadata?.processingTime && (
            <>
              <span>•</span>
              <span>{(message.metadata.processingTime / 1000).toFixed(2)}s</span>
            </>
          )}
          {message.metadata?.confidence && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <motion.div
                  className="h-2 w-16 rounded-full bg-gray-700 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${message.metadata.confidence * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.div>
                <span>{Math.round(message.metadata.confidence * 100)}%</span>
              </span>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}