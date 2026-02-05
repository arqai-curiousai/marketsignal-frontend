'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SignalService } from '@/services/signalService';
import { sourceRegistry } from '@/services/sourceRegistry';
import { ISignal } from '@/types';
import { SignalTimeline } from '@/components/signals/SignalTimeline';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Clock,
    MessageSquare,
    ExternalLink,
    Info
} from 'lucide-react';
import Link from 'next/link';

const signalService = new SignalService(sourceRegistry);

// Mock timeline data
const mockTimeline = [
    { time: '00:00', impact: 45 },
    { time: '04:00', impact: 52 },
    { time: '08:00', impact: 48 },
    { time: '12:00', impact: 75 },
    { time: '16:00', impact: 85 },
    { time: '20:00', impact: 82 },
    { time: '24:00', impact: 85 },
];

export default function SignalDetailPage() {
    const { id } = useParams();
    const [signal, setSignal] = useState<ISignal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSignal = async () => {
            if (typeof id === 'string') {
                const data = await signalService.getSignalById(id);
                setSignal(data);
            }
            setIsLoading(false);
        };
        loadSignal();
    }, [id]);

    if (isLoading) return <div className="container py-24 text-center text-muted-foreground">Loading signal data...</div>;
    if (!signal) return <div className="container py-24 text-center text-muted-foreground">Signal not found.</div>;

    return (
        <div className="container py-12 px-6 max-w-6xl">
            <Link href="/signals" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-8 transition-colors group">
                <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                Back to Signals Hub
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Content */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-brand-blue/30 text-brand-blue">
                                {signal.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Detected {new Date(signal.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {signal.title}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {signal.description}
                        </p>
                    </section>

                    <section className="glass-card p-8">
                        <h3 className="text-sm font-semibold text-white mb-8 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-brand-blue" />
                            24-Hour Impact Timeline
                        </h3>
                        <SignalTimeline data={mockTimeline} />
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-widest">Correlated Instruments</h3>
                        <div className="flex flex-wrap gap-3">
                            {signal.correlatedInstruments?.map(inst => (
                                <Card key={inst} className="px-6 py-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-default">
                                    <div className="text-lg font-bold text-white">{inst}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Instrument</div>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-8">
                    <Card className="p-6 bg-brand-blue/5 border-brand-blue/20">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-semibold text-brand-blue uppercase tracking-widest">Signal Impact</span>
                            <div className="text-3xl font-bold text-white">{signal.impactScore}</div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Confidence</span>
                                <span className="text-white font-medium">{signal.confidence}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Severity</span>
                                <span className="text-white font-medium">{signal.severity}</span>
                            </div>
                        </div>
                        <Link href={`/assistant?q=Explain the ${signal.title} signal`}>
                            <Button className="w-full mt-8 bg-brand-blue hover:bg-brand-blue/90 text-white gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Explain with AI
                            </Button>
                        </Link>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Data Provenance</h3>
                        {signal.sources.map(source => (
                            <Card key={source.id} className="p-4 bg-white/5 border-white/10">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-[10px] text-brand-blue font-bold uppercase">{source.publisher}</span>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-white transition-colors" />
                                    </a>
                                </div>
                                <h4 className="text-sm font-medium text-white leading-tight">{source.title}</h4>
                            </Card>
                        ))}
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            This signal was generated by cross-referencing multiple institutional data feeds.
                            <br /><br />
                            <span className="text-white font-medium uppercase tracking-tighter">Information only — not investment advice.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Activity({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
