import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { BADGES, CHAPTERS, LEVELS, getLevelForXP } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B', error: '#F87171',
};

export default function ProfileScreen() {
  const { progress, currentLevel, xpProgress, resetAction } = useProgress();

  const totalChapters = CHAPTERS.length;
  const completedChapters = progress.completedChapters.length;
  const checkpointsCompleted = Math.floor(completedChapters / 8);

  const handleReset = () => {
    Alert.alert(
      'RESET PROGRESS',
      'This will delete all XP, completed chapters, and badges. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'RESET', style: 'destructive', onPress: () => resetAction() },
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>&gt;_ USER PROFILE</Text>
        <Text style={styles.headerSub}>SYSTEM ADMINISTRATOR</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelTop}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNum}>LVL {currentLevel.level}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.levelName}>{currentLevel.name.toUpperCase()}</Text>
              <Text style={styles.xpAmount}>{progress.xp} XP TOTAL</Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpProgress * 100}%` as any }]} />
          </View>
          <Text style={styles.xpNext}>
            {currentLevel.maxXp - progress.xp} XP to {LEVELS[Math.min(currentLevel.level, LEVELS.length - 1)]?.name ?? 'MAX'}
          </Text>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>&gt; SYSTEM STATS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedChapters}</Text>
            <Text style={styles.statLabel}>CHAPTERS READ</Text>
            <Text style={styles.statTotal}>/{totalChapters}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{checkpointsCompleted}</Text>
            <Text style={styles.statLabel}>CHECKPOINTS</Text>
            <Text style={styles.statTotal}>/6</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.completedDevlogs.length}</Text>
            <Text style={styles.statLabel}>DEVLOGS READ</Text>
            <Text style={styles.statTotal}>/4</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.accent }]}>{progress.streakCount}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
            <Text style={styles.statTotal}>🔥</Text>
          </View>
        </View>

        {/* Level Roadmap */}
        <Text style={styles.sectionTitle}>&gt; UPGRADE PATH</Text>
        <View style={styles.levelRoadmap}>
          {LEVELS.map((lvl) => {
            const isUnlocked = progress.xp >= lvl.minXp;
            const isCurrent = currentLevel.level === lvl.level;
            return (
              <View key={lvl.level} style={styles.levelRow}>
                <View style={[styles.levelDot, isUnlocked && styles.levelDotUnlocked, isCurrent && styles.levelDotCurrent]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelRowName, isUnlocked && { color: C.text }, isCurrent && { color: C.primary }]}>
                    {isCurrent ? '▶ ' : ''}{lvl.name}
                  </Text>
                  <Text style={styles.levelRowXP}>{lvl.minXp} XP</Text>
                </View>
                {isUnlocked && !isCurrent && <IconSymbol name="checkmark.circle.fill" size={16} color={C.primary} />}
                {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>CURRENT</Text></View>}
              </View>
            );
          })}
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>&gt; EARNED BADGES</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map(badge => {
            const earned = progress.earnedBadges.includes(badge.id);
            return (
              <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                <Text style={[styles.badgeIcon, !earned && { opacity: 0.3 }]}>{badge.icon}</Text>
                <Text style={[styles.badgeName, !earned && { color: C.muted }]}>{badge.name}</Text>
                <Text style={styles.badgeDesc}>{earned ? badge.description : '???'}</Text>
              </View>
            );
          })}
        </View>

        {/* Reset */}
        <Pressable style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]} onPress={handleReset}>
          <IconSymbol name="arrow.clockwise" size={16} color={C.error} />
          <Text style={styles.resetText}>RESET PROGRESS</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { color: C.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  headerSub: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16 },
  levelCard: { backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.primary + '44' },
  levelTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  levelBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary + '22', borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  levelNum: { color: C.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  levelName: { color: C.primary, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  xpAmount: { color: C.secondary, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  xpTrack: { height: 8, backgroundColor: C.surface2, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  xpNext: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  sectionTitle: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, width: '47%', borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  statValue: { color: C.primary, fontSize: 28, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statLabel: { color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.5, marginTop: 4 },
  statTotal: { color: C.muted, fontSize: 12, marginTop: 2 },
  levelRoadmap: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.border, gap: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  levelDotUnlocked: { backgroundColor: C.primary + '66' },
  levelDotCurrent: { backgroundColor: C.primary, width: 14, height: 14, borderRadius: 7 },
  levelRowName: { color: C.muted, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  levelRowXP: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  currentBadge: { backgroundColor: C.primary + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: C.primary },
  currentBadgeText: { color: C.primary, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  badgeCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, width: '47%', borderWidth: 1, borderColor: C.primary + '44', alignItems: 'center' },
  badgeCardLocked: { borderColor: C.border, opacity: 0.7 },
  badgeIcon: { fontSize: 28, marginBottom: 8 },
  badgeName: { color: C.text, fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  badgeDesc: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#F87171' + '44' },
  resetText: { color: '#F87171', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
});
