import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';

const INFOGRAPHICS: { key: string; title: string; description: string }[] = [
  { key: 'placeholder', title: 'Infographic', description: 'Coming soon' },
];

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

export default function InfographicScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();

  const infographic = INFOGRAPHICS.find(i => i.key === key);

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <View style={styles.topNav}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={20} color={C.text} />
        </Pressable>
        <Text style={styles.navLabel}>INFOGRAPHIC</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📊</Text>
          <Text style={styles.placeholderTitle}>{infographic?.title ?? key}</Text>
          <Text style={styles.placeholderDesc}>{infographic?.description}</Text>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>&gt; INFOGRAPHIC RENDERING...</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backButton: { padding: 4, marginRight: 12 },
  navLabel: { color: C.primary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1 },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 24, alignItems: 'center', justifyContent: 'center', flex: 1 },
  placeholder: { alignItems: 'center', padding: 32 },
  placeholderIcon: { fontSize: 48, marginBottom: 16 },
  placeholderTitle: { color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  placeholderDesc: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  comingSoon: { backgroundColor: C.surface2, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.primary + '33' },
  comingSoonText: { color: C.primary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
