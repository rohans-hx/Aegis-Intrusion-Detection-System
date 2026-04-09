import { useEffect, useRef } from 'react';

/**
 * Polls `callback` every `intervalMs` milliseconds.
 * Fires immediately on mount if `immediate` is true.
 */
export function usePolling(callback, intervalMs = 10000, immediate = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (immediate) cbRef.current();
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, immediate]);
}
