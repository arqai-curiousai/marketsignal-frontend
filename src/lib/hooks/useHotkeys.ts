"use client";

import { useEffect, useCallback } from "react";

type HotkeyHandler = (e: KeyboardEvent) => void;
type HotkeyDef = {
  /** Key combo: e.g. "mod+k", "escape", "?" */
  key: string;
  handler: HotkeyHandler;
  /** If true, prevent default browser behavior */
  preventDefault?: boolean;
};

/**
 * Minimal hotkey hook — no external dependencies.
 *
 * Supports:
 *  - "mod+k"  → Cmd+K on Mac, Ctrl+K elsewhere
 *  - "mod+/"  → Cmd+/ or Ctrl+/
 *  - "escape" → Escape key
 *  - "?"      → Question mark (for help modal)
 */
export function useHotkeys(hotkeys: HotkeyDef[]): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const hotkey of hotkeys) {
        if (matchesHotkey(e, hotkey.key)) {
          if (hotkey.preventDefault !== false) {
            e.preventDefault();
          }
          hotkey.handler(e);
          return;
        }
      }
    },
    [hotkeys]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function matchesHotkey(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const requiresMod = parts.includes("mod");
  const requiresShift = parts.includes("shift");

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    "";
  const modPressed = platform.includes("Mac") ? e.metaKey : e.ctrlKey;

  if (requiresMod && !modPressed) return false;
  if (!requiresMod && modPressed) return false;
  if (requiresShift && !e.shiftKey) return false;

  if (key === "escape") return e.key === "Escape";
  if (key === "?") return e.key === "?";
  return e.key.toLowerCase() === key;
}
