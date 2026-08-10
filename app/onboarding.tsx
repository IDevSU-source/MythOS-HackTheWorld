import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '@/lib/progress-context';
import * as Haptics from 'expo-haptics';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

const BOOT_LINES = [
  { text: '> SYSTEM BOOT SEQUENCE INITIATED...', delay: 0 },
  { text: '> KERNEL_VERSION: TPS_v1.0', delay: 400 },
  { text: '> CHECKING PERMISSIONS...', delay: 800 },
  { text: '> ROOT_ACCESS: GRANTED', delay: 1200 },
  { text: '> LOADING PHYSICS ENGINE...', delay: 1600 },
  { text: '> SCANNING FOR MALWARE...', delay: 2000 },
  { text: '> WARNING: SELF_PROCESS DETECTED', delay: 2400 },
  { text: '> INITIALIZING DIAGNOSTIC SUITE...', delay: 2800 },
  { text: '> PRESS [ENTER] TO BEGIN HACK...', delay: 3400 },
];

function BootLine({ text, delay }: { text: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  const isWarning = text.includes('WARNING');
  const isGranted = text.includes('GRANTED');
  const isPress = text.includes('PRESS');

  return (
    <Animated.Text style={[
      styles.bootLine,
      isWarning && { color: '#FBBF24' },
      isGranted && { color: C.primary },
      isPress && { color: C.secondary, fontWeight: '700' },
      { opacity },
    ]}>
      {text}
    </Animated.Text>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboardedAction } = useProgress();
  const [showButton, setShowButton] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
      Animated.timing(buttonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await setOnboardedAction();
    router.replace('/(tabs)' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>TPS</Text>
          <Text style={styles.logoSub}>HACK THE WORLD</Text>
          <Text style={styles.logoTagline}>A Technical Manual for the Biological OS</Text>
        </View>

        {/* Terminal */}
        <View style={styles.terminal}>
          <View style={styles.terminalHeader}>
            <View style={[styles.terminalDot, { backgroundColor: '#F87171' }]} />
            <View style={[styles.terminalDot, { backgroundColor: '#FBBF24' }]} />
            <View style={[styles.terminalDot, { backgroundColor: '#4ADE80' }]} />
            <Text style={styles.terminalTitle}>tps_diagnostic.sh</Text>
          </View>
          <View style={styles.terminalBody}>
            {BOOT_LINES.map((line, i) => (
              <BootLine key={i} text={line.text} delay={line.delay} />
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>Reality is a simulation.</Text>
          <Text style={styles.descText}>
            You are running buggy software. The bug is suffering. The fix is available.
            {'\n\n'}
            This is not a self-help app. This is a <Text style={styles.highlight}>technical manual</Text> for debugging your biological operating system — using the same framework that millions of engineers have run for 2,500 years.
            {'\n\n'}
            The ancient engineers called it <Text style={styles.highlight}>Dharma</Text>. We call it <Text style={styles.highlight}>Trillions Per Second</Text>.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>20+</Text>
            <Text style={styles.statLabel}>CHAPTERS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>30</Text>
            <Text style={styles.statLabel}>LEXICON TERMS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>8</Text>
            <Text style={styles.statLabel}>BADGES</Text>
          </View>
        </View>

        {/* Start Button */}
        {showButton && (
          <Animated.View style={{ opacity: buttonOpacity }}>
            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
              onPress={handleStart}
            >
              <Text style={styles.startBtnText}>&gt;_ INITIATE DIAGNOSTIC</Text>
            </Pressable>
            <Text style={styles.startNote}>No account required. All progress stored locally.</Text>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 24, paddingTop: 60 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoText: { color: C.primary, fontSize: 48, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 8 },
  logoSub: { color: C.secondary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 4, marginBottom: 8 },
  logoTagline: { color: C.muted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  terminal: { backgroundColor: '#0D1117', borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  terminalHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', padding: 10, gap: 6 },
  terminalDot: { width: 10, height: 10, borderRadius: 5 },
  terminalTitle: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginLeft: 8 },
  terminalBody: { padding: 16, minHeight: 200 },
  bootLine: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 22 },
  descSection: { marginBottom: 24 },
  descTitle: { color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  descText: { color: C.muted, fontSize: 14, lineHeight: 22 },
  highlight: { color: C.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  stat: { alignItems: 'center' },
  statNum: { color: C.primary, fontSize: 24, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statLabel: { color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.5, marginTop: 4 },
  startBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  startBtnText: { color: C.bg, fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  startNote: { color: C.muted, fontSize: 12, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
