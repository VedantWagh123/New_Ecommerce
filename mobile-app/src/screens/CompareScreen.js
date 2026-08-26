import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopContext } from '../context/ShopContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function CompareScreen({ navigation }) {
  const { compareList, removeFromCompare, currency, clearCompare } = useContext(ShopContext);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare ({compareList.length}/4)</Text>
        {compareList.length > 0 ? (
          <TouchableOpacity onPress={clearCompare}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      {compareList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚖️</Text>
          <Text style={styles.emptyTitle}>Nothing to compare</Text>
          <Text style={styles.emptySub}>Add up to 4 products to compare them side by side.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Collection')}>
            <Text style={styles.shopBtnText}>BROWSE PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {compareList.map((item) => (
            <View key={item._id} style={styles.compareCard}>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCompare(item._id)}>
                <Text style={styles.removeBtnText}>✕ Remove</Text>
              </TouchableOpacity>
              
              <Image source={{ uri: item.image?.[0] }} style={styles.image} resizeMode="contain" />
              <View style={styles.basicInfo}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>{currency}{item.price}</Text>
              </View>

              <View style={styles.specsContainer}>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Category</Text>
                  <Text style={styles.specValue}>{item.category}</Text>
                </View>

                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Type</Text>
                  <Text style={styles.specValue}>{item.subCategory}</Text>
                </View>

                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Available Sizes</Text>
                  <Text style={styles.specValue}>{item.sizes?.join(', ')}</Text>
                </View>
                
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Rating</Text>
                  <Text style={styles.specValue}>⭐ 4.8 / 5</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewBtn}
                onPress={() => navigation.navigate('Product', { productId: item._id })}
              >
                <Text style={styles.viewBtnText}>VIEW PRODUCT →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#111', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  clearText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#fff' },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
  emptySub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  shopBtn: { backgroundColor: '#111', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },

  scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
  compareCard: { 
    width: width * 0.85, backgroundColor: '#fff', borderRadius: 16, padding: 16, 
    borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    justifyContent: 'space-between', marginRight: 16
  },
  removeBtn: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fef2f2', borderRadius: 20 },
  removeBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  
  image: { width: '100%', height: 200, marginTop: 10, marginBottom: 16 },
  basicInfo: { alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 14, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  price: { fontSize: 22, fontWeight: '900', color: '#111' },

  specsContainer: { gap: 10, marginBottom: 20, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  specBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8 },
  specLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  specValue: { fontSize: 12, color: '#111', fontWeight: '800', textAlign: 'right', flex: 1 },

  viewBtn: { backgroundColor: '#111', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 'auto' },
  viewBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
