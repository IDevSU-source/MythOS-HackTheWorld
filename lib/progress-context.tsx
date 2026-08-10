import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ProgressState, loadProgress, completeChapter, completeDevlog,
  viewLexiconEntry, setOnboarded, resetProgress, isChapterUnlocked,
} from './progress-store';
import { getLevelForXP } from './tps-data';

interface ProgressContextType {
  progress: ProgressState;
  isLoading: boolean;
  completeChapterAction: (chapterId: string) => Promise<{ xpGained: number; newBadges: string[] }>;
  completeDevlogAction: (devlogId: string) => Promise<void>;
  viewLexiconAction: (entryId: string) => Promise<void>;
  setOnboardedAction: () => Promise<void>;
  resetAction: () => Promise<void>;
  isChapterUnlockedFn: (chapterId: string) => boolean;
  currentLevel: ReturnType<typeof getLevelForXP>;
  xpToNextLevel: number;
  xpProgress: number; // 0-1 for progress bar
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>({
    xp: 0, completedChapters: [], completedDevlogs: [],
    viewedLexicon: [], earnedBadges: [], onboarded: false,
    streakDate: '', streakCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress().then(p => {
      setProgress(p);
      setIsLoading(false);
    });
  }, []);

  const completeChapterAction = useCallback(async (chapterId: string) => {
    const prevBadges = progress.earnedBadges;
    const newState = await completeChapter(chapterId, progress);
    const newBadges = newState.earnedBadges.filter(b => !prevBadges.includes(b));
    const xpGained = newState.xp - progress.xp;
    setProgress(newState);
    return { xpGained, newBadges };
  }, [progress]);

  const completeDevlogAction = useCallback(async (devlogId: string) => {
    const newState = await completeDevlog(devlogId, progress);
    setProgress(newState);
  }, [progress]);

  const viewLexiconAction = useCallback(async (entryId: string) => {
    const newState = await viewLexiconEntry(entryId, progress);
    setProgress(newState);
  }, [progress]);

  const setOnboardedAction = useCallback(async () => {
    await setOnboarded();
    setProgress(p => ({ ...p, onboarded: true }));
  }, []);

  const resetAction = useCallback(async () => {
    const newState = await resetProgress();
    setProgress(newState);
  }, []);

  const isChapterUnlockedFn = useCallback((chapterId: string) => {
    return isChapterUnlocked(chapterId, progress.completedChapters);
  }, [progress.completedChapters]);

  const currentLevel = getLevelForXP(progress.xp);
  const xpToNextLevel = currentLevel.maxXp - currentLevel.minXp;
  const xpProgress = Math.min((progress.xp - currentLevel.minXp) / xpToNextLevel, 1);

  return (
    <ProgressContext.Provider value={{
      progress, isLoading, completeChapterAction, completeDevlogAction,
      viewLexiconAction, setOnboardedAction, resetAction,
      isChapterUnlockedFn, currentLevel, xpToNextLevel, xpProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
