import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { CHAPTERS, PARTS } from '@/lib/tps-data';
import { parseMarkdownToSections, type ContentSection } from '@/lib/content-parser';
import { getInfographicAsset } from '@/lib/infographics';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FFB454',
  text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B', warning: '#F87171',
};

const PART_COLORS = ['#00D4FF', '#00FF88', '#FBBF24', '#FF8C42', '#C084FC', '#60A5FA', '#F472B6'];

function InlineText({ content }: { content: string }) {
  const chunks = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={styles.bodyText}>
      {chunks.map((chunk, index) =>
        chunk.startsWith('**') && chunk.endsWith('**')
          ? <Text key={index} style={styles.highlight}>{chunk.slice(2, -2)}</Text>
          : <Text key={index}>{chunk}</Text>,
      )}
    </Text>
  );
}

function RenderSection({ section }: { section: ContentSection }) {
  if (section.type === 'heading') return <Text style={styles.heading}>{section.content}</Text>;
  if (section.type === 'subheading') return <Text style={styles.subheading}>{section.content}</Text>;
  if (section.type === 'body') return <InlineText content={section.content} />;
  if (section.type === 'quote') {
    return <View style={styles.quote}><Text style={styles.quoteText}>{section.content}</Text></View>;
  }
  if (section.type === 'code') {
    return <View style={styles.code}><Text style={styles.codeText}>{section.content}</Text></View>;
  }
  if (section.type === 'list') {
    return (
      <View style={styles.list}>
        {section.items.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.listRow}>
            <Text style={styles.bullet}>▸</Text>
            <View style={styles.listCopy}><InlineText content={item} /></View>
          </View>
        ))}
      </View>
    );
  }
  if (section.type === 'table') {
    return (
      <View style={styles.table}>
        {section.headers.map((header, index) => <Text key={`${header}-${index}`} style={styles.tableHeader}>{header}</Text>)}
        {section.rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.tableRow}>
            {row.map((cell, cellIndex) => <Text key={`cell-${cellIndex}`} style={styles.tableCell}>{cell}</Text>)}
          </View>
        ))}
      </View>
    );
  }
  if (section.type === 'image') {
    const asset = getInfographicAsset(section.assetName);
    return asset ? (
      <View style={styles.visualReference}>
        <Image source={asset} style={styles.visualImage} resizeMode="contain" accessibilityLabel={section.alt || section.assetName} />
        <Text style={styles.visualCopy}>{section.alt || section.assetName}</Text>
      </View>
    ) : <View style={styles.visualReference}><Text style={styles.visualLabel}>SOURCE VISUAL</Text><Text style={styles.visualCopy}>{section.alt || section.assetName}</Text></View>;
  }
  return null;
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress, completeChapterAction, isChapterUnlockedFn } = useProgress();
  const [completion, setCompletion] = useState<{ xp: number; badge?: string } | null>(null);

  const chapter = CHAPTERS.find((item) => item.id === id);
  const chapterIndex = chapter ? CHAPTERS.indexOf(chapter) : -1;
  const nextChapter = chapterIndex >= 0 ? CHAPTERS[chapterIndex + 1] : undefined;
  const isCompleted = Boolean(id && progress.completedChapters.includes(id));
  const isUnlocked = Boolean(id && isChapterUnlockedFn(id));
  const sections = useMemo(() => chapter ? parseMarkdownToSections(chapter.content) : [], [chapter]);

  if (!chapter) {
    return (
      <ScreenContainer><View style={styles.center}><Text style={styles.error}>Module not found.</Text></View></ScreenContainer>
    );
  }

  const part = PARTS.find((item) => item.id === chapter.part);
  const partColor = PART_COLORS[chapter.part] || C.primary;

  const complete = async () => {
    if (!isUnlocked) return;
    if (isCompleted) {
      if (nextChapter) router.push(`/chapter/${nextChapter.id}` as any);
      else router.push('/(tabs)/profile' as any);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await completeChapterAction(chapter.id);
    setCompletion({ xp: result.xpGained, badge: result.newBadges[0] });
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back}><IconSymbol name="arrow.left" size={20} color={C.text} /></Pressable>
        <View style={styles.navTitle}>
          <Text style={[styles.navPart, { color: partColor }]}>{part?.title.toUpperCase() || 'SOURCE MODULE'}</Text>
          <Text style={styles.navModule}>MODULE {chapterIndex + 1} OF {CHAPTERS.length}</Text>
        </View>
        <View style={[styles.xpChip, { borderColor: `${partColor}66` }]}><Text style={[styles.xpChipText, { color: partColor }]}>+{chapter.xpReward} XP</Text></View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderLeftColor: partColor }]}>
          <Text style={styles.title}>{chapter.title}</Text>
          {!!chapter.tagline && <Text style={[styles.tagline, { color: partColor }]}>{chapter.tagline}</Text>}
          <Text style={styles.source}>SOURCE: {chapter.sourcePath}</Text>
        </View>

        {sections.map((section, index) => <RenderSection key={`${section.type}-${index}`} section={section} />)}

        <Pressable
          disabled={!isUnlocked}
          onPress={complete}
          style={({ pressed }) => [
            styles.complete,
            { backgroundColor: isCompleted ? C.surface2 : partColor },
            !isUnlocked && styles.disabled,
            pressed && isUnlocked && { opacity: 0.82 },
          ]}
        >
          <Text style={[styles.completeText, { color: isCompleted || !isUnlocked ? C.muted : C.bg }]}>
            {isCompleted ? (nextChapter ? 'COMPLETED — OPEN NEXT MODULE' : 'COMPLETED — VIEW YOUR PROGRESS') : isUnlocked ? 'MARK MODULE COMPLETE & EARN XP' : 'COMPLETE THE PREVIOUS MODULE TO UNLOCK'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal visible={Boolean(completion)} transparent animationType="fade" onRequestClose={() => setCompletion(null)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalIcon}>⚡</Text>
            <Text style={styles.modalTitle}>MODULE RECORDED</Text>
            <Text style={styles.modalXp}>+{completion?.xp || 0} XP</Text>
            {!!completion?.badge && <Text style={styles.modalBadge}>Badge unlocked</Text>}
            <Pressable style={styles.modalButton} onPress={() => { setCompletion(null); if (nextChapter) router.push(`/chapter/${nextChapter.id}` as any); else router.push('/(tabs)/profile' as any); }}>
              <Text style={styles.modalButtonText}>{nextChapter ? 'CONTINUE' : 'VIEW PROGRESS'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { padding: 5, marginRight: 10 }, navTitle: { flex: 1 }, navPart: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1 }, navModule: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, marginTop: 2 },
  xpChip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, xpChipText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', fontSize: 11 },
  scroll: { flex: 1, backgroundColor: C.bg }, content: { padding: 20, paddingBottom: 42 },
  hero: { borderLeftWidth: 3, paddingLeft: 15, marginBottom: 22 }, title: { color: C.text, fontSize: 25, fontWeight: '700', lineHeight: 31, marginBottom: 8 }, tagline: { fontSize: 14, lineHeight: 21, fontStyle: 'italic', marginBottom: 10 }, source: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 },
  heading: { color: C.secondary, fontSize: 19, fontWeight: '700', lineHeight: 26, marginTop: 24, marginBottom: 10 }, subheading: { color: C.text, fontSize: 16, fontWeight: '700', lineHeight: 22, marginTop: 18, marginBottom: 8 }, bodyText: { color: C.text, fontSize: 15, lineHeight: 24, marginBottom: 14 }, highlight: { color: C.primary, fontWeight: '700' },
  quote: { backgroundColor: C.surface2, borderLeftWidth: 3, borderLeftColor: C.secondary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginVertical: 10 }, quoteText: { color: C.secondary, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  code: { backgroundColor: '#080D17', borderWidth: 1, borderColor: C.border, padding: 14, borderRadius: 10, marginVertical: 10 }, codeText: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, lineHeight: 20 },
  list: { marginVertical: 8, gap: 4 }, listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, bullet: { color: C.primary, marginTop: 3 }, listCopy: { flex: 1 },
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: 'hidden', marginVertical: 12 }, tableHeader: { color: C.secondary, fontSize: 12, fontWeight: '700', padding: 11, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface2 }, tableRow: { padding: 11, borderBottomWidth: 1, borderBottomColor: C.border }, tableCell: { color: C.text, fontSize: 13, lineHeight: 19, marginBottom: 5 },
  visualReference: { marginVertical: 12, padding: 10, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: `${C.accent}66` }, visualImage: { width: '100%', height: 260, borderRadius: 7, backgroundColor: '#080D17' }, visualLabel: { color: C.accent, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }, visualCopy: { color: C.text, fontSize: 12, marginTop: 8 },
  complete: { marginTop: 24, borderRadius: 13, padding: 17, alignItems: 'center' }, disabled: { opacity: 0.45 }, completeText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 0.4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, error: { color: C.warning, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modal: { width: '100%', maxWidth: 320, backgroundColor: C.surface, borderWidth: 1, borderColor: C.primary, borderRadius: 18, padding: 28, alignItems: 'center' }, modalIcon: { fontSize: 42, marginBottom: 10 }, modalTitle: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, fontSize: 13, fontWeight: '700' }, modalXp: { color: C.text, fontSize: 34, fontWeight: '700', marginVertical: 10 }, modalBadge: { color: C.accent, fontSize: 13, marginBottom: 16 }, modalButton: { backgroundColor: C.primary, borderRadius: 9, paddingHorizontal: 22, paddingVertical: 12 }, modalButtonText: { color: C.bg, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
