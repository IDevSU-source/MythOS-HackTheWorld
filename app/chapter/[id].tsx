import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
  Animated, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { CHAPTERS, LEXICON } from '@/lib/tps-data';
import { parseMarkdownToSections } from '@/lib/content-parser';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

const PART_COLORS = ['#00D4FF', '#00FF88', '#FBBF24', '#FF6B35'];

function XPPopup({ xp, badge, onDone }: { xp: number; badge?: string; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Modal visible transparent animationType="none">
      <View style={styles.popupOverlay}>
        <Animated.View style={[styles.popupCard, { transform: [{ scale }], opacity }]}>
          <Text style={styles.popupEmoji}>⚡</Text>
          <Text style={styles.popupTitle}>PATCH APPLIED</Text>
          <Text style={styles.popupXP}>+{xp} XP</Text>
          {badge && (
            <View style={styles.popupBadge}>
              <Text style={styles.popupBadgeText}>🏆 New Badge Unlocked!</Text>
            </View>
          )}
          <Pressable style={styles.popupBtn} onPress={onDone}>
            <Text style={styles.popupBtnText}>CONTINUE &gt;</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function TermBlock({ content }: { content: string }) {
  // Render inline TPS terms with highlight
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={styles.bodyText}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const term = part.slice(2, -2);
          return <Text key={i} style={styles.highlightTerm}>{term}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

function renderSection(section: { type: string; content?: string; items?: string[]; title?: string; left?: string; right?: string }, idx: number) {
  switch (section.type) {
    case 'heading':
      return <Text key={idx} style={styles.heading}>{section.content}</Text>;
    case 'subheading':
      return <Text key={idx} style={styles.subheading}>{section.content}</Text>;
    case 'body':
      return <TermBlock key={idx} content={section.content ?? ''} />;
    case 'quote':
      return (
        <View key={idx} style={styles.quoteBlock}>
          <Text style={styles.quoteText}>"{section.content}"</Text>
        </View>
      );
    case 'code':
      return (
        <View key={idx} style={styles.codeBlock}>
          <Text style={styles.codeText}>{section.content}</Text>
        </View>
      );
    case 'list':
      return (
        <View key={idx} style={styles.listBlock}>
          {(section.items ?? []).map((item, j) => (
            <View key={j} style={styles.listItem}>
              <Text style={styles.listBullet}>▸</Text>
              <TermBlock content={item} />
            </View>
          ))}
        </View>
      );
    case 'analogy':
      return (
        <View key={idx} style={styles.analogyBlock}>
          <Text style={styles.analogyLabel}>ANALOGY</Text>
          <Text style={styles.analogyText}>{section.content}</Text>
        </View>
      );
    case 'warning':
      return (
        <View key={idx} style={styles.warningBlock}>
          <Text style={styles.warningLabel}>⚠ WARNING</Text>
          <Text style={styles.warningText}>{section.content}</Text>
        </View>
      );
    case 'comparison':
      return (
        <View key={idx} style={styles.comparisonBlock}>
          <View style={styles.comparisonSide}>
            <Text style={styles.comparisonLabel}>LEGACY</Text>
            <Text style={styles.comparisonText}>{section.left}</Text>
          </View>
          <Text style={styles.comparisonArrow}>→</Text>
          <View style={styles.comparisonSide}>
            <Text style={[styles.comparisonLabel, { color: C.primary }]}>TPS</Text>
            <Text style={[styles.comparisonText, { color: C.primary }]}>{section.right}</Text>
          </View>
        </View>
      );
    default:
      return null;
  }
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress, completeChapterAction, isChapterUnlockedFn } = useProgress();

  const chapter = CHAPTERS.find(c => c.id === id);
  const isCompleted = progress.completedChapters.includes(id ?? '');
  const isUnlocked = isChapterUnlockedFn(id ?? '');

  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<{ xp: number; badge?: string } | null>(null);

  if (!chapter) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorText}>Chapter not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← BACK</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const partColor = PART_COLORS[chapter.part] ?? C.primary;
  const chapterIdx = CHAPTERS.findIndex(c => c.id === id);
  const nextChapter = CHAPTERS[chapterIdx + 1];

  const handleComplete = async () => {
    if (isCompleted) {
      if (nextChapter) router.push(`/chapter/${nextChapter.id}` as any);
      else router.push('/(tabs)/map' as any);
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const result = await completeChapterAction(id ?? '');
    setPopupData({ xp: result.xpGained, badge: result.newBadges[0] });
    setShowPopup(true);
  };

  const handlePopupDone = () => {
    setShowPopup(false);
    if (nextChapter) {
      router.push(`/chapter/${nextChapter.id}` as any);
    } else {
      router.push('/(tabs)/map' as any);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={20} color={C.text} />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={[styles.navPart, { color: partColor }]}>PART {chapter.part + 1}</Text>
          <Text style={styles.navChapter}>CH {CHAPTERS.indexOf(chapter) + 1}</Text>
        </View>
        <View style={[styles.xpBadge, { borderColor: partColor + '44' }]}>
          <Text style={[styles.xpBadgeText, { color: partColor }]}>+{chapter.xpReward} XP</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chapter Header */}
        <View style={[styles.chapterHeader, { borderLeftColor: partColor }]}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          {chapter.tagline && (
            <Text style={[styles.tagline, { color: partColor }]}>{chapter.tagline}</Text>
          )}
        </View>

        {/* Content Sections */}
        {(chapter.sections ?? parseMarkdownToSections(chapter.content)).map((section, idx) => renderSection(section as any, idx))}

        {/* Key Terms */}
        {chapter.keyTerms && chapter.keyTerms.length > 0 && (
          <View style={styles.keyTermsBlock}>
            <Text style={styles.keyTermsTitle}>&gt; KEY TERMS</Text>
            <View style={styles.keyTermsGrid}>
              {chapter.keyTerms.map(termId => {
                const entry = LEXICON.find(l => l.id === termId);
                if (!entry) return null;
                return (
                  <View key={termId} style={styles.keyTermChip}>
                    <Text style={styles.keyTermText}>{entry.tpsTerm}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Complete Button */}
        <Pressable
          style={({ pressed }) => [
            styles.completeBtn,
            { backgroundColor: isCompleted ? C.surface2 : partColor },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleComplete}
        >
          <Text style={[styles.completeBtnText, { color: isCompleted ? C.muted : C.bg }]}>
            {isCompleted ? '✓ COMPLETED — NEXT CHAPTER >' : '> MARK AS COMPLETE & EARN XP'}
          </Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>

      {showPopup && popupData && (
        <XPPopup xp={popupData.xp} badge={popupData.badge} onDone={handlePopupDone} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backButton: { padding: 4, marginRight: 12 },
  navCenter: { flex: 1 },
  navPart: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  navChapter: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, backgroundColor: 'transparent' },
  xpBadgeText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 20 },
  chapterHeader: { borderLeftWidth: 3, paddingLeft: 16, marginBottom: 24 },
  checkpointLabel: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  chapterTitle: { color: C.text, fontSize: 24, fontWeight: '700', lineHeight: 30, marginBottom: 6 },
  chapterSubtitle: { color: C.muted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  tagline: { fontSize: 13, fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  heading: { color: C.secondary, fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  subheading: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  bodyText: { color: C.text, fontSize: 15, lineHeight: 24, marginBottom: 14 },
  highlightTerm: { color: C.primary, fontWeight: '700' },
  quoteBlock: { borderLeftWidth: 3, borderLeftColor: C.secondary, paddingLeft: 16, marginVertical: 16, backgroundColor: C.surface2, padding: 14, borderRadius: 8 },
  quoteText: { color: C.secondary, fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  codeBlock: { backgroundColor: C.surface2, borderRadius: 8, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: C.border },
  codeText: { color: C.primary, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 20 },
  listBlock: { marginVertical: 12, gap: 8 },
  listItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  listBullet: { color: C.primary, fontSize: 14, marginTop: 4 },
  analogyBlock: { backgroundColor: C.surface, borderRadius: 10, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: C.accent + '44' },
  analogyLabel: { color: C.accent, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  analogyText: { color: C.text, fontSize: 14, lineHeight: 21 },
  warningBlock: { backgroundColor: '#F87171' + '11', borderRadius: 10, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: '#F87171' + '44' },
  warningLabel: { color: '#F87171', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  warningText: { color: C.text, fontSize: 14, lineHeight: 21 },
  comparisonBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12, backgroundColor: C.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.border },
  comparisonSide: { flex: 1 },
  comparisonLabel: { color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  comparisonText: { color: C.muted, fontSize: 13, lineHeight: 18 },
  comparisonArrow: { color: C.primary, fontSize: 18, fontWeight: '700' },
  keyTermsBlock: { marginTop: 24, marginBottom: 12, backgroundColor: C.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.border },
  keyTermsTitle: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, marginBottom: 10 },
  keyTermsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyTermChip: { backgroundColor: C.primary + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: C.primary + '44' },
  keyTermText: { color: C.primary, fontSize: 12, fontWeight: '600' },
  completeBtn: { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24 },
  completeBtnText: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: C.muted, fontSize: 16, marginBottom: 16 },
  backBtn: { padding: 12 },
  backBtnText: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  // Popup
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  popupCard: { backgroundColor: C.surface, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: C.primary, minWidth: 260 },
  popupEmoji: { fontSize: 48, marginBottom: 12 },
  popupTitle: { color: C.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  popupXP: { color: C.text, fontSize: 36, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 16 },
  popupBadge: { backgroundColor: C.accent + '22', borderRadius: 10, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: C.accent },
  popupBadgeText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  popupBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  popupBtnText: { color: C.bg, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
});
