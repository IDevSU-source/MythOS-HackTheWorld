import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { DEVLOGS } from '@/lib/tps-data';
import { parseMarkdownToSections } from '@/lib/content-parser';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

export default function DevlogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress, completeDevlogAction } = useProgress();

  const devlog = DEVLOGS.find(d => d.id === id);
  const isRead = progress.completedDevlogs.includes(id ?? '');

  useEffect(() => {
    // Auto-mark as read after 3 seconds
    if (devlog && !isRead) {
      const timer = setTimeout(() => {
        completeDevlogAction(devlog.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [devlog, isRead]);

  if (!devlog) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorText}>Log not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← BACK</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const sections = parseMarkdownToSections(devlog.content);

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={20} color={C.text} />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={styles.navLabel}>SYSTEM LOGS</Text>
          <Text style={styles.navSub}>LOG_{String(DEVLOGS.indexOf(devlog) + 1).padStart(3, '0')}</Text>
        </View>
        {isRead && <IconSymbol name="checkmark.circle.fill" size={20} color={C.primary} />}
        {!isRead && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+{devlog.xpReward} XP</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Log Header */}
        <View style={styles.logHeader}>
          <View style={styles.logMeta}>
            <Text style={styles.logStatus}>SIGNAL</Text>
            <Text style={styles.logDate}>{devlog.date}</Text>
          </View>
          <Text style={styles.logMood}></Text>
          <Text style={styles.logTitle}>{devlog.title}</Text>
          <Text style={styles.logSummary}>{devlog.content.substring(0, 120)}...</Text>
        </View>

        <View style={styles.divider} />

        {/* Content */}
        {sections.map((section, idx) => {
          switch (section.type) {
            case 'heading':
              return <Text key={idx} style={styles.heading}>{section.content}</Text>;
            case 'subheading':
              return <Text key={idx} style={styles.subheading}>{section.content}</Text>;
            case 'body':
              return <Text key={idx} style={styles.body}>{section.content}</Text>;
            case 'quote':
              return (
                <View key={idx} style={styles.quoteBlock}>
                  <Text style={styles.quoteText}>"{section.content}"</Text>
                </View>
              );
            case 'code':
              return (
                <View key={idx} style={styles.codeBlock}>
                  <Text style={styles.codeText}>{section.content}</Text>
                </View>
              );
            case 'list':
              return (
                <View key={idx} style={styles.listBlock}>
                  {(section.items ?? []).map((item: string, j: number) => (
                    <View key={j} style={styles.listItem}>
                      <Text style={styles.listBullet}>▸</Text>
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            default:
              return null;
          }
        })}

        {!isRead && (
          <View style={styles.readingBanner}>
            <Text style={styles.readingText}>Reading... +{devlog.xpReward} XP will be awarded</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backButton: { padding: 4, marginRight: 12 },
  navCenter: { flex: 1 },
  navLabel: { color: C.primary, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  navSub: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: C.primary + '44' },
  xpBadgeText: { color: C.primary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 20 },
  logHeader: { marginBottom: 20 },
  logMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logStatus: { color: C.primary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logDate: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logMood: { fontSize: 28, marginBottom: 8 },
  logTitle: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 8, lineHeight: 28 },
  logSummary: { color: C.muted, fontSize: 14, lineHeight: 21 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 20 },
  heading: { color: C.secondary, fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  subheading: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  body: { color: C.text, fontSize: 15, lineHeight: 24, marginBottom: 12 },
  quoteBlock: { borderLeftWidth: 3, borderLeftColor: C.secondary, paddingLeft: 16, marginVertical: 14, backgroundColor: C.surface2, padding: 14, borderRadius: 8 },
  quoteText: { color: C.secondary, fontSize: 14, fontStyle: 'italic', lineHeight: 21 },
  codeBlock: { backgroundColor: C.surface2, borderRadius: 8, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: C.border },
  codeText: { color: C.primary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 18 },
  listBlock: { marginVertical: 10, gap: 8 },
  listItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  listBullet: { color: C.primary, fontSize: 14, marginTop: 4 },
  listText: { color: C.text, fontSize: 14, lineHeight: 21, flex: 1 },
  readingBanner: { backgroundColor: C.surface2, borderRadius: 10, padding: 14, marginTop: 20, borderWidth: 1, borderColor: C.primary + '33', alignItems: 'center' },
  readingText: { color: C.primary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: C.muted, fontSize: 16, marginBottom: 16 },
  backBtn: { padding: 12 },
  backBtnText: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
