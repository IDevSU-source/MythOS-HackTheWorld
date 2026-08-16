import React, { useMemo } from 'react';
import { View, Text, SectionList, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { CHAPTERS, PARTS, type Chapter } from '@/lib/tps-data';
import { useProgress } from '@/lib/progress-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = { bg: '#0A0E1A', surface: '#111827', primary: '#00FF88', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B' };
const COLORS = ['#00D4FF', '#00FF88', '#FBBF24', '#FF8C42', '#C084FC', '#60A5FA', '#F472B6'];

interface SourceSection { id: number; title: string; subtitle: string; icon: string; color: string; data: Chapter[] }

export default function MapScreen() {
  const router = useRouter();
  const { progress, isChapterUnlockedFn } = useProgress();
  const completeCount = progress.completedChapters.filter((id) => CHAPTERS.some((chapter) => chapter.id === id)).length;
  const totalPercent = CHAPTERS.length ? Math.round((completeCount / CHAPTERS.length) * 100) : 0;
  const sections = useMemo<SourceSection[]>(() => PARTS.map((part) => ({
    ...part,
    color: COLORS[part.id] || C.primary,
    data: CHAPTERS.filter((chapter) => chapter.part === part.id).sort((a, b) => a.order - b.order),
  })), []);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>&gt;_ SOURCE ROADMAP</Text>
        <Text style={styles.headerSub}>{completeCount}/{CHAPTERS.length} MODULES COMPLETE · {totalPercent}% EXPLORED</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { borderLeftColor: section.color }]}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <View style={{ flex: 1 }}><Text style={[styles.sectionTitle, { color: section.color }]}>{section.title.toUpperCase()}</Text><Text style={styles.sectionSub}>{section.subtitle} · {section.data.filter((module) => progress.completedChapters.includes(module.id)).length}/{section.data.length}</Text></View>
          </View>
        )}
        renderItem={({ item, section }) => {
          const complete = progress.completedChapters.includes(item.id);
          const unlocked = isChapterUnlockedFn(item.id);
          return (
            <Pressable
              disabled={!unlocked}
              onPress={() => router.push(`/chapter/${item.id}` as any)}
              style={({ pressed }) => [styles.card, complete && { borderColor: `${section.color}88` }, !unlocked && styles.locked, pressed && unlocked && { opacity: 0.8 }]}
            >
              <View style={[styles.node, { borderColor: unlocked ? section.color : C.border, backgroundColor: complete ? section.color : C.surface }]}>
                {complete ? <IconSymbol name="checkmark" size={13} color={C.bg} /> : unlocked ? <Text style={[styles.nodeText, { color: section.color }]}>{item.order}</Text> : <IconSymbol name="lock.fill" size={12} color={C.muted} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.moduleTitle, !unlocked && { color: C.muted }]}>{item.title}</Text>
                <Text style={styles.moduleMeta} numberOfLines={1}>{item.sourcePath}</Text>
              </View>
              {unlocked && <Text style={[styles.xp, { color: section.color }]}>+{item.xpReward}</Text>}
            </Pressable>
          );
        }}
        ListHeaderComponent={<Text style={styles.intro}>Read the complete source in sequence. Personal Codex, reference, and research modules are included in the completion path.</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: C.border }, headerTitle: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 }, headerSub: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
  content: { padding: 16, paddingBottom: 40 }, intro: { color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 11, marginTop: 18, marginBottom: 10, borderLeftWidth: 3 }, sectionIcon: { fontSize: 19 }, sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6 }, sectionSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, backgroundColor: C.surface, borderRadius: 11, borderWidth: 1, borderColor: C.border, marginBottom: 8 }, locked: { opacity: 0.48 }, node: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 }, nodeText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, fontWeight: '700' }, moduleTitle: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 3 }, moduleMeta: { color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }, xp: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700' },
});
