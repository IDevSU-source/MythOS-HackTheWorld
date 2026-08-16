import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useProgress } from '@/lib/progress-context';
import { CHAPTERS, DEVLOGS, LEXICON } from '@/lib/tps-data';

const C = { bg: '#0A0E1A', surface: '#111827', primary: '#00FF88', secondary: '#00D4FF', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B', warning: '#FBBF24' };
const BOOT_LINES = [
  { text: '> MYTHOS BOOT SEQUENCE INITIATED…', delay: 0 },
  { text: '> PROTOCOL: HACK_THE_WORLD_v1.0', delay: 350 },
  { text: '> LOADING COMPLETE SOURCE ARCHIVE…', delay: 700 },
  { text: '> ROOT_ACCESS: LOCKED — STUDY REQUIRED', delay: 1050 },
  { text: '> SCANNING FOR SELF_PROCESS…', delay: 1400 },
  { text: '> DIAGNOSTIC SUITE READY', delay: 1750 },
  { text: '> PRESS BEGIN TO EXPLORE THE SOURCE', delay: 2100 },
];

function BootLine({ text, delay }: { text: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  useEffect(() => { const timer = setTimeout(() => { setVisible(true); Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }, delay); return () => clearTimeout(timer); }, [delay, opacity]);
  if (!visible) return null;
  return <Animated.Text style={[styles.bootLine, text.includes('LOCKED') && { color: C.warning }, text.includes('READY') && { color: C.primary }, { opacity }]}>{text}</Animated.Text>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboardedAction } = useProgress();
  const [ready, setReady] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => { const timer = setTimeout(() => { setReady(true); Animated.timing(buttonOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start(); }, 2450); return () => clearTimeout(timer); }, [buttonOpacity]);
  const start = async () => { if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await setOnboardedAction(); router.replace('/(tabs)' as any); };

  return <View style={styles.container}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.logo}><Text style={styles.logoMark}>MYTHOS</Text><Text style={styles.logoSub}>HACK THE WORLD</Text><Text style={styles.tagline}>A technical reader for the biological operating system</Text></View>
    <View style={styles.terminal}><View style={styles.terminalTop}><View style={[styles.dot, { backgroundColor: '#F87171' }]} /><View style={[styles.dot, { backgroundColor: C.warning }]} /><View style={[styles.dot, { backgroundColor: C.primary }]} /><Text style={styles.terminalName}>mythos_boot.sh</Text></View><View style={styles.terminalBody}>{BOOT_LINES.map((line) => <BootLine key={line.text} {...line} />)}</View></View>
    <View style={styles.copy}><Text style={styles.copyTitle}>The source is the curriculum.</Text><Text style={styles.copyText}>MythOS is not a promise of instant access. It is a guided way to explore the full <Text style={styles.highlight}>HackTheWorldTPS</Text> source archive: core protocol, Personal Codex, research, visual material, and devlogs.</Text></View>
    <View style={styles.stats}><View style={styles.stat}><Text style={styles.statNumber}>{CHAPTERS.length}</Text><Text style={styles.statLabel}>MODULES</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{DEVLOGS.length}</Text><Text style={styles.statLabel}>DEVLOGS</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{LEXICON.length}</Text><Text style={styles.statLabel}>TERMS</Text></View></View>
    {ready && <Animated.View style={{ opacity: buttonOpacity }}><Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.82 }]} onPress={start}><Text style={styles.buttonText}>BEGIN EXPLORATION</Text></Pressable><Text style={styles.note}>Root Access remains locked until the complete required source map is read. Progress is stored locally.</Text></Animated.View>}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 24, paddingTop: 58, paddingBottom: 42 }, logo: { alignItems: 'center', marginBottom: 30 }, logoMark: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 39, fontWeight: '700', letterSpacing: 7 }, logoSub: { color: C.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 4, marginTop: 5 }, tagline: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 9, fontStyle: 'italic' },
  terminal: { backgroundColor: '#080D17', borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }, terminalTop: { backgroundColor: '#151C2B', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 }, dot: { width: 10, height: 10, borderRadius: 5 }, terminalName: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, marginLeft: 6 }, terminalBody: { minHeight: 175, padding: 15 }, bootLine: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, lineHeight: 22 },
  copy: { marginBottom: 22 }, copyTitle: { color: C.text, fontSize: 21, fontWeight: '700', marginBottom: 10 }, copyText: { color: C.muted, fontSize: 14, lineHeight: 22 }, highlight: { color: C.primary, fontWeight: '700' }, stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 24 }, stat: { alignItems: 'center' }, statNumber: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 23, fontWeight: '700' }, statLabel: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 9, letterSpacing: 0.6, marginTop: 4 }, button: { backgroundColor: C.primary, borderRadius: 13, alignItems: 'center', padding: 17, marginBottom: 12 }, buttonText: { color: C.bg, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: '700', letterSpacing: 0.7 }, note: { color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
