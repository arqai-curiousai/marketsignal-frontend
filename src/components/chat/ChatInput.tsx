'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, AlertCircle, Sparkles, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  placeholder = 'Ask about Indian law, cases, or legal procedures...',
  suggestions = [],
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && !message && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-3 flex w-full flex-wrap gap-2 px-4"
          >
            <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
              <Sparkles className="h-3 w-3" />
              Try asking:
            </span>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-amber-900/30 to-red-900/30 px-4 py-1.5 text-xs font-medium text-amber-200 transition-all hover:shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">{suggestion}</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-800/50 to-red-800/50"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div
        className={cn(
          'relative flex items-end gap-3 rounded-2xl p-3 transition-all duration-300',
          'bg-black/50 backdrop-blur-md',
          'border border-white/10',
                      isFocused
              ? 'shadow-2xl border-amber-400/50'
              : 'shadow-lg hover:shadow-xl'
        )}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-20"
          animate={{
            background: isFocused
              ? 'linear-gradient(135deg, #fbbf24 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, transparent 0%, transparent 100%)',
          }}
          transition={{ duration: 0.3 }}
        />

        <motion.button
          type="button"
          className="relative z-10 mb-1 rounded-xl p-2.5 text-gray-400 transition-all hover:bg-amber-900/30 hover:text-amber-400"
          aria-label="Attach file"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Paperclip className="h-5 w-5" />
        </motion.button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading}
          className="relative z-10 min-h-[48px] max-h-[200px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-gray-400 disabled:opacity-50"
          rows={1}
        />

        <motion.button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={cn(
            "relative z-10 mb-1 rounded-xl p-2.5 transition-all duration-300",
            "bg-gradient-to-r from-amber-500 to-red-500",
            "text-white shadow-lg",
            message.trim() && !isLoading
              ? "hover:shadow-xl hover:scale-105 active:scale-95"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Send message"
          whileHover={message.trim() && !isLoading ? { rotate: 360 } : {}}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Scale className="h-5 w-5" />
            </motion.div>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </motion.button>

        {/* Focus indicator */}
        {isFocused && (
          <motion.div
            className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 opacity-30 blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>

      {/* Character count warning */}
      <AnimatePresence>
        {message.length > 4000 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-1 px-4 text-xs text-amber-400"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Message is too long ({message.length}/4000 characters)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing indicator animation */}
      {isLoading && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex items-center gap-1 rounded-full bg-amber-900/30 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" />
          </div>
        </motion.div>
      )}
    </div>
  );
}