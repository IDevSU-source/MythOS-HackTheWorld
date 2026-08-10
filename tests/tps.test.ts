import { describe, it, expect } from 'vitest';
import { CHAPTERS, LEXICON, DEVLOGS, BADGES, LEVELS, getLevelForXP } from '../lib/tps-data';
import { parseMarkdownToSections } from '../lib/content-parser';
import { isChapterUnlocked } from '../lib/progress-store';

describe('TPS Data Integrity', () => {
  it('should have chapters with required fields', () => {
    expect(CHAPTERS.length).toBeGreaterThan(0);
    for (const chapter of CHAPTERS) {
      expect(chapter.id).toBeTruthy();
      expect(chapter.title).toBeTruthy();
      expect(chapter.content).toBeTruthy();
      expect(typeof chapter.xpReward).toBe('number');
      expect(chapter.xpReward).toBeGreaterThan(0);
      expect(typeof chapter.part).toBe('number');
    }
  });

  it('should have lexicon entries', () => {
    expect(LEXICON.length).toBeGreaterThan(0);
    for (const entry of LEXICON) {
      expect(entry.id).toBeTruthy();
      expect(entry.tpsTerm).toBeTruthy();
    }
  });

  it('should have devlogs', () => {
    expect(DEVLOGS.length).toBeGreaterThan(0);
    for (const log of DEVLOGS) {
      expect(log.id).toBeTruthy();
      expect(log.title).toBeTruthy();
      expect(log.content).toBeTruthy();
      expect(log.xpReward).toBeGreaterThan(0);
    }
  });

  it('should have 8 badges', () => {
    expect(BADGES.length).toBe(8);
  });

  it('should have 8 levels', () => {
    expect(LEVELS.length).toBe(8);
  });
});

describe('getLevelForXP', () => {
  it('should return level 1 for 0 XP', () => {
    const level = getLevelForXP(0);
    expect(level.level).toBe(1);
    expect(level.name).toBe('Booting Up');
  });

  it('should return level 2 for 500 XP', () => {
    const level = getLevelForXP(500);
    expect(level.level).toBe(2);
  });

  it('should return level 8 for 7000+ XP', () => {
    const level = getLevelForXP(7000);
    expect(level.level).toBe(8);
    expect(level.name).toBe('Root Access');
  });

  it('should return the highest level for very high XP', () => {
    const level = getLevelForXP(99999);
    expect(level.level).toBe(8);
  });
});

describe('parseMarkdownToSections', () => {
  it('should parse headings', () => {
    const sections = parseMarkdownToSections('## Hello World');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('heading');
    expect(sections[0].content).toBe('Hello World');
  });

  it('should parse subheadings', () => {
    const sections = parseMarkdownToSections('### Sub Heading');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('subheading');
  });

  it('should parse blockquotes', () => {
    const sections = parseMarkdownToSections('> This is a quote');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('quote');
  });

  it('should parse code blocks', () => {
    const sections = parseMarkdownToSections('```\nsome code\n```');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('code');
    expect(sections[0].content).toBe('some code');
  });

  it('should parse unordered lists', () => {
    const sections = parseMarkdownToSections('- Item 1\n- Item 2\n- Item 3');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('list');
    expect(sections[0].items).toHaveLength(3);
  });

  it('should parse body text', () => {
    const sections = parseMarkdownToSections('This is body text.');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('body');
    expect(sections[0].content).toBe('This is body text.');
  });

  it('should handle mixed content', () => {
    const md = `## Title\n\nSome body text.\n\n> A quote\n\n- Item 1\n- Item 2`;
    const sections = parseMarkdownToSections(md);
    const types = sections.map(s => s.type);
    expect(types).toContain('heading');
    expect(types).toContain('body');
    expect(types).toContain('quote');
    expect(types).toContain('list');
  });
});

describe('isChapterUnlocked', () => {
  it('should unlock the first chapter always', () => {
    const firstId = CHAPTERS[0].id;
    expect(isChapterUnlocked(firstId, [])).toBe(true);
  });

  it('should lock the second chapter when first is not completed', () => {
    const secondId = CHAPTERS[1].id;
    expect(isChapterUnlocked(secondId, [])).toBe(false);
  });

  it('should unlock the second chapter when first is completed', () => {
    const firstId = CHAPTERS[0].id;
    const secondId = CHAPTERS[1].id;
    expect(isChapterUnlocked(secondId, [firstId])).toBe(true);
  });

  it('should unlock a chapter when its predecessor is completed', () => {
    const completedIds = CHAPTERS.slice(0, 5).map(c => c.id);
    const sixthId = CHAPTERS[5].id;
    expect(isChapterUnlocked(sixthId, completedIds)).toBe(true);
  });
});
