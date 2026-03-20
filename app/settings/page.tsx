'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, Palette, Bell } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="container py-12 px-6 max-w-4xl">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-muted-foreground">Platform configuration and preferences.</p>
            </div>

            <div className="space-y-8">
                {/* Active Data Sources (read-only, reflects actual backend config) */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Database className="h-5 w-5 text-brand-blue" />
                        <h2 className="text-xl font-bold text-white">Active Data Sources</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10 divide-y divide-white/5">
                        {[
                            { name: 'Kite Connect', type: 'NSE', desc: 'NSE live quotes, historical data, F&O' },
                            { name: 'EODHD', type: 'GLOBAL', desc: 'Global exchanges (NASDAQ, NYSE, LSE, SGX, HKSE) + Forex' },
                            { name: 'Qdrant Cloud', type: 'VECTOR_STORE', desc: 'Vector embeddings for RAG search' },
                        ].map((source) => (
                            <div key={source.name} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{source.name}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/10 text-muted-foreground">
                                                {source.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{source.desc}</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    Active
                                </Badge>
                            </div>
                        ))}
                    </Card>
                </section>

                {/* Theme & Appearance */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Palette className="h-5 w-5 text-brand-violet" />
                        <h2 className="text-xl font-bold text-white">Appearance</h2>
                    </div>
                    <Card className="p-6 bg-white/5 border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-white">Dark-First Gradient Theme</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Signature deep slate with emerald/blue/violet accents.
                                </p>
                            </div>
                            <Badge variant="default" className="bg-brand-blue/20 text-brand-blue border-brand-blue/30">Active</Badge>
                        </div>
                    </Card>
                </section>

                {/* Notifications */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Bell className="h-5 w-5 text-brand-emerald" />
                        <h2 className="text-xl font-bold text-white">Notifications</h2>
                    </div>
                    <Card className="p-6 bg-white/5 border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="high-impact" className="text-white">High Impact Signals</Label>
                            <Switch id="high-impact" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="daily-summary" className="text-white">Daily Research Summary</Label>
                            <Switch id="daily-summary" />
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    );
}
