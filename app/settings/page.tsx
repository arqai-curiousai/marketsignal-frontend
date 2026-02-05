'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Palette, Bell, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [sources, setSources] = useState([
        { id: 'newsapi', name: 'NewsAPI', enabled: true, type: 'NEWS' },
        { id: 'alphavantage', name: 'Alpha Vantage', enabled: true, type: 'MARKET_DATA' },
        { id: 'sec', name: 'SEC EDGAR', enabled: false, type: 'FILINGS' },
        { id: 'twitter', name: 'Sentiment Feed', enabled: true, type: 'SOCIAL' },
    ]);

    const handleToggle = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    };

    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    return (
        <div className="container py-12 px-6 max-w-4xl">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-muted-foreground">Manage your data sources, preferences, and platform configuration.</p>
            </div>

            <div className="space-y-8">
                {/* Data Sources */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Database className="h-5 w-5 text-brand-blue" />
                        <h2 className="text-xl font-bold text-white">Data Sources</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10 divide-y divide-white/5">
                        {sources.map((source) => (
                            <div key={source.id} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                                        <RefreshCw className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{source.name}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/10 text-muted-foreground">
                                                {source.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {source.enabled ? 'Connected and syncing' : 'Disconnected'}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={source.enabled}
                                    onCheckedChange={() => handleToggle(source.id)}
                                />
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
                                    Our signature deep slate and emerald/blue/violet accent theme.
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

                <div className="pt-8 flex justify-end">
                    <Button onClick={handleSave} className="bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90 px-8 h-12">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
