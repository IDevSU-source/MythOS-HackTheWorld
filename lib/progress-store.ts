import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BADGES,
  CHAPTERS,
  DEVLOGS,
  LEXICON,
  ROOT_ACCESS_XP,
  ROOT_REQUIRED_DEVLOG_IDS,
  ROOT_REQUIRED_MODULE_IDS,
  getLevelForXP,
  type Level,
} from './tps-data';

const CONTENT_VERSION = 'mythos-source-v1';
const KEYS = {
  VERSION: 'mythos_content_version',
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

export const EMPTY_PROGRESS: ProgressState = {
  xp: 0, completedChapters: [], completedDevlogs: [], viewedLexicon: [], earnedBadges: [], onboarded: false, streakCount: 0, streakDate: '',
};

function knownIds(ids: string[], source: readonly { id: string }[]): string[] {
  const allowed = new Set(source.map((item) => item.id));
  return [...new Set(ids.filter((id) => allowed.has(id)))];
}

async function persist(state: ProgressState): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.VERSION, CONTENT_VERSION], [KEYS.XP, String(state.xp)], [KEYS.COMPLETED_CHAPTERS, JSON.stringify(state.completedChapters)], [KEYS.COMPLETED_DEVLOGS, JSON.stringify(state.completedDevlogs)], [KEYS.VIEWED_LEXICON, JSON.stringify(state.viewedLexicon)], [KEYS.BADGES, JSON.stringify(state.earnedBadges)], [KEYS.ONBOARDED, String(state.onboarded)], [KEYS.STREAK_DATE, state.streakDate], [KEYS.STREAK_COUNT, String(state.streakCount)],
  ]);
}

export async function loadProgress(): Promise<ProgressState> {
  try {
    const values = await AsyncStorage.multiGet(Object.values(KEYS));
    const data = Object.fromEntries(values);
    if (data[KEYS.VERSION] !== CONTENT_VERSION) {
      const migrated = { ...EMPTY_PROGRESS, onboarded: data[KEYS.ONBOARDED] === 'true' };
      await persist(migrated);
      return migrated;
    }
    return {
      xp: Number.parseInt(data[KEYS.XP] || '0', 10) || 0,
      completedChapters: knownIds(JSON.parse(data[KEYS.COMPLETED_CHAPTERS] || '[]'), CHAPTERS),
      completedDevlogs: knownIds(JSON.parse(data[KEYS.COMPLETED_DEVLOGS] || '[]'), DEVLOGS),
      viewedLexicon: knownIds(JSON.parse(data[KEYS.VIEWED_LEXICON] || '[]'), LEXICON),
      earnedBadges: knownIds(JSON.parse(data[KEYS.BADGES] || '[]'), BADGES),
      onboarded: data[KEYS.ONBOARDED] === 'true',
      streakDate: data[KEYS.STREAK_DATE] || '',
      streakCount: Number.parseInt(data[KEYS.STREAK_COUNT] || '0', 10) || 0,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function updateStreak(state: ProgressState): Pick<ProgressState, 'streakDate' | 'streakCount'> {
  const today = new Date().toDateString();
  if (state.streakDate === today) return { streakDate: state.streakDate, streakCount: state.streakCount };
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  return { streakDate: today, streakCount: state.streakDate === yesterday ? state.streakCount + 1 : 1 };
}

function hasEvery(ids: readonly string[], completed: string[]): boolean {
  return ids.every((id) => completed.includes(id));
}

export function isRootAccessUnlocked(progress: ProgressState): boolean {
  return hasEvery(ROOT_REQUIRED_MODULE_IDS, progress.completedChapters) && hasEvery(ROOT_REQUIRED_DEVLOG_IDS, progress.completedDevlogs);
}

export function getRootAccessProgress(progress: ProgressState) {
  const completed = ROOT_REQUIRED_MODULE_IDS.filter((id) => progress.completedChapters.includes(id)).length
    + ROOT_REQUIRED_DEVLOG_IDS.filter((id) => progress.completedDevlogs.includes(id)).length;
  const total = ROOT_REQUIRED_MODULE_IDS.length + ROOT_REQUIRED_DEVLOG_IDS.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function getEffectiveLevel(progress: ProgressState): Level {
  const nominal = getLevelForXP(progress.xp);
  if (nominal.level === 8 && !isRootAccessUnlocked(progress)) {
    return getLevelForXP(Math.max(0, ROOT_ACCESS_XP - 1));
  }
  return nominal;
}

function evaluateBadges(state: ProgressState): string[] {
  const badges = new Set(state.earnedBadges);
  const groupBadge: Record<number, string> = { 0: 'core', 4: 'codex', 5: 'reference', 6: 'research' };
  for (const [partString, badge] of Object.entries(groupBadge)) {
    const part = Number(partString);
    const source = CHAPTERS.filter((chapter) => chapter.part === part);
    if (source.length && source.every((chapter) => state.completedChapters.includes(chapter.id))) badges.add(badge);
  }
  if (DEVLOGS.every((devlog) => state.completedDevlogs.includes(devlog.id))) badges.add('devlogs');
  if (state.viewedLexicon.length >= 50) badges.add('lexicon');
  if (state.streakCount >= 7) badges.add('streak');
  if (isRootAccessUnlocked(state) && state.xp >= ROOT_ACCESS_XP) badges.add('root');
  return [...badges];
}

export async function completeChapter(chapterId: string, current: ProgressState): Promise<ProgressState> {
  const chapter = CHAPTERS.find((item) => item.id === chapterId);
  if (!chapter || current.completedChapters.includes(chapterId) || !isChapterUnlocked(chapterId, current.completedChapters)) return current;
  const streak = updateStreak(current);
  const state: ProgressState = {
    ...current,
    xp: current.xp + chapter.xpReward,
    completedChapters: [...current.completedChapters, chapterId],
    ...streak,
  };
  state.earnedBadges = evaluateBadges(state);
  await persist(state);
  return state;
}

export async function completeDevlog(devlogId: string, current: ProgressState): Promise<ProgressState> {
  const devlog = DEVLOGS.find((item) => item.id === devlogId);
  if (!devlog || current.completedDevlogs.includes(devlogId)) return current;
  const streak = updateStreak(current);
  const state: ProgressState = {
    ...current,
    xp: current.xp + devlog.xpReward,
    completedDevlogs: [...current.completedDevlogs, devlogId],
    ...streak,
  };
  state.earnedBadges = evaluateBadges(state);
  await persist(state);
  return state;
}

export async function viewLexiconEntry(entryId: string, current: ProgressState): Promise<ProgressState> {
  if (!LEXICON.some((entry) => entry.id === entryId) || current.viewedLexicon.includes(entryId)) return current;
  const state: ProgressState = { ...current, viewedLexicon: [...current.viewedLexicon, entryId] };
  state.earnedBadges = evaluateBadges(state);
  await persist(state);
  return state;
}

export async function setOnboarded(): Promise<void> { await AsyncStorage.setItem(KEYS.ONBOARDED, 'true'); }

export async function resetProgress(): Promise<ProgressState> { await AsyncStorage.multiRemove(Object.values(KEYS)); return EMPTY_PROGRESS; }

export function getProgressPercent(completed: string[]): number { return CHAPTERS.length ? Math.round((knownIds(completed, CHAPTERS).length / CHAPTERS.length) * 100) : 0; }

export function isChapterUnlocked(chapterId: string, completed: string[]): boolean {
  const index = CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  return index === 0 || (index > 0 && completed.includes(CHAPTERS[index - 1].id));
}
