'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ISource } from '@/types';
import { Card } from '@/components/ui/card';
import { ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SourcePanelProps {
    sources: ISource[];
    confidence: string;
}

export function SourcePanel({ sources, confidence }: SourcePanelProps) {
    return (
        <div className="h-full flex flex-col bg-brand-slate border-l border-white/10">
            <div className="p-6 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-blue" />
                    Provenance & Sources
                </h3>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-muted-foreground">AI Confidence</span>
                    <Badge className={cn(
                        "text-[10px] px-2 py-0",
                        confidence === 'HIGH' || confidence === 'VERY_HIGH' ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                    )}>
                        {confidence}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {sources.map((source) => (
                    <Card key={source.id} className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-[10px] font-medium text-brand-blue uppercase tracking-wider">
                                {source.publisher}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {source.relevanceScore}% Match
                            </span>
                        </div>
                        <h4 className="text-sm font-medium text-white mb-2 leading-tight group-hover:text-brand-blue transition-colors">
                            {source.title}
                        </h4>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(source.publishedAt).toLocaleDateString()}
                            </span>
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-white transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5">
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        All insights are cross-referenced with verified institutional data sources and real-time market feeds.
                    </p>
                </div>
            </div>
        </div>
    );
}
