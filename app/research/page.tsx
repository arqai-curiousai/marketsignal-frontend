'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/apiClient';

interface ResearchItem {
    id: string;
    type: string;
    title: string;
    description: string;
    insights: string[];
    tags: string[];
}

export default function ResearchLibrary() {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<ResearchItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchResearch() {
            setError(null);
            try {
                const response = await apiClient.get<{ items?: Record<string, unknown>[] } | Record<string, unknown>[]>(
                    '/api/research/docs',
                    { q: search || undefined, limit: 20 },
                );
                if (cancelled) return;
                if (!response.success) {
                    setError('Failed to load research documents. Please try again.');
                    setItems([]);
                    return;
                }
                const raw = response.data;
                const docs = Array.isArray(raw) ? raw : (raw as { items?: Record<string, unknown>[] }).items ?? [];
                const mapped: ResearchItem[] = docs.map((doc: Record<string, unknown>) => ({
                    id: (doc.id as string) ?? '',
                    type: (doc.type as string) ?? 'GENERAL',
                    title: (doc.title as string) ?? '',
                    description: (doc.summary as string) ?? (doc.description as string) ?? '',
                    insights: (doc.insights as string[]) ?? [],
                    tags: (doc.tags as string[]) ?? [],
                }));
                if (!cancelled) setItems(mapped);
            } catch {
                if (cancelled) return;
                console.warn('Failed to fetch research documents');
                setError('Unable to reach the server. Please check your connection.');
                setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchResearch();
        }, search ? 300 : 0);
        return () => {
            cancelled = true;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, retryKey]);

    return (
        <div className="container py-12 px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Research Library</h1>
                    <p className="text-muted-foreground">Searchable index of companies, sectors, and market events.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search research..."
                        className="pl-10 bg-white/5 border-white/10 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                        onClick={() => { setLoading(true); setRetryKey((k) => k + 1); }}
                        className="mt-3 text-xs text-muted-foreground hover:text-white underline"
                    >
                        Retry
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-muted-foreground text-lg">No research documents found.</p>
                    <p className="text-muted-foreground text-sm mt-2">
                        Try a different search term or check back later.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {items.map((item) => (
                        <Card key={item.id} className="p-8 bg-white/5 border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-brand-blue/30 text-brand-blue">
                                            {item.type}
                                        </Badge>
                                        <div className="flex gap-2">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="text-[10px] text-muted-foreground">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-blue transition-colors">
                                        {item.title}
                                    </h2>
                                    <p className="text-muted-foreground leading-relaxed mb-6">
                                        {item.description}
                                    </p>
                                    {item.insights.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {item.insights.map((insight, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald mt-1.5 flex-shrink-0" />
                                                    {insight}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 justify-center">
                                    <Link
                                        href={`/assistant?q=${encodeURIComponent(item.title)}`}
                                        className="w-full md:w-48 bg-white/5 border border-white/10 hover:bg-white/10 text-white gap-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        Ask AI About This
                                    </Link>
                                    <Link
                                        href={`/assistant?q=${encodeURIComponent(`Full report on ${item.title}`)}`}
                                        className="w-full md:w-48 text-muted-foreground hover:text-white gap-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                                    >
                                        View Full Report
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
