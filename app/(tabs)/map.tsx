import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { CHAPTERS } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

const PARTS = [
  { id: 0, title: 'INTRODUCTION', subtitle: 'Waking Up in the Flux', icon: '⚡' },
  { id: 1, title: 'DIAGNOSTIC', subtitle: 'System Analysis', icon: '🔍' },
  { id: 2, title: 'CODE', subtitle: 'Patches & Tools', icon: '🛠️' },
  { id: 3, title: 'PATCH', subtitle: 'Integration', icon: '🔑' },
];

const PART_COLORS = ['#00D4FF', '#00FF88', '#FBBF24', '#FF6B35'];

export default function MapScreen() {
  const router = useRouter();
  const { progress, isChapterUnlockedFn } = useProgress();

  const totalPct = CHAPTERS.length > 0 ? Math.round((progress.completedChapters.length / CHAPTERS.length) * 100) : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>&gt;_ SYSTEM ROADMAP</Text>
        <Text style={styles.headerSub}>KERNEL_VERSION: MythOS_v1.0 | {totalPct}% PATCHED</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {PARTS.map((part) => {
          const partChapters = CHAPTERS.filter(c => c.part === part.id);
          const completedInPart = partChapters.filter(c => progress.completedChapters.includes(c.id)).length;
          const partColor = PART_COLORS[part.id];

          return (
            <View key={part.id} style={styles.partSection}>
              <View style={[styles.partHeader, { borderLeftColor: partColor }]}>
                <Text style={styles.partIcon}>{part.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.partTitle, { color: partColor }]}>{part.title}</Text>
                  <Text style={styles.partSubtitle}>{part.subtitle} · {completedInPart}/{partChapters.length} chapters</Text>
                </View>
              </View>

              {partChapters.map((chapter, idx) => {
                const isCompleted = progress.completedChapters.includes(chapter.id);
                const isUnlocked = isChapterUnlockedFn(chapter.id);
                const isLocked = !isUnlocked;

                return (
                  <View key={chapter.id} style={styles.nodeRow}>
                    <View style={styles.nodeConnector}>
                      {idx > 0 && <View style={[styles.connectorLine, { backgroundColor: isCompleted ? partColor : C.border }]} />}
                      <View style={[
                        styles.nodeCircle,
                        isCompleted && { backgroundColor: partColor, borderColor: partColor },
                        !isCompleted && isUnlocked && { borderColor: partColor },
                        isLocked && { borderColor: C.border },
                      ]}>
                        {isCompleted ? (
                          <IconSymbol name="checkmark" size={14} color={C.bg} />
                        ) : isLocked ? (
                          <IconSymbol name="lock.fill" size={12} color={C.muted} />
                        ) : (
                          <Text style={[styles.nodeNum, { color: isUnlocked ? partColor : C.muted }]}>
                            {idx + 1}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.chapterCard,
                        isCompleted && { borderColor: partColor + '44' },
                        isLocked && styles.lockedCard,
                        pressed && !isLocked && { opacity: 0.8 },
                      ]}
                      onPress={() => {
                        if (!isLocked) {
                          router.push(`/chapter/${chapter.id}` as any);
                        }
                      }}
                      disabled={isLocked}
                    >
                      <View style={styles.chapterCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.chapterNum, { color: isLocked ? C.muted : partColor }]}>
                            CH {idx + 1}
                          </Text>
                          <Text style={[styles.chapterTitle, isLocked && { color: C.muted }]}>
                            {chapter.title}
                          </Text>
                        </View>
                        <View style={styles.chapterRight}>
                          {!isLocked && (
                            <View style={[styles.xpBadge, { backgroundColor: partColor + '22', borderColor: partColor + '44' }]}>
                              <Text style={[styles.xpBadgeText, { color: partColor }]}>+{chapter.xpReward} XP</Text>
                            </View>
                          )}
                          {isLocked && <IconSymbol name="lock.fill" size={16} color={C.muted} />}
                          {isCompleted && <IconSymbol name="checkmark.circle.fill" size={20} color={partColor} />}
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { color: C.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  headerSub: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16 },
  partSection: { marginBottom: 24 },
  partHeader: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12 },
  partIcon: { fontSize: 20, marginRight: 10 },
  partTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  partSubtitle: { color: C.muted, fontSize: 12 },
  nodeRow: { flexDirection: 'row', marginBottom: 8 },
  nodeConnector: { width: 40, alignItems: 'center', paddingTop: 4 },
  connectorLine: { width: 2, height: 12, marginBottom: 2 },
  nodeCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  nodeNum: { fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  chapterCard: { flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
  lockedCard: { opacity: 0.5 },
  chapterCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  chapterNum: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  chapterTitle: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  chapterRight: { alignItems: 'flex-end', gap: 6 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  xpBadgeText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
});
