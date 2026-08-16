import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { DEVLOGS, type Devlog } from '@/lib/tps-data';
import { useProgress } from '@/lib/progress-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = { bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236', primary: '#00FF88', secondary: '#00D4FF', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B' };

function preview(content: string) {
  return content.replace(/^#{1,3}\s+.+$/gm, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 145);
}

export default function LogsScreen() {
  const router = useRouter();
  const { progress } = useProgress();
  const readCount = DEVLOGS.filter((entry) => progress.completedDevlogs.includes(entry.id)).length;

  const renderLog = ({ item }: { item: Devlog }) => {
    const isRead = progress.completedDevlogs.includes(item.id);
    return (
      <Pressable
        onPress={() => router.push(`/devlog/${item.id}` as any)}
        style={({ pressed }) => [styles.card, isRead && styles.cardRead, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.logNumber}>LOG {String(item.order).padStart(3, '0')}</Text>
          {isRead ? <IconSymbol name="checkmark.circle.fill" size={18} color={C.primary} /> : <Text style={styles.xp}>+{item.xpReward} XP</Text>}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.preview} numberOfLines={3}>{preview(item.content)}</Text>
        <Text style={styles.source}>{item.sourcePath}</Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>&gt;_ UPSTREAM SIGNAL ARCHIVE</Text>
        <Text style={styles.headerSub}>{readCount}/{DEVLOGS.length} DEVLOGS RECORDED</Text>
      </View>
      <FlatList
        data={DEVLOGS}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.intro}>Complete upstream field notes, releases, research detours, and author dispatches.</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }, headerTitle: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 }, headerSub: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
  content: { padding: 16, gap: 10 }, intro: { color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  card: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 15 }, cardRead: { borderColor: `${C.primary}55` }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, logNumber: { color: C.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 0.8 }, xp: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700' },
  title: { color: C.text, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 6 }, preview: { color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 9 }, source: { color: '#60718D', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 },
});
