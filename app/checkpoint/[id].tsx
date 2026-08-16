import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { CHAPTERS, BADGES } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

const CHECKPOINT_DATA = [
  {
    num: 1,
    name: 'Stream Analysis',
    legacy: 'Namarupa',
    description: 'You can now see "events" instead of objects. The solid world has begun to dissolve into data packets. You are reading the raw stream.',
    insight: 'Every sensation is not a thing — it is an event. A data packet arising and passing. The table is not solid. It is a rapid succession of Earth-field Kalapas.',
    nextStep: 'Continue to Part I: The Diagnostic — identify the Virus.',
    color: '#00D4FF',
    icon: '🔍',
  },
  {
    num: 2,
    name: 'Spotting the Lag',
    legacy: 'Udayabbaya',
    description: 'The Self has been identified. You can see it as a loading icon — a recursive script, not a real entity. The malware has been located.',
    insight: 'The "I" that you thought was running the show is actually a background process. It arises and passes just like everything else. It is not the programmer. It is part of the program.',
    nextStep: 'Continue to Part II: The Code — learn to execute the patch.',
    color: '#00FF88',
    icon: '🦠',
  },
  {
    num: 3,
    name: 'The Overclock',
    legacy: 'Arising & Passing',
    description: 'The system is running hot. Lucid dreams, visions, energy rushes. This is "God Mode" — a rendering artifact. Do not mistake the special effects for Root Access.',
    insight: 'The Overclock is real but it is not the destination. It is a milestone, not the finish line. The "Dev Tools" (Siddhis) that appear here are Black Hat Traps. Keep patching.',
    nextStep: 'WARNING: The Defrag (Dark Night) is next. Keep patching.',
    color: '#FBBF24',
    icon: '⚡',
  },
  {
    num: 4,
    name: 'The Defrag',
    legacy: 'Dark Night',
    description: 'System Instability. The data purge is underway. This is uncomfortable. The system is deleting corrupted files. Do not abort the process.',
    insight: 'The Dark Night is not a failure state. It is the most important phase of the patch. The system is purging the deepest layers of the "Self" virus. Every moment of discomfort is a corrupted file being deleted.',
    nextStep: 'Keep patching. Zero Lag is on the other side.',
    color: '#A78BFA',
    icon: '🌑',
  },
  {
    num: 5,
    name: 'Zero Lag',
    legacy: 'Equanimity',
    description: 'Flow State achieved. The system is processing the Flux in real-time without buffering. The friction has dropped to near-zero.',
    insight: 'This is not enlightenment. This is the waiting room before the Reboot. The system is stable, clear, and ready. Do not cling to this state. Let the Reboot happen.',
    nextStep: 'The Reboot (Stream Entry) is imminent. Keep the diagnostic running.',
    color: '#00FF88',
    icon: '🌊',
  },
  {
    num: 6,
    name: 'The Reboot',
    legacy: 'Stream Entry',
    description: 'Root Access achieved. The system has rebooted with the patch. v1.0 is live. The first three Fetters have been permanently removed.',
    insight: 'This is not the end. It is the beginning of v1.0. The Save Point has been created — the system cannot revert to the Legacy OS. But deeper driver issues remain. The Optimization Loop continues.',
    nextStep: 'Begin the next Optimization Loop. v2.0 awaits.',
    color: '#FF6B35',
    icon: '🔓',
  },
];

export default function CheckpointScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress } = useProgress();

  const chapter = CHAPTERS.find(c => c.id === id);
  const cpNum = chapter ? Math.min(6, Math.floor(CHAPTERS.indexOf(chapter) / 8) + 1) : 1;
  const cpData = CHECKPOINT_DATA[cpNum - 1];

  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  // Find the badge for this checkpoint
  const badgeId = `badge-0${cpNum}`;
  const badge = BADGES.find(b => b.id === badgeId);
  const hasBadge = progress.earnedBadges.includes(badgeId);

  if (!cpData) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← BACK</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <View style={styles.topNav}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={20} color={C.text} />
        </Pressable>
        <Text style={styles.navLabel}>CHECKPOINT {cpNum}/6</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          {/* Checkpoint Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { borderColor: cpData.color }]}>
              <Text style={styles.iconEmoji}>{cpData.icon}</Text>
            </View>
            <View style={[styles.cpBadge, { backgroundColor: cpData.color + '22', borderColor: cpData.color }]}>
              <Text style={[styles.cpBadgeText, { color: cpData.color }]}>CHECKPOINT {cpNum} CLEARED</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.cpName, { color: cpData.color }]}>{cpData.name}</Text>
          <Text style={styles.cpLegacy}>Legacy Code: {cpData.legacy}</Text>

          {/* Description */}
          <View style={styles.descBlock}>
            <Text style={styles.descText}>{cpData.description}</Text>
          </View>

          {/* Insight */}
          <View style={[styles.insightBlock, { borderLeftColor: cpData.color }]}>
            <Text style={[styles.insightLabel, { color: cpData.color }]}>SYSTEM INSIGHT</Text>
            <Text style={styles.insightText}>{cpData.insight}</Text>
          </View>

          {/* Badge */}
          {badge && (
            <View style={[styles.badgeCard, hasBadge && { borderColor: cpData.color }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeName, hasBadge && { color: cpData.color }]}>{badge.name}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
              </View>
              {hasBadge && <IconSymbol name="checkmark.circle.fill" size={20} color={cpData.color} />}
            </View>
          )}

          {/* Next Step */}
          <View style={styles.nextBlock}>
            <Text style={styles.nextLabel}>&gt; NEXT OBJECTIVE</Text>
            <Text style={styles.nextText}>{cpData.nextStep}</Text>
          </View>

          {/* Continue Button */}
          <Pressable
            style={({ pressed }) => [styles.continueBtn, { backgroundColor: cpData.color }, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(tabs)/map' as any)}
          >
            <Text style={styles.continueBtnText}>CONTINUE TO ROADMAP ›</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backButton: { padding: 4, marginRight: 12 },
  navLabel: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconEmoji: { fontSize: 36 },
  cpBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  cpBadgeText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  cpName: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  cpLegacy: { color: C.muted, fontSize: 14, textAlign: 'center', fontStyle: 'italic', marginBottom: 20 },
  descBlock: { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  descText: { color: C.text, fontSize: 15, lineHeight: 23 },
  insightBlock: { borderLeftWidth: 3, paddingLeft: 16, marginBottom: 20 },
  insightLabel: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  insightText: { color: C.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  badgeIcon: { fontSize: 28 },
  badgeName: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  badgeDesc: { color: C.muted, fontSize: 12 },
  nextBlock: { backgroundColor: C.surface2, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  nextLabel: { color: C.primary, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  nextText: { color: C.text, fontSize: 14, lineHeight: 21 },
  continueBtn: { borderRadius: 14, padding: 18, alignItems: 'center' },
  continueBtnText: { color: C.bg, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backText: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
