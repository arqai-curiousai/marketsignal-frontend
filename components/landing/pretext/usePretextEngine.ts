'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  prepare,
  layout,
  type PreparedText,
  type LayoutResult,
} from '@chenglou/pretext';

export interface PretextEngineInput {
  texts: string[];
  font: string;
  maxWidth: number;
  lineHeight: number;
}

export interface PretextEngineOutput {
  handles: PreparedText[];
  layouts: LayoutResult[];
  ready: boolean;
  relayout: (maxWidth: number) => LayoutResult[];
}

export function usePretextEngine({
  texts,
  font,
  maxWidth,
  lineHeight,
}: PretextEngineInput): PretextEngineOutput {
  const handlesRef = useRef<PreparedText[]>([]);
  const [ready, setReady] = useState(false);
  const [layouts, setLayouts] = useState<LayoutResult[]>([]);

  // Cold path: prepare all texts once fonts are loaded
  useEffect(() => {
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      const handles = texts.map((t) => prepare(t, font));
      handlesRef.current = handles;
      const results = handles.map((h) => layout(h, maxWidth, lineHeight));
      setLayouts(results);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [texts, font]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hot path: re-layout when maxWidth changes
  useEffect(() => {
    if (!ready || handlesRef.current.length === 0) return;
    const results = handlesRef.current.map((h) => layout(h, maxWidth, lineHeight));
    setLayouts(results);
  }, [maxWidth, lineHeight, ready]);

  const relayout = useCallback(
    (newWidth: number) => {
      if (handlesRef.current.length === 0) return [];
      return handlesRef.current.map((h) => layout(h, newWidth, lineHeight));
    },
    [lineHeight],
  );

  return {
    handles: handlesRef.current,
    layouts,
    ready,
    relayout,
  };
}
