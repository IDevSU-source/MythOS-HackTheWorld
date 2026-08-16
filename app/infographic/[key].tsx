import React from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { getInfographicAsset } from '@/lib/infographics';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = { bg: '#0A0E1A', surface: '#111827', primary: '#00FF88', text: '#E2E8F0', muted: '#8B9BB4', border: '#26334B' };
const titleFor = (key: string) => key.replace(/^TPS_IMG_/, '').replace(/\.[^.]+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');

export default function InfographicScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const fileName = decodeURIComponent(key || '');
  const image = getInfographicAsset(fileName);
  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><IconSymbol name="arrow.left" size={20} color={C.text} /></Pressable><Text style={styles.headerTitle}>VISUAL ARCHIVE</Text></View>
      <ScrollView contentContainerStyle={styles.content} style={styles.scroll} maximumZoomScale={3} minimumZoomScale={1}>
        {image ? <Image source={image} style={styles.image} resizeMode="contain" accessibilityLabel={titleFor(fileName)} /> : <View style={styles.missing}><Text style={styles.missingTitle}>VISUAL NOT FOUND</Text><Text style={styles.missingCopy}>{fileName}</Text></View>}
        <Text style={styles.title}>{titleFor(fileName)}</Text>
        <Text style={styles.caption}>Bundled from the upstream HackTheWorldTPS visual archive. Pinch to zoom for detailed reading.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }, back: { padding: 5, marginRight: 10 }, headerTitle: { color: C.primary, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 0.8 }, scroll: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, alignItems: 'center' }, image: { width: '100%', height: 500, borderRadius: 10, backgroundColor: '#080D17' }, title: { alignSelf: 'stretch', color: C.text, fontSize: 20, lineHeight: 27, fontWeight: '700', marginTop: 18 }, caption: { alignSelf: 'stretch', color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 8 }, missing: { width: '100%', padding: 30, borderRadius: 10, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, missingTitle: { color: C.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', marginBottom: 8 }, missingCopy: { color: C.muted, textAlign: 'center' },
});
