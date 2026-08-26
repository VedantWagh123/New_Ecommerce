import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopContext } from '../context/ShopContext';

const { width } = Dimensions.get('window');
const CARD_W = (width - 40) / 2;

const CATEGORIES = ['All', 'Men', 'Women', 'Kids'];
const SUB_CATS = ['All', 'Topwear', 'Bottomwear', 'Winterwear'];
const SORTS = ['Relevant', 'Price: Low to High', 'Price: High to Low'];

export default function CollectionScreen({ route, navigation }) {
  const { products, currency } = useContext(ShopContext);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState(route?.params?.category || 'All');
  const [sub, setSub] = useState('All');
  const [sort, setSort] = useState('Relevant');

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = cat === 'All' || p.category === cat;
      const matchSub = sub === 'All' || p.subCategory === sub;
      return matchSearch && matchCat && matchSub;
    })
    .sort((a, b) => {
      if (sort === 'Price: Low to High') return a.price - b.price;
      if (sort === 'Price: High to Low') return b.price - a.price;
      return 0;
    });

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Product', { productId: item._id })}
      activeOpacity={0.88}
    >
      <Image source={{ uri: item.image?.[0] }} style={styles.cardImage} />
      {item.bestseller && (
        <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>BEST</Text></View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{currency}{item.price}</Text>
          <Text style={styles.mrp}>{currency}{Math.round(item.price * 1.33)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collection</Text>
        <Text style={styles.resultCount}>{filtered.length} products</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: 20 }]}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ marginTop: 10, paddingHorizontal: 14 }}>
            {/* Search */}
            <View style={[styles.searchBar, { marginHorizontal: 0, marginTop: 0 }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.filtersContainer, { paddingHorizontal: 0 }]}>
              {/* Category */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, cat === c && styles.chipActive]} onPress={() => setCat(c)}>
                      <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sub Category */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>TYPE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {SUB_CATS.map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, sub === c && styles.chipActive]} onPress={() => setSub(c)}>
                      <Text style={[styles.chipText, sub === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sort */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>SORT BY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {SORTS.map(s => (
                    <TouchableOpacity key={s} style={[styles.chip, styles.sortChip, sort === s && styles.sortChipActive]} onPress={() => setSort(s)}>
                      <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>
                        {sort === s ? '✓ ' : ''}{s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginTop: 40 }}>🔍</Text>
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setCat('All'); setSub('All'); }}>
              <Text style={styles.clearFilters}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  resultCount: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', marginHorizontal: 14, marginTop: 10, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  clearBtn: { fontSize: 14, color: '#9ca3af' },
  filtersContainer: { paddingHorizontal: 14, gap: 12, marginBottom: 12 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 10, fontWeight: '800', color: '#9ca3af', letterSpacing: 1 },
  filterScroll: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  sortChip: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  sortChipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  grid: { paddingHorizontal: 14 },
  card: { width: CARD_W, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  bestBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#111', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  bestBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  cardBody: { padding: 10, gap: 4 },
  cardName: { fontSize: 12, color: '#374151', fontWeight: '600', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 14, fontWeight: '800', color: '#111' },
  mrp: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#111' },
  clearFilters: { color: '#111', fontWeight: '700', textDecorationLine: 'underline' },
});
