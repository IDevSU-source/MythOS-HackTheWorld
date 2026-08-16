import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { DEVLOGS } from '@/lib/tps-data';
import { useProgress } from '@/lib/progress-context';
import { parseMarkdownToSections, type ContentSection } from '@/lib/content-parser';
import { getInfographicAsset } from '@/lib/infographics';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = { bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236', primary: '#00FF88', secondary: '#00D4FF', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B' };

function Section({ section }: { section: ContentSection }) {
  if (section.type === 'heading') return <Text style={styles.heading}>{section.content}</Text>;
  if (section.type === 'subheading') return <Text style={styles.subheading}>{section.content}</Text>;
  if (section.type === 'body') return <Text style={styles.body}>{section.content}</Text>;
  if (section.type === 'quote') return <View style={styles.quote}><Text style={styles.quoteText}>{section.content}</Text></View>;
  if (section.type === 'code') return <View style={styles.code}><Text style={styles.codeText}>{section.content}</Text></View>;
  if (section.type === 'list') return <View style={styles.list}>{section.items.map((item, index) => <Text key={`${item}-${index}`} style={styles.item}>▸ {item}</Text>)}</View>;
  if (section.type === 'table') return <View style={styles.table}>{section.rows.map((row, index) => <Text key={`table-${index}`} style={styles.tableText}>{row.join('  •  ')}</Text>)}</View>;
  if (section.type === 'image') {
    const asset = getInfographicAsset(section.assetName);
    return asset ? <View style={styles.assetRef}><Image source={asset} style={styles.assetImage} resizeMode="contain" accessibilityLabel={section.alt || section.assetName} /><Text style={styles.assetLabel}>{section.alt || section.assetName}</Text></View> : <View style={styles.assetRef}><Text style={styles.assetLabel}>SOURCE VISUAL · {section.alt || section.assetName}</Text></View>;
  }
  return null;
}

export default function DevlogReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress, completeDevlogAction } = useProgress();
  const [recorded, setRecorded] = useState(false);
  const devlog = DEVLOGS.find((entry) => entry.id === id);
  const position = devlog ? DEVLOGS.indexOf(devlog) + 1 : 0;
  const sections = useMemo(() => devlog ? parseMarkdownToSections(devlog.content) : [], [devlog]);
  const isRead = Boolean(id && progress.completedDevlogs.includes(id));

  if (!devlog) return <ScreenContainer><View style={styles.center}><Text style={styles.body}>Devlog not found.</Text></View></ScreenContainer>;

  const markRead = async () => {
    if (isRead) { router.back(); return; }
    if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeDevlogAction(devlog.id);
    setRecorded(true);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back}><IconSymbol name="arrow.left" size={20} color={C.text} /></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.navTitle}>UPSTREAM DEVLOG</Text><Text style={styles.navSub}>LOG {String(position).padStart(3, '0')} OF {DEVLOGS.length}</Text></View>
        <View style={styles.xpChip}><Text style={styles.xpText}>+{devlog.xpReward} XP</Text></View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>{devlog.title}</Text>
          <Text style={styles.source}>SOURCE: {devlog.sourcePath}</Text>
        </View>
        {sections.map((section, index) => <Section key={`${section.type}-${index}`} section={section} />)}
        <Pressable onPress={markRead} style={({ pressed }) => [styles.complete, pressed && { opacity: 0.82 }, isRead && styles.completeRead]}>
          <Text style={[styles.completeText, isRead && { color: C.muted }]}>{isRead ? '✓ DEVLOG RECORDED' : 'MARK DEVLOG READ & EARN XP'}</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={recorded} transparent animationType="fade" onRequestClose={() => setRecorded(false)}>
        <View style={styles.overlay}><View style={styles.modal}><Text style={styles.modalIcon}>📡</Text><Text style={styles.modalTitle}>SIGNAL ARCHIVED</Text><Text style={styles.modalCopy}>+{devlog.xpReward} XP added to your profile.</Text><Pressable style={styles.modalButton} onPress={() => { setRecorded(false); router.back(); }}><Text style={styles.modalButtonText}>RETURN TO LOGS</Text></Pressable></View></View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }, back: { padding: 5, marginRight: 10 }, navTitle: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1 }, navSub: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, marginTop: 2 }, xpChip: { borderWidth: 1, borderColor: `${C.primary}66`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, xpText: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: C.bg }, content: { padding: 20, paddingBottom: 44 }, hero: { borderLeftWidth: 3, borderLeftColor: C.primary, paddingLeft: 15, marginBottom: 22 }, title: { color: C.text, fontSize: 24, fontWeight: '700', lineHeight: 31, marginBottom: 8 }, source: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10 },
  heading: { color: C.secondary, fontSize: 19, fontWeight: '700', marginTop: 22, marginBottom: 10, lineHeight: 26 }, subheading: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 7 }, body: { color: C.text, fontSize: 15, lineHeight: 24, marginBottom: 14 }, quote: { marginVertical: 10, padding: 14, borderRadius: 9, borderLeftColor: C.secondary, borderLeftWidth: 3, backgroundColor: C.surface2 }, quoteText: { color: C.secondary, fontSize: 15, fontStyle: 'italic', lineHeight: 22 }, code: { padding: 14, backgroundColor: '#080D17', borderRadius: 9, borderWidth: 1, borderColor: C.border, marginVertical: 10 }, codeText: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, lineHeight: 20 }, list: { gap: 7, marginVertical: 10 }, item: { color: C.text, fontSize: 14, lineHeight: 21 }, table: { padding: 12, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginVertical: 10 }, tableText: { color: C.text, fontSize: 13, lineHeight: 20, marginBottom: 8 }, assetRef: { marginVertical: 10, padding: 10, borderRadius: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, assetImage: { width: '100%', height: 240, borderRadius: 7, backgroundColor: '#080D17' }, assetLabel: { color: C.secondary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 7 },
  complete: { backgroundColor: C.primary, alignItems: 'center', borderRadius: 12, padding: 16, marginTop: 20 }, completeRead: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border }, completeText: { color: C.bg, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modal: { width: '100%', maxWidth: 320, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.primary, padding: 26, alignItems: 'center' }, modalIcon: { fontSize: 40, marginBottom: 10 }, modalTitle: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 }, modalCopy: { color: C.text, textAlign: 'center', marginVertical: 14, fontSize: 14 }, modalButton: { backgroundColor: C.primary, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 12 }, modalButtonText: { color: C.bg, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
});
