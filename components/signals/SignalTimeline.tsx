'use client';

import React from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface SignalData {
    time: string;
    impact: number;
    [key: string]: unknown;
}

interface SignalTimelineProps {
    data: SignalData[];
    height?: number;
}

export function SignalTimeline({ data, height = 300 }: SignalTimelineProps) {
    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#ffffff40"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#ffffff40"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #ffffff20',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="impact"
                        stroke="#60A5FA"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorImpact)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
