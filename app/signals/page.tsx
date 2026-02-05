'use client';

import React, { useState, useEffect } from 'react';
import { SignalService } from '@/services/signalService';
import { sourceRegistry } from '@/services/sourceRegistry';
import { ISignal } from '@/types';
import { SignalCard } from '@/components/signals/SignalCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const signalService = new SignalService(sourceRegistry);

export default function SignalsHub() {
    const [signals, setSignals] = useState<ISignal[]>([]);
    const [filter, setFilter] = useState<string>('ALL');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSignals = async () => {
            setIsLoading(true);
            const data = await signalService.fetchAllSignals(20);
            setSignals(data);
            setIsLoading(false);
        };
        loadSignals();
    }, []);

    const filteredSignals = filter === 'ALL'
        ? signals
        : signals.filter(s => s.type === filter);

    return (
        <div className="container py-12 px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Signals Hub</h1>
                    <p className="text-muted-foreground">Real-time automated monitoring of global market shifts.</p>
                </div>

                <Tabs defaultValue="ALL" onValueChange={setFilter} className="w-full md:w-auto">
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger value="ALL" className="data-[state=active]:bg-white/10">All</TabsTrigger>
                        <TabsTrigger value="MACRO" className="data-[state=active]:bg-white/10">Macro</TabsTrigger>
                        <TabsTrigger value="SECTOR" className="data-[state=active]:bg-white/10">Sector</TabsTrigger>
                        <TabsTrigger value="VOLATILITY" className="data-[state=active]:bg-white/10">Volatility</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSignals.map((signal, index) => (
                        <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <SignalCard signal={signal} />
                        </motion.div>
                    ))}
                </div>
            )}

            {!isLoading && filteredSignals.length === 0 && (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No signals found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
                </div>
            )}
        </div>
    );
}
