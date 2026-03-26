'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useExchange } from '@/context/ExchangeContext';
import { type ExchangeCode, EXCHANGE_CODES, EXCHANGES, ACTIVE_EXCHANGES } from '@/lib/exchange/config';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function ExchangeSelector() {
  const { selectedExchange, exchangeConfig, setExchange } = useExchange();
  const [open, setOpen] = useState(false);

  const handleSelect = (code: ExchangeCode) => {
    setExchange(code);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium',
            'border-border/50 bg-background/50 hover:bg-accent/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          )}
          aria-label={`Selected exchange: ${exchangeConfig.name}`}
        >
          <span className="text-base leading-none">{exchangeConfig.flag}</span>
          <span className="hidden sm:inline">{exchangeConfig.name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] p-2"
        align="start"
        sideOffset={8}
      >
        <div className="grid grid-cols-2 gap-1.5" role="listbox" aria-label="Select exchange">
          {EXCHANGE_CODES.map((code) => {
            const config = EXCHANGES[code];
            const isSelected = code === selectedExchange;
            const isActive = ACTIVE_EXCHANGES.has(code);
            return (
              <button
                key={code}
                role="option"
                aria-selected={isSelected && isActive}
                onClick={() => isActive && handleSelect(code)}
                disabled={!isActive}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors',
                  isActive ? 'hover:bg-accent/50 cursor-pointer' : 'opacity-50 cursor-not-allowed',
                  isSelected && isActive && 'bg-accent ring-1 ring-ring',
                )}
              >
                <span className="text-xl leading-none mt-0.5">{config.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">{config.name}</span>
                    {isSelected && isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                    {!isActive && (
                      <span className="text-[9px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {config.indexName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
