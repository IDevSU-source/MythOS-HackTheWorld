import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLevelForXP, BADGES, CHAPTERS } from './tps-data';

const KEYS = {
  XP: 'tps_xp',
  COMPLETED_CHAPTERS: 'tps_completed_chapters',
  COMPLETED_DEVLOGS: 'tps_completed_devlogs',
  VIEWED_LEXICON: 'tps_viewed_lexicon',
  BADGES: 'tps_badges',
  ONBOARDED: 'tps_onboarded',
  STREAK_DATE: 'tps_streak_date',
  STREAK_COUNT: 'tps_streak_count',
};

export interface ProgressState {
  xp: number;
  completedChapters: string[];
  completedDevlogs: string[];
  viewedLexicon: string[];
  earnedBadges: string[];
  onboarded: boolean;
  streakCount: number;
  streakDate: string;
}

export async function loadProgress(): Promise<ProgressState> {
  try {
    const [xpRaw, chapRaw, logRaw, lexRaw, badgeRaw, onboardedRaw, streakDateRaw, streakCountRaw] =
      await AsyncStorage.multiGet([
        KEYS.XP, KEYS.COMPLETED_CHAPTERS, KEYS.COMPLETED_DEVLOGS,
        KEYS.VIEWED_LEXICON, KEYS.BADGES, KEYS.ONBOARDED,
        KEYS.STREAK_DATE, KEYS.STREAK_COUNT,
      ]);

    return {
      xp: xpRaw[1] ? parseInt(xpRaw[1]) : 0,
      completedChapters: chapRaw[1] ? JSON.parse(chapRaw[1]) : [],
      completedDevlogs: logRaw[1] ? JSON.parse(logRaw[1]) : [],
      viewedLexicon: lexRaw[1] ? JSON.parse(lexRaw[1]) : [],
      earnedBadges: badgeRaw[1] ? JSON.parse(badgeRaw[1]) : [],
      onboarded: onboardedRaw[1] === 'true',
      streakDate: streakDateRaw[1] ?? '',
      streakCount: streakCountRaw[1] ? parseInt(streakCountRaw[1]) : 0,
    };
  } catch {
    return {
      xp: 0, completedChapters: [], completedDevlogs: [],
      viewedLexicon: [], earnedBadges: [], onboarded: false,
      streakDate: '', streakCount: 0,
    };
  }
}

export async function saveXP(xp: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.XP, String(xp));
}

export async function completeChapter(chapterId: string, currentState: ProgressState): Promise<ProgressState> {
  if (currentState.completedChapters.includes(chapterId)) return currentState;

  const chapter = CHAPTERS.find(c => c.id === chapterId);
  const xpGain = chapter?.xpReward ?? 50;
  const newXP = currentState.xp + xpGain;
  const newCompleted = [...currentState.completedChapters, chapterId];

  // Check for new badges
  const newBadges = [...currentState.earnedBadges];
  const checkpointBadgeMap: Record<number, string> = {
    1: 'badge-01', 2: 'badge-02', 3: 'badge-03',
    4: 'badge-04', 5: 'badge-05', 6: 'badge-06',
  };
  // Badge awarding based on part completion
  const updatedChapters = [...currentState.completedChapters, chapterId];
  const partChapters = CHAPTERS.filter(c => c.part === chapter?.part);
  const partCompleted = partChapters.every(c => updatedChapters.includes(c.id));
  if (partCompleted && chapter) {
    const badgeId = `ch0${chapter.part + 1}`;
    if (!newBadges.includes(badgeId)) newBadges.push(badgeId);
  }

  // Update streak
  const today = new Date().toDateString();
  let newStreakCount = currentState.streakCount;
  let newStreakDate = currentState.streakDate;
  if (currentState.streakDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    newStreakCount = currentState.streakDate === yesterday ? currentState.streakCount + 1 : 1;
    newStreakDate = today;
  }

  await AsyncStorage.multiSet([
    [KEYS.XP, String(newXP)],
    [KEYS.COMPLETED_CHAPTERS, JSON.stringify(newCompleted)],
    [KEYS.BADGES, JSON.stringify(newBadges)],
    [KEYS.STREAK_DATE, newStreakDate],
    [KEYS.STREAK_COUNT, String(newStreakCount)],
  ]);

  return {
    ...currentState,
    xp: newXP,
    completedChapters: newCompleted,
    earnedBadges: newBadges,
    streakCount: newStreakCount,
    streakDate: newStreakDate,
  };
}

export async function completeDevlog(devlogId: string, currentState: ProgressState): Promise<ProgressState> {
  if (currentState.completedDevlogs.includes(devlogId)) return currentState;

  const newCompleted = [...currentState.completedDevlogs, devlogId];
  const newXP = currentState.xp + 25;
  const newBadges = [...currentState.earnedBadges];

  // Badge for reading all devlogs
  if (newCompleted.length >= 4 && !newBadges.includes('badge-08')) {
    newBadges.push('badge-08');
  }

  await AsyncStorage.multiSet([
    [KEYS.COMPLETED_DEVLOGS, JSON.stringify(newCompleted)],
    [KEYS.XP, String(newXP)],
    [KEYS.BADGES, JSON.stringify(newBadges)],
  ]);

  return { ...currentState, completedDevlogs: newCompleted, xp: newXP, earnedBadges: newBadges };
}

export async function viewLexiconEntry(entryId: string, currentState: ProgressState): Promise<ProgressState> {
  if (currentState.viewedLexicon.includes(entryId)) return currentState;

  const newViewed = [...currentState.viewedLexicon, entryId];
  const newBadges = [...currentState.earnedBadges];

  if (newViewed.length >= 30 && !newBadges.includes('badge-07')) {
    newBadges.push('badge-07');
  }

  await AsyncStorage.multiSet([
    [KEYS.VIEWED_LEXICON, JSON.stringify(newViewed)],
    [KEYS.BADGES, JSON.stringify(newBadges)],
  ]);

  return { ...currentState, viewedLexicon: newViewed, earnedBadges: newBadges };
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

export async function resetProgress(): Promise<ProgressState> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  return {
    xp: 0, completedChapters: [], completedDevlogs: [],
    viewedLexicon: [], earnedBadges: [], onboarded: false,
    streakDate: '', streakCount: 0,
  };
}

export function getProgressPercent(completedChapters: string[]): number {
  return Math.round((completedChapters.length / CHAPTERS.length) * 100);
}

export function isChapterUnlocked(chapterId: string, completedChapters: string[]): boolean {
  const idx = CHAPTERS.findIndex(c => c.id === chapterId);
  if (idx === 0) return true;
  // Each chapter unlocks when the previous one is completed
  const prev = CHAPTERS[idx - 1];
  return completedChapters.includes(prev.id);
}
