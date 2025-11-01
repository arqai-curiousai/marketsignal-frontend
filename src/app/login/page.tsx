'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { OTPRequestForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0118] via-indigo-950 to-[#100320] relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-transparent to-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      {/* OTP Request Form Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-auto p-6"
      >
        <div className="backdrop-blur-xl bg-purple-950/30 border border-purple-700/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/10">
          <OTPRequestForm />
        </div>
      </motion.div>
    </div>
  );
} 