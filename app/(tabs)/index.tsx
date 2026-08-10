import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Animated, Platform, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { CHAPTERS, DEVLOGS, getLevelForXP, LEVELS } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A',
  surface: '#111827',
  surface2: '#1A2236',
  primary: '#00FF88',
  secondary: '#00D4FF',
  accent: '#FF6B35',
  text: '#E2E8F0',
  muted: '#64748B',
  border: '#1E293B',
};

function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.Text style={[styles.cursor, { opacity }]}>█</Animated.Text>;
}

function XPBar({ xp, level, xpProgress }: { xp: number; level: ReturnType<typeof getLevelForXP>; xpProgress: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: xpProgress, duration: 800, useNativeDriver: false }).start();
  }, [xpProgress]);

  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpHeader}>
        <Text style={styles.levelName}>{level.name.toUpperCase()}</Text>
        <Text style={styles.xpText}>{xp} XP</Text>
      </View>
      <View style={styles.xpTrack}>
        <Animated.View style={[styles.xpFill, {
          width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
        }]} />
      </View>
      <Text style={styles.xpSubtext}>
        LVL {level.level} → {level.maxXp - xp} XP to next level
      </Text>
    </View>
  );
}

function PartCard({ part, completedCount, totalCount, onPress }: {
  part: { id: number; title: string; subtitle: string; icon: string; color: string }; completedCount: number; totalCount: number; onPress: () => void;
}) {
  const pct = totalCount > 0 ? completedCount / totalCount : 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.partCard, pressed && { opacity: 0.8 }]}>
      <View style={styles.partCardHeader}>
        <Text style={styles.partIcon}>{part.icon}</Text>
        <View style={styles.partCardText}>
          <Text style={[styles.partTitle, { color: part.color }]}>{part.title}</Text>
          <Text style={styles.partSubtitle}>{part.subtitle}</Text>
        </View>
        <Text style={styles.partProgress}>{completedCount}/{totalCount}</Text>
      </View>
      <View style={styles.partProgressTrack}>
        <View style={[styles.partProgressFill, { width: `${pct * 100}%` as any, backgroundColor: part.color }]} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { progress, currentLevel, xpProgress, isLoading } = useProgress();

  useEffect(() => {
    if (!isLoading && !progress.onboarded) {
      router.replace('/onboarding' as any);
    }
  }, [isLoading, progress.onboarded]);

  const partStats = [
    { id: 0, title: 'INTRODUCTION', subtitle: 'Waking Up in the Flux', icon: '⚡', color: '#00D4FF' },
    { id: 1, title: 'DIAGNOSTIC', subtitle: 'System Analysis', icon: '🔍', color: '#00FF88' },
    { id: 2, title: 'CODE', subtitle: 'Patches & Tools', icon: '🛠️', color: '#FFD700' },
    { id: 3, title: 'PATCH', subtitle: 'Integration', icon: '🔑', color: '#FF6B35' },
  ].map(part => {
    const chapters = CHAPTERS.filter(c => c.part === part.id);
    const completed = chapters.filter(c => progress.completedChapters.includes(c.id)).length;
    return { part, completedCount: completed, totalCount: chapters.length };
  });

  const totalPct = CHAPTERS.length > 0 ? Math.round((progress.completedChapters.length / CHAPTERS.length) * 100) : 0;

  // Find next chapter to read
  const nextChapter = CHAPTERS.find(c => !progress.completedChapters.includes(c.id));

  if (isLoading) {
    return (
      <View style={[styles.scroll, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.levelName}>LOADING...</Text>
      </View>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>TPS: HACK THE WORLD</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {progress.streakCount}</Text>
            </View>
          </View>
          <View style={styles.terminalLine}>
            <Text style={styles.prompt}>&gt; SYSTEM STATUS: </Text>
            <Text style={styles.online}>ONLINE</Text>
            <BlinkingCursor />
          </View>
          <Text style={styles.systemInfo}>KERNEL_VERSION: TPS_v1.0 | PROGRESS: {totalPct}%</Text>
        </View>

        {/* XP Bar */}
        <XPBar xp={progress.xp} level={currentLevel} xpProgress={xpProgress} />

        {/* Continue Button */}
        {nextChapter && (
          <Pressable
            style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/chapter/${nextChapter.id}` as any)}
          >
            <View style={styles.continueBtnInner}>
              <Text style={styles.continueBtnLabel}>&gt;_ CONTINUE DIAGNOSTIC</Text>
              <Text style={styles.continueBtnChapter}>{nextChapter.title}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={C.bg} />
          </Pressable>
        )}

        {/* System Modules */}
        <Text style={styles.sectionTitle}>&gt; SYSTEM MODULES</Text>
        {partStats.map(({ part, completedCount, totalCount }) => (
          <PartCard
            key={part.id}
            part={part}
            completedCount={completedCount}
            totalCount={totalCount}
            onPress={() => router.push('/(tabs)/map' as any)}
          />
        ))}

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>&gt; QUICK ACCESS</Text>
        <View style={styles.quickGrid}>
          <Pressable style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/lexicon' as any)}>
            <Text style={styles.quickIcon}>📖</Text>
            <Text style={styles.quickLabel}>LEXICON</Text>
            <Text style={styles.quickSub}>{progress.viewedLexicon.length}/30</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/logs' as any)}>
            <Text style={styles.quickIcon}>📡</Text>
            <Text style={styles.quickLabel}>DEV LOGS</Text>
            <Text style={styles.quickSub}>{progress.completedDevlogs.length}/4</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/profile' as any)}>
            <Text style={styles.quickIcon}>🏆</Text>
            <Text style={styles.quickLabel}>BADGES</Text>
            <Text style={styles.quickSub}>{progress.earnedBadges.length}/8</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/map' as any)}>
            <Text style={styles.quickIcon}>🗺️</Text>
            <Text style={styles.quickLabel}>ROADMAP</Text>
            <Text style={styles.quickSub}>{totalPct}% done</Text>
          </Pressable>
        </View>

        {/* Latest Devlog */}
        <Text style={styles.sectionTitle}>&gt; LATEST SIGNAL</Text>
        <Pressable
          style={({ pressed }) => [styles.devlogCard, pressed && { opacity: 0.8 }]}
          onPress={() => router.push(`/devlog/${DEVLOGS[DEVLOGS.length - 1].id}` as any)}
        >
          <View style={styles.devlogStatus}>
            <Text style={styles.devlogStatusText}>SIGNAL</Text>
          </View>
          <Text style={styles.devlogTitle}>{DEVLOGS[DEVLOGS.length - 1].title}</Text>
          <Text style={styles.devlogSummary}>{DEVLOGS[DEVLOGS.length - 1].content.substring(0, 100)}...</Text>
          <Text style={styles.devlogDate}>{DEVLOGS[DEVLOGS.length - 1].date}</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16 },
  header: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { color: C.primary, fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  streakBadge: { backgroundColor: C.surface2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  streakText: { color: C.text, fontSize: 13, fontWeight: '600' },
  terminalLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  prompt: { color: C.muted, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  online: { color: C.primary, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  cursor: { color: C.primary, fontSize: 13, marginLeft: 2 },
  systemInfo: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  xpContainer: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelName: { color: C.primary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  xpText: { color: C.secondary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  xpTrack: { height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  xpSubtext: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  continueBtn: { backgroundColor: C.primary, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueBtnInner: { flex: 1 },
  continueBtnLabel: { color: C.bg, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  continueBtnChapter: { color: C.bg, fontSize: 14, fontWeight: '700', opacity: 0.85 },
  sectionTitle: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  partCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  partCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  partIcon: { fontSize: 22, marginRight: 12 },
  partCardText: { flex: 1 },
  partTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  partSubtitle: { color: C.muted, fontSize: 12 },
  partProgress: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  partProgressTrack: { height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden' },
  partProgressFill: { height: '100%', borderRadius: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, width: '47%', borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { color: C.text, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  quickSub: { color: C.primary, fontSize: 12, fontWeight: '600' },
  devlogCard: { backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  devlogStatus: { marginBottom: 8 },
  devlogStatusText: { color: C.primary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  devlogTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  devlogSummary: { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  devlogDate: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
