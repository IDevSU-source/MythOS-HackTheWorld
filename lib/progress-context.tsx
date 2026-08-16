import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  EMPTY_PROGRESS,
  type ProgressState,
  completeChapter,
  completeDevlog,
  getEffectiveLevel,
  getRootAccessProgress,
  isChapterUnlocked,
  isRootAccessUnlocked,
  loadProgress,
  resetProgress,
  setOnboarded,
  viewLexiconEntry,
} from './progress-store';

interface ProgressContextType {
  progress: ProgressState;
  isLoading: boolean;
  completeChapterAction: (chapterId: string) => Promise<{ xpGained: number; newBadges: string[] }>;
  completeDevlogAction: (devlogId: string) => Promise<{ xpGained: number; newBadges: string[] }>;
  viewLexiconAction: (entryId: string) => Promise<void>;
  setOnboardedAction: () => Promise<void>;
  resetAction: () => Promise<void>;
  isChapterUnlockedFn: (chapterId: string) => boolean;
  currentLevel: ReturnType<typeof getEffectiveLevel>;
  xpToNextLevel: number;
  xpProgress: number;
  rootAccessUnlocked: boolean;
  rootAccessProgress: { completed: number; total: number; percent: number };
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadProgress().then((state) => { setProgress(state); setIsLoading(false); }); }, []);

  const completeChapterAction = useCallback(async (chapterId: string) => {
    const beforeBadges = progress.earnedBadges;
    const next = await completeChapter(chapterId, progress);
    setProgress(next);
    return { xpGained: next.xp - progress.xp, newBadges: next.earnedBadges.filter((badge) => !beforeBadges.includes(badge)) };
  }, [progress]);

  const completeDevlogAction = useCallback(async (devlogId: string) => {
    const beforeBadges = progress.earnedBadges;
    const next = await completeDevlog(devlogId, progress);
    setProgress(next);
    return { xpGained: next.xp - progress.xp, newBadges: next.earnedBadges.filter((badge) => !beforeBadges.includes(badge)) };
  }, [progress]);

  const viewLexiconAction = useCallback(async (entryId: string) => { setProgress(await viewLexiconEntry(entryId, progress)); }, [progress]);
  const setOnboardedAction = useCallback(async () => { await setOnboarded(); setProgress((state) => ({ ...state, onboarded: true })); }, []);
  const resetAction = useCallback(async () => { setProgress(await resetProgress()); }, []);
  const isChapterUnlockedFn = useCallback((chapterId: string) => isChapterUnlocked(chapterId, progress.completedChapters), [progress.completedChapters]);

  const currentLevel = getEffectiveLevel(progress);
  const xpToNextLevel = Math.max(0, currentLevel.maxXp - progress.xp);
  const xpSpan = Math.max(1, currentLevel.maxXp - currentLevel.minXp);
  const xpProgress = currentLevel.level === 8 ? 1 : Math.min(1, Math.max(0, (progress.xp - currentLevel.minXp) / xpSpan));
  const rootAccessUnlocked = useMemo(() => isRootAccessUnlocked(progress), [progress]);
  const rootAccessProgress = useMemo(() => getRootAccessProgress(progress), [progress]);

  return <ProgressContext.Provider value={{ progress, isLoading, completeChapterAction, completeDevlogAction, viewLexiconAction, setOnboardedAction, resetAction, isChapterUnlockedFn, currentLevel, xpToNextLevel, xpProgress, rootAccessUnlocked, rootAccessProgress }}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within ProgressProvider');
  return context;
}
