import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { markPassed as withPass, Progress } from './progress';
import { loadProgress, saveProgress } from './storage';

interface ProgressValue {
  progress: Progress;
  /** False until saved progress has been read. */
  loaded: boolean;
  markPassed: (exerciseId: string) => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>({});
  const [loaded, setLoaded] = useState(false);
  const latest = useRef<Progress>({});

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((saved) => {
      if (cancelled) return;
      // anything passed while loading is kept alongside what was saved
      latest.current = { ...saved, ...latest.current };
      setProgress(latest.current);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const markPassed = useCallback((exerciseId: string) => {
    const next = withPass(latest.current, exerciseId, Date.now());
    if (next === latest.current) return;
    latest.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  const value = useMemo(() => ({ progress, loaded, markPassed }), [progress, loaded, markPassed]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside a ProgressProvider');
  return value;
}
