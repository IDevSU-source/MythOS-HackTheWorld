import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { INFOGRAPHICS } from '@/lib/infographics';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = { bg: '#0A0E1A', surface: '#111827', primary: '#00FF88', secondary: '#00D4FF', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B' };
const titleFor = (key: string) => key.replace(/^TPS_IMG_/, '').replace(/\.[^.]+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');

export default function VisualArchiveScreen() {
  const router = useRouter();
  const visuals = useMemo(() => Object.entries(INFOGRAPHICS).map(([key, source]) => ({ key, source, title: titleFor(key) })), []);
  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><IconSymbol name="arrow.left" size={20} color={C.text} /></Pressable><View><Text style={styles.headerTitle}>VISUAL ARCHIVE</Text><Text style={styles.headerSub}>{visuals.length} UPSTREAM INFOGRAPHICS</Text></View></View>
      <FlatList
        data={visuals}
        numColumns={2}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <Pressable onPress={() => router.push(`/infographic/${encodeURIComponent(item.key)}` as any)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}><Image source={item.source} style={styles.image} resizeMode="cover" accessibilityLabel={item.title} /><Text style={styles.title} numberOfLines={2}>{item.title}</Text></Pressable>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }, back: { padding: 5, marginRight: 10 }, headerTitle: { color: C.primary, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 0.8 }, headerSub: { color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 3 }, content: { padding: 14, gap: 12 }, row: { gap: 12 }, card: { flex: 1, maxWidth: '48%', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }, image: { width: '100%', aspectRatio: 1.1, backgroundColor: '#080D17' }, title: { color: C.text, fontSize: 12, lineHeight: 17, fontWeight: '600', padding: 10 },
});
