'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { IStock } from '@/types/stock';
import { Badge } from '@/components/ui/badge';

interface StockChatSheetProps {
    isOpen: boolean;
    onClose: () => void;
    stock: IStock | null;
}

export function StockChatSheet({ isOpen, onClose, stock }: StockChatSheetProps) {
    if (!stock) return null;

    const initialMessage = `Hello! I see you're interested in ${stock.ticker} (${stock.name}). I can help you analyze its recent price action, ${stock.sector} sector trends, or technical signals. What would you like to know?`;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* Custom overlay with no background/blur to avoid overpowering the UI */}
            <SheetContent
                side="right"
                overlayClassName="bg-transparent backdrop-blur-none pointer-events-none"
                className="top-[7rem] bottom-6 right-6 h-auto w-[400px] sm:w-[500px] border border-white/10 rounded-2xl shadow-2xl bg-brand-slate/95 backdrop-blur-xl p-0 flex flex-col data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right pointer-events-auto"
                style={{ position: 'fixed', maxHeight: 'calc(100vh - 8rem)' }}
            >
                <SheetHeader className="px-6 py-4 border-b border-white/10 bg-white/5 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center font-bold text-lg text-brand-blue border border-brand-blue/20">
                                {stock.ticker[0]}
                            </div>
                            <div className="text-left">
                                <SheetTitle className="text-white text-base font-semibold tracking-tight">{stock.ticker}</SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground line-clamp-1">{stock.name}</SheetDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-brand-blue/5 border-brand-blue/20 text-brand-blue text-[10px] uppercase tracking-wider">
                            AI Assistant
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden bg-transparent">
                    {/* Reusing existing ChatWindow with stock-specific context */}
                    <ChatWindow
                        key={stock.ticker}
                        initialMessage={initialMessage}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
