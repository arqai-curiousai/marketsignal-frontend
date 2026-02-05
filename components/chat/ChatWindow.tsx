'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IChatMessage, IAIResponse } from '@/types';
import { aiClient } from '@/ai/aiClient';
import { Message } from './Message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatWindowProps {
    onResponse?: (response: IAIResponse) => void;
    initialContext?: string;
    initialMessage?: string;
}

export function ChatWindow({ onResponse, initialContext: _initialContext, initialMessage }: ChatWindowProps) {
    const [messages, setMessages] = useState<IChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: initialMessage || 'Hello! I am your AI Research Assistant. Ask me anything about market trends, sector analysis, or specific signals. \n\nNote: I cannot provide buy/sell recommendations.',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: IChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiClient.ask(input);

            const assistantMessage: IChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: response.answer,
                timestamp: new Date(),
                response: response,
            };

            setMessages(prev => [...prev, assistantMessage]);
            if (onResponse) onResponse(response);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-slate">
            {/* Chat Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-hide"
            >
                {messages.map((msg) => (
                    <Message
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                    />
                ))}
                {isLoading && (
                    <div className="p-6 flex items-center gap-3 text-muted-foreground animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs uppercase tracking-widest">Analyzing market data...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/10 bg-brand-slate/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about market signals, sectors, or macro trends..."
                        className="h-14 pl-6 pr-16 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-brand-blue/50 text-white placeholder:text-white/20"
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/30 hover:text-white">
                                        <Info className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-brand-slate border-white/10 text-xs p-3 max-w-xs">
                                    <p>I can analyze data and explain signals, but I will never provide buy or sell recommendations.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-violet p-0 hover:opacity-90 transition-opacity"
                        >
                            <Send className="h-5 w-5 text-white" />
                        </Button>
                    </div>
                </form>
                <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest">
                    Information only — not investment advice
                </p>
            </div>
        </div>
    );
}
