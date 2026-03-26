'use client';

import { useState, useCallback, useMemo } from 'react';
import { useHotkeys } from './useHotkeys';

interface PlaygroundActions {
  /** Switch to tab by index (0-based) */
  onSwitchTab: (tabId: string) => void;
  /** Refresh current tab data */
  onRefresh?: () => void;
  /** Export CSV */
  onExportCSV?: () => void;
  /** Toggle fullscreen chart */
  onToggleFullscreen?: () => void;
  /** Tab IDs in order */
  tabIds: string[];
}

/**
 * Playground keyboard shortcuts.
 *
 * | Key     | Action               |
 * |---------|----------------------|
 * | 1-9     | Switch tab           |
 * | r       | Refresh current tab  |
 * | e       | Export CSV            |
 * | f       | Toggle fullscreen    |
 * | Escape  | Close overlay         |
 * | ?       | Show shortcut help   |
 */
export function usePlaygroundHotkeys({
  onSwitchTab,
  onRefresh,
  onExportCSV,
  onToggleFullscreen,
  tabIds,
}: PlaygroundActions) {
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = useCallback(() => setShowHelp((prev) => !prev), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  const hotkeys = useMemo(
    () => [
      // Tab switching: 1-9
      ...tabIds.map((id, idx) => ({
        key: String(idx + 1),
        handler: () => onSwitchTab(id),
      })),
      // Refresh
      { key: 'r', handler: () => onRefresh?.() },
      // Export
      { key: 'e', handler: () => onExportCSV?.() },
      // Fullscreen
      { key: 'f', handler: () => onToggleFullscreen?.() },
      // Help
      { key: '?', handler: toggleHelp },
      // Escape closes help
      { key: 'escape', handler: closeHelp },
    ],
    [tabIds, onSwitchTab, onRefresh, onExportCSV, onToggleFullscreen, toggleHelp, closeHelp],
  );

  useHotkeys(hotkeys);

  return { showHelp, setShowHelp };
}

/** Shortcut definitions for the help dialog */
export const PLAYGROUND_SHORTCUTS = [
  { key: '1-9', description: 'Switch simulation tab' },
  { key: 'R', description: 'Refresh current tab' },
  { key: 'E', description: 'Export CSV' },
  { key: 'F', description: 'Toggle fullscreen chart' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close panel / exit fullscreen' },
];
