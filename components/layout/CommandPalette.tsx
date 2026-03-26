"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Radar,
  DollarSign,
  FlaskConical,
  MessageSquare,
  Library,
  Settings,
  LogOut,
  TrendingUp,
  Moon,
  Sun,
  Keyboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { useHotkeys } from "@/lib/hooks/useHotkeys";

const NAV_ITEMS = [
  { name: "Pulse", href: "/signals", icon: Radar, shortcut: "G P" },
  { name: "Forex", href: "/forex", icon: DollarSign, shortcut: "G F" },
  { name: "Playground", href: "/playground", icon: FlaskConical, shortcut: "G L" },
  { name: "Assistant", href: "/assistant", icon: MessageSquare },
  { name: "Research", href: "/research", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  // Cmd+K to open
  const hotkeys = useMemo(() => [
    {
      key: "mod+k",
      handler: () => setOpen((o: boolean) => !o),
    },
  ], []);
  useHotkeys(hotkeys);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      setSearch("");
      command();
    },
    []
  );

  // Reset search on close
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages, stocks, actions..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/stocks"))
            }
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Browse Stocks</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setTheme(theme === "dark" ? "light" : "dark");
              })
            }
          >
            <Sun className="mr-2 h-4 w-4 dark:hidden" />
            <Moon className="mr-2 h-4 w-4 hidden dark:block" />
            <span>Toggle Theme</span>
          </CommandItem>
          {isAuthenticated && (
            <CommandItem onSelect={() => runCommand(() => logout())}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Keyboard shortcuts hint */}
        <CommandGroup heading="Keyboard">
          <CommandItem disabled>
            <Keyboard className="mr-2 h-4 w-4" />
            <span className="text-muted-foreground text-xs">
              Press ? for all shortcuts
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
