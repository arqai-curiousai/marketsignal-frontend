'use client';

import { useState, useEffect } from 'react';

/**
 * Returns whether the page is currently visible.
 * Use to pause expensive animations/particles when tab is hidden.
 */
export function useVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    function onChange() {
      setIsVisible(document.visibilityState === 'visible');
    }

    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return isVisible;
}
