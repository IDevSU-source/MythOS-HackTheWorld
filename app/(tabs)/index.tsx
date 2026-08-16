import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { CHAPTERS, DEVLOGS, LEXICON, PARTS } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = { bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236', primary: '#00FF88', secondary: '#00D4FF', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B' };
const COLORS = ['#00D4FF', '#00FF88', '#FBBF24', '#FF8C42', '#C084FC', '#60A5FA', '#F472B6'];

export default function HomeScreen() {
  const router = useRouter();
  const { progress, currentLevel, xpProgress, isLoading } = useProgress();
  useEffect(() => { if (!isLoading && !progress.onboarded) router.replace('/onboarding' as any); }, [isLoading, progress.onboarded, router]);

  if (isLoading) return <ScreenContainer><View style={styles.center}><Text style={styles.mono}>LOADING SOURCE MAP…</Text></View></ScreenContainer>;

  const completeModules = progress.completedChapters.filter((id) => CHAPTERS.some((chapter) => chapter.id === id)).length;
  const totalProgress = CHAPTERS.length ? Math.round((completeModules / CHAPTERS.length) * 100) : 0;
  const nextModule = CHAPTERS.find((module) => !progress.completedChapters.includes(module.id));
  const latestSignal = DEVLOGS[DEVLOGS.length - 1];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}><Text style={styles.brand}>MYTHOS: HACK THE WORLD</Text><Text style={styles.streak}>🔥 {progress.streakCount}</Text></View>
          <Text style={styles.status}>&gt; SOURCE SYSTEM: ONLINE</Text>
          <Text style={styles.version}>PROTOCOL v1.0 · {totalProgress}% OF SOURCE EXPLORED</Text>
        </View>

        <View style={styles.xpCard}>
          <View style={styles.xpTop}><Text style={styles.level}>{currentLevel.name.toUpperCase()}</Text><Text style={styles.xpValue}>{progress.xp} XP</Text></View>
          <View style={styles.track}><View style={[styles.fill, { width: `${xpProgress * 100}%` as any }]} /></View>
          <Text style={styles.xpMeta}>LEVEL {currentLevel.level} · {completeModules}/{CHAPTERS.length} SOURCE MODULES COMPLETE</Text>
        </View>

        {nextModule && <Pressable onPress={() => router.push(`/chapter/${nextModule.id}` as any)} style={({ pressed }) => [styles.continue, pressed && { opacity: 0.82 }]}>
          <View style={{ flex: 1 }}><Text style={styles.continueLabel}>CONTINUE READING</Text><Text style={styles.continueTitle} numberOfLines={2}>{nextModule.title}</Text></View><IconSymbol name="chevron.right" size={22} color={C.bg} />
        </Pressable>}

        <Text style={styles.sectionTitle}>&gt; SOURCE LIBRARIES</Text>
        {PARTS.map((part) => {
          const modules = CHAPTERS.filter((module) => module.part === part.id);
          const completed = modules.filter((module) => progress.completedChapters.includes(module.id)).length;
          const color = COLORS[part.id] || C.primary;
          return <Pressable key={part.id} onPress={() => router.push('/(tabs)/map' as any)} style={({ pressed }) => [styles.library, pressed && { opacity: 0.82 }]}>
            <Text style={styles.libraryIcon}>{part.icon}</Text><View style={{ flex: 1 }}><Text style={[styles.libraryTitle, { color }]}>{part.title.toUpperCase()}</Text><Text style={styles.librarySubtitle}>{part.subtitle}</Text></View><Text style={styles.libraryCount}>{completed}/{modules.length}</Text>
          </Pressable>;
        })}

        <Text style={styles.sectionTitle}>&gt; ARCHIVE ACCESS</Text>
        <View style={styles.grid}>
          <Pressable onPress={() => router.push('/(tabs)/lexicon' as any)} style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.82 }]}><Text style={styles.gridIcon}>📖</Text><Text style={styles.gridLabel}>LEXICON</Text><Text style={styles.gridValue}>{progress.viewedLexicon.length}/{LEXICON.length}</Text></Pressable>
          <Pressable onPress={() => router.push('/(tabs)/logs' as any)} style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.82 }]}><Text style={styles.gridIcon}>📡</Text><Text style={styles.gridLabel}>DEVLOGS</Text><Text style={styles.gridValue}>{progress.completedDevlogs.length}/{DEVLOGS.length}</Text></Pressable>
          <Pressable onPress={() => router.push('/visuals' as any)} style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.82 }]}><Text style={styles.gridIcon}>🖼️</Text><Text style={styles.gridLabel}>VISUALS</Text><Text style={styles.gridValue}>52</Text></Pressable>
        </View>

        {latestSignal && <><Text style={styles.sectionTitle}>&gt; LATEST SIGNAL</Text><Pressable onPress={() => router.push(`/devlog/${latestSignal.id}` as any)} style={({ pressed }) => [styles.signal, pressed && { opacity: 0.82 }]}><Text style={styles.signalTag}>UPSTREAM LOG {String(latestSignal.order).padStart(3, '0')}</Text><Text style={styles.signalTitle}>{latestSignal.title}</Text><Text style={styles.signalCopy} numberOfLines={3}>{latestSignal.content.replace(/^#{1,3}\s+.+$/gm, '').replace(/\s+/g, ' ').trim()}</Text></Pressable></>}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 42 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, mono: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  header: { marginBottom: 18 }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, brand: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: '700', letterSpacing: 0.8 }, streak: { color: C.text, backgroundColor: C.surface2, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 11, overflow: 'hidden', fontSize: 12 }, status: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, marginBottom: 4 }, version: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 },
  xpCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 15, borderRadius: 12, marginBottom: 14 }, xpTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, level: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, fontWeight: '700' }, xpValue: { color: C.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, fontWeight: '700' }, track: { height: 6, borderRadius: 3, backgroundColor: C.surface2, overflow: 'hidden', marginBottom: 7 }, fill: { height: '100%', borderRadius: 3, backgroundColor: C.primary }, xpMeta: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 },
  continue: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.primary, borderRadius: 12, padding: 16, marginBottom: 21 }, continueLabel: { color: C.bg, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 0.7, marginBottom: 4 }, continueTitle: { color: C.bg, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  sectionTitle: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, letterSpacing: 1, marginTop: 4, marginBottom: 10 }, library: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 13, marginBottom: 8 }, libraryIcon: { fontSize: 20 }, libraryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 }, librarySubtitle: { color: C.muted, fontSize: 12 }, libraryCount: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 18 }, gridCard: { flex: 1, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 11, padding: 14 }, gridIcon: { fontSize: 22, marginBottom: 6 }, gridLabel: { color: C.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 3 }, gridValue: { color: C.primary, fontSize: 13, fontWeight: '700' },
  signal: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 15 }, signalTag: { color: C.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 7 }, signalTitle: { color: C.text, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 7 }, signalCopy: { color: C.muted, fontSize: 13, lineHeight: 19 },
});
