'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Scale, Sparkles, Shield, BookOpen, Gavel } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-50 dark:from-slate-950 dark:via-zinc-950 dark:to-stone-950 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
            Legal AI Assistant - Design Showcase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Premium glass morphism design with enhanced animations
          </p>
        </motion.div>

        {/* Buttons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card variant="glass" className="backdrop-blur-xl bg-white/50 dark:bg-black/50 p-8">
            <h2 className="text-2xl font-semibold mb-6">Button Variants</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button loading>Loading State</Button>
            </div>
          </Card>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: Scale, title: "Legal Expertise", color: "from-amber-500 to-red-500" },
            { icon: Shield, title: "Secure & Private", color: "from-slate-600 to-zinc-600" },
            { icon: BookOpen, title: "Comprehensive Database", color: "from-emerald-500 to-teal-500" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card variant="glass" className="backdrop-blur-xl bg-white/50 dark:bg-black/50 p-6 h-full">
                <motion.div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-3 mb-4`}
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <feature.icon className="w-full h-full text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Experience premium legal assistance with our advanced AI technology.
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Animation Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="glass" className="backdrop-blur-xl bg-white/50 dark:bg-black/50 p-8">
            <h2 className="text-2xl font-semibold mb-6">Interactive Elements</h2>
            
            <div className="space-y-6">
              {/* Animated Progress Bar */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Confidence Level</p>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Floating Elements */}
              <div className="flex justify-center gap-4 py-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-red-400 flex items-center justify-center"
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                ))}
              </div>

              {/* Shimmer Effect Demo */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-100 to-red-100 dark:from-amber-900/30 dark:to-red-900/30 p-6">
                <h3 className="text-lg font-semibold mb-2">Shimmer Effect</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Watch the subtle shimmer animation across this card.
                </p>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Glass Morphism Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative h-64 rounded-2xl overflow-hidden"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" stroke-width="0.5" opacity="0.2"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grid)" /%3E%3C/svg%3E")',
          }}
        >
          <motion.div
            className="absolute inset-4 backdrop-blur-xl bg-white/30 dark:bg-black/30 rounded-xl border border-white/20 p-6 flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center">
              <Gavel className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Glass Morphism Effect</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Beautiful frosted glass appearance with backdrop blur
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 