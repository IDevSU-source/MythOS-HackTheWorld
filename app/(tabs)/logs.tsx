import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { DEVLOGS } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

export default function LogsScreen() {
  const router = useRouter();
  const { progress } = useProgress();

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>&gt;_ SYSTEM LOGS</Text>
        <Text style={styles.headerSub}>BUILD HISTORY | {progress.completedDevlogs.length}/4 READ</Text>
      </View>

      <View style={styles.terminalBanner}>
        <Text style={styles.terminalText}>
          {'> "We are building this manual in public. We want you to see the source code."'}
        </Text>
        <Text style={styles.terminalAuthor}>— ~C4Chaos</Text>
      </View>

      <FlatList
        data={DEVLOGS}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isRead = progress.completedDevlogs.includes(item.id);
          return (
            <Pressable
              style={({ pressed }) => [styles.logCard, pressed && { opacity: 0.8 }]}
              onPress={() => router.push(`/devlog/${item.id}` as any)}
            >
              <View style={styles.logHeader}>
                <View style={styles.logNumBadge}>
                  <Text style={styles.logNum}>LOG_{String((item as any).__idx || 1).padStart(3, '0')}</Text>
                </View>
                <Text style={styles.logStatus}>SIGNAL</Text>
                {isRead && <IconSymbol name="checkmark.circle.fill" size={16} color={C.primary} />}
              </View>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logMood}></Text>
              <Text style={styles.logSummary}>{item.content.substring(0, 80)}...</Text>
              <View style={styles.logFooter}>
                <Text style={styles.logDate}>{item.date}</Text>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>+{item.xpReward} XP</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { color: C.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  headerSub: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  terminalBanner: { margin: 16, marginBottom: 4, backgroundColor: C.surface2, borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: C.secondary },
  terminalText: { color: C.secondary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 18, marginBottom: 6 },
  terminalAuthor: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'right' },
  logCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  logNumBadge: { backgroundColor: C.surface2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  logNum: { color: C.primary, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  logStatus: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', flex: 1 },
  logTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  logMood: { fontSize: 18, marginBottom: 8 },
  logSummary: { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logDate: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  xpBadge: { backgroundColor: C.primary + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: C.primary + '44' },
  xpText: { color: C.primary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
});
