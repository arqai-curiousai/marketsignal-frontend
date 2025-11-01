import React from 'react';
import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', message, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const containerSizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      containerSizeClasses[size],
      className
    )}>
      {/* Animated Logo */}
      <motion.div
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
        className={cn(
          "rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-2xl shadow-purple-500/25 flex items-center justify-center",
          size === 'sm' ? 'p-2' : size === 'md' ? 'p-3' : 'p-4'
        )}
      >
        <Scale className={cn("text-white", sizeClasses[size])} />
      </motion.div>

      {/* Loading Ring */}
      <div className="relative">
        <div className={cn(
          "border-4 border-purple-900/30 rounded-full",
          sizeClasses[size]
        )}></div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={cn(
            "absolute top-0 left-0 border-4 border-transparent border-t-purple-500 rounded-full",
            sizeClasses[size]
          )}
        ></motion.div>
      </div>

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-purple-300 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
} 