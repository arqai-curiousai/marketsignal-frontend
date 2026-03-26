'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
const ChatWindow = dynamic(
    () => import('@/components/chat/ChatWindow').then(m => m.ChatWindow),
    { ssr: false }
);
import { SourcePanel } from '@/components/chat/SourcePanel';
import { IAIResponse } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AssistantPage() {
    const [lastResponse, setLastResponse] = useState<IAIResponse | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                <ChatWindow onResponse={setLastResponse} />

                {/* Toggle Panel Button (Mobile/Tablet) */}
                {!isPanelOpen && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-6 right-6 h-10 w-10 bg-white/5 border border-white/10 text-white/50 hover:text-white z-20 hidden lg:inline-flex"
                        onClick={() => setIsPanelOpen(true)}
                        aria-label="Open sources panel"
                    >
                        <PanelRightOpen className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Side Panel for Sources */}
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 400, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="hidden lg:block border-l border-white/10"
                    >
                        <div className="h-full relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-6 right-6 h-8 w-8 text-white/30 hover:text-white z-30"
                                onClick={() => setIsPanelOpen(false)}
                                aria-label="Close sources panel"
                            >
                                <PanelRightClose className="h-4 w-4" />
                            </Button>

                            {lastResponse ? (
                                <SourcePanel
                                    sources={lastResponse.sources}
                                    confidence={lastResponse.confidence}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-brand-slate">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 mb-4">
                                        <PanelRightOpen className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-medium text-white/50 mb-2">Provenance Panel</h3>
                                    <p className="text-xs text-white/30 leading-relaxed">
                                        Ask a question to see the verified sources and confidence scores behind the AI&apos;s analysis.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
