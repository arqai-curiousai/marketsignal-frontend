'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const researchItems = [
    {
        id: '1',
        type: 'COMPANY',
        title: 'NVIDIA (NVDA)',
        description: 'Deep dive into Blackwell architecture rollout and data center revenue projections for FY25.',
        insights: ['AI infrastructure demand remains structural', 'Supply chain constraints easing in Q3'],
        tags: ['Tech', 'AI', 'Semiconductors']
    },
    {
        id: '2',
        type: 'MACRO',
        title: 'US Treasury Yield Curve',
        description: 'Analysis of recent steepening trends and implications for regional banking sector liquidity.',
        insights: ['Recession probabilities moderating', 'Net interest margin pressure persists'],
        tags: ['Macro', 'Fixed Income', 'Banking']
    },
    {
        id: '3',
        type: 'SECTOR',
        title: 'Renewable Energy Outlook',
        description: 'Policy shifts and interest rate sensitivity analysis for utility-scale solar projects.',
        insights: ['Cost of capital remains primary headwind', 'Grid interconnection backlog growing'],
        tags: ['Energy', 'ESG', 'Utilities']
    }
];

export default function ResearchLibrary() {
    const [search, setSearch] = useState('');

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

            <div className="space-y-6">
                {researchItems.map((item) => (
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {item.insights.map((insight, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                                            <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald mt-1.5 flex-shrink-0" />
                                            {insight}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 justify-center">
                                <Link href={`/assistant?q=${encodeURIComponent(item.title)}`}>
                                    <Button className="w-full md:w-48 bg-white/5 border border-white/10 hover:bg-white/10 text-white gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Ask AI About This
                                    </Button>
                                </Link>
                                <Button variant="ghost" className="w-full md:w-48 text-muted-foreground hover:text-white gap-2">
                                    View Full Report
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
