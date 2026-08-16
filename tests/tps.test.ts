import { describe, expect, it } from 'vitest';

import {
  CHAPTERS,
  DEVLOGS,
  LEXICON,
  PARTS,
  ROOT_ACCESS_XP,
  ROOT_REQUIRED_DEVLOG_IDS,
  ROOT_REQUIRED_MODULE_IDS,
  getLevelForXP,
} from '../lib/tps-data';
import { parseMarkdownToSections, type ContentSection } from '../lib/content-parser';
import { EMPTY_PROGRESS, getEffectiveLevel, isChapterUnlocked, isRootAccessUnlocked } from '../lib/progress-store';

describe('release content integrity', () => {
  it('includes the complete first release corpus', () => {
    expect(CHAPTERS).toHaveLength(65);
    expect(DEVLOGS).toHaveLength(39);
    expect(LEXICON).toHaveLength(192);
    expect(PARTS).toHaveLength(7);
  });

  it('contains full-length source text rather than truncated excerpts', () => {
    expect(CHAPTERS.every((chapter) => chapter.content.length >= 200)).toBe(true);
    expect(CHAPTERS.reduce((total, chapter) => total + chapter.content.length, 0)).toBeGreaterThan(250_000);
    expect(DEVLOGS.reduce((total, devlog) => total + devlog.content.length, 0)).toBeGreaterThan(400_000);
  });

  it('includes Personal Codex, source integrations, and the Silicon Sutra white paper', () => {
    expect(CHAPTERS.filter((chapter) => chapter.group === 'codex')).toHaveLength(12);
    expect(CHAPTERS.some((chapter) => chapter.sourcePath.endsWith('ch10_03_white_paper.md'))).toBe(true);
    const corpus = [...CHAPTERS, ...DEVLOGS].map((entry) => entry.content).join('\n');
    for (const term of ['Gnosticism', 'Hermeticism', 'Stoicism', 'Zen']) expect(corpus).toContain(term);
  });

  it('uses a root XP total equal to all source reading rewards', () => {
    const sourceXp = CHAPTERS.filter((chapter) => chapter.requiredForRootAccess).reduce((total, chapter) => total + chapter.xpReward, 0) + DEVLOGS.filter((devlog) => devlog.requiredForRootAccess).reduce((total, devlog) => total + devlog.xpReward, 0);
    expect(ROOT_ACCESS_XP).toBe(sourceXp);
  });
});

describe('progression rules', () => {
  it('unlocks only the first module on a fresh profile', () => {
    expect(isChapterUnlocked(CHAPTERS[0].id, [])).toBe(true);
    expect(isChapterUnlocked(CHAPTERS[1].id, [])).toBe(false);
  });

  it('unlocks a module after its predecessor is completed', () => {
    expect(isChapterUnlocked(CHAPTERS[1].id, [CHAPTERS[0].id])).toBe(true);
  });

  it('does not grant Root Access based on XP alone', () => {
    const profile = { ...EMPTY_PROGRESS, xp: ROOT_ACCESS_XP };
    expect(isRootAccessUnlocked(profile)).toBe(false);
    expect(getEffectiveLevel(profile).level).toBe(7);
  });

  it('grants Root Access only after every required module and devlog is recorded', () => {
    const profile = {
      ...EMPTY_PROGRESS,
      xp: ROOT_ACCESS_XP,
      completedChapters: [...ROOT_REQUIRED_MODULE_IDS],
      completedDevlogs: [...ROOT_REQUIRED_DEVLOG_IDS],
    };
    expect(isRootAccessUnlocked(profile)).toBe(true);
    expect(getEffectiveLevel(profile).level).toBe(8);
    expect(getLevelForXP(ROOT_ACCESS_XP).name).toBe('Root Access');
  });
});

describe('Markdown rendering parser', () => {
  const firstOf = <T extends ContentSection['type']>(sections: ContentSection[], type: T) => sections.find((section): section is Extract<ContentSection, { type: T }> => section.type === type);

  it('parses headings, body text, quotes, lists, code, images, and tables', () => {
    const sections = parseMarkdownToSections('## Title\n\nParagraph\n\n> Quote\n\n- One\n- Two\n\n```\ncode\n```\n\n![Visual](/assets/infographics/TPS_IMG_Core.jpg)\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(firstOf(sections, 'heading')?.content).toBe('Title');
    expect(firstOf(sections, 'body')?.content).toBe('Paragraph');
    expect(firstOf(sections, 'quote')?.content).toBe('Quote');
    expect(firstOf(sections, 'list')?.items).toEqual(['One', 'Two']);
    expect(firstOf(sections, 'code')?.content).toBe('code');
    expect(firstOf(sections, 'image')?.assetName).toBe('TPS_IMG_Core.jpg');
    expect(firstOf(sections, 'table')?.rows).toEqual([['1', '2']]);
  });
});
