import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Platform, Modal } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useProgress } from '@/lib/progress-context';
import { LEXICON, LexiconEntry } from '@/lib/tps-data';
import { IconSymbol } from '@/components/ui/icon-symbol';

const C = {
  bg: '#0A0E1A', surface: '#111827', surface2: '#1A2236',
  primary: '#00FF88', secondary: '#00D4FF', accent: '#FF6B35',
  text: '#E2E8F0', muted: '#64748B', border: '#1E293B',
};

const CATEGORIES = ['All', 'Core System', 'Three Signatures', 'Physics Engine', 'Render Engine', 'Virus', 'Execution Protocols', 'Toolkit', 'Quad-Core Kernel', 'System Roadmap', 'Warnings'];

const CATEGORY_COLORS: Record<string, string> = {
  'Core System': '#00FF88',
  'Three Signatures': '#00D4FF',
  'Physics Engine': '#FBBF24',
  'Render Engine': '#A78BFA',
  'Virus': '#F87171',
  'Execution Protocols': '#00FF88',
  'Toolkit': '#00D4FF',
  'Quad-Core Kernel': '#FF6B35',
  'System Roadmap': '#FBBF24',
  'Warnings': '#F87171',
};

function EntryModal({ entry, onClose }: { entry: LexiconEntry; onClose: () => void }) {
  const color = CATEGORY_COLORS[entry.category] ?? C.primary;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <Text style={[styles.categoryText, { color }]}>{entry.category}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={C.muted} />
            </Pressable>
          </View>
          <Text style={[styles.modalTpsTerm, { color }]}>{entry.tpsTerm}</Text>
          {entry.paliTerm && (
            <Text style={styles.modalPali}>Legacy Code: {entry.legacyCode}</Text>
          )}
          <View style={styles.modalDivider} />
          <Text style={styles.modalDefinition}>{entry.definition}</Text>
          {entry.paliTerm && (
            <View style={styles.paliBox}>
              <Text style={styles.paliLabel}>PALI TERM</Text>
              <Text style={styles.paliValue}>{entry.paliTerm}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function LexiconScreen() {
  const { progress, viewLexiconAction } = useProgress();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedEntry, setSelectedEntry] = useState<LexiconEntry | null>(null);

  const filtered = useMemo(() => {
    return LEXICON.filter(e => {
      const matchCat = category === 'All' || e.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || e.tpsTerm.toLowerCase().includes(q) || e.legacyCode.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const handleSelect = async (entry: LexiconEntry) => {
    setSelectedEntry(entry);
    await viewLexiconAction(entry.id);
  };

  const renderItem = ({ item }: { item: LexiconEntry }) => {
    const color = CATEGORY_COLORS[item.category] ?? C.primary;
    const isViewed = progress.viewedLexicon.includes(item.id);
    return (
      <Pressable
        style={({ pressed }) => [styles.entryCard, pressed && { opacity: 0.8 }]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.entryHeader}>
          <Text style={[styles.entryTerm, { color }]}>{item.tpsTerm}</Text>
          {isViewed && <IconSymbol name="checkmark.circle.fill" size={14} color={C.muted} />}
        </View>
        <Text style={styles.entryLegacy}>{item.legacyCode}</Text>
        <Text style={styles.entryDef} numberOfLines={2}>{item.definition}</Text>
        <View style={[styles.entryCategory, { backgroundColor: color + '15', borderColor: color + '33' }]}>
          <Text style={[styles.entryCategoryText, { color }]}>{item.category}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>&gt;_ MASTER LEXICON</Text>
        <Text style={styles.headerSub}>{progress.viewedLexicon.length}/{LEXICON.length} ENTRIES ACCESSED</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <IconSymbol name="magnifyingglass" size={16} color={C.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search terms..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <IconSymbol name="xmark" size={16} color={C.muted} />
          </Pressable>
        )}
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, item === category && styles.filterChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.filterChipText, item === category && styles.filterChipTextActive]}>
              {item}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No entries found</Text>
          </View>
        }
      />

      {selectedEntry && (
        <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { color: C.primary, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  headerSub: { color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchInput: { flex: 1, color: C.text, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  filterList: { maxHeight: 44, marginBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.primary + '22', borderColor: C.primary },
  filterChipText: { color: C.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  filterChipTextActive: { color: C.primary, fontWeight: '700' },
  entryCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  entryTerm: { fontSize: 15, fontWeight: '700', flex: 1 },
  entryLegacy: { color: C.muted, fontSize: 12, marginBottom: 6, fontStyle: 'italic' },
  entryDef: { color: C.text, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  entryCategory: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  entryCategoryText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  categoryText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  closeBtn: { padding: 4 },
  modalTpsTerm: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  modalPali: { color: C.muted, fontSize: 13, fontStyle: 'italic', marginBottom: 12 },
  modalDivider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
  modalDefinition: { color: C.text, fontSize: 14, lineHeight: 22 },
  paliBox: { marginTop: 16, backgroundColor: C.surface2, borderRadius: 8, padding: 12 },
  paliLabel: { color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1, marginBottom: 4 },
  paliValue: { color: C.secondary, fontSize: 16, fontStyle: 'italic' },
});
