import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ScrollView, Dimensions, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopContext } from '../context/ShopContext';

const { width } = Dimensions.get('window');
const CARD_W = (width - 40) / 2;
const TRENDING_W = width * 0.4;
const FLASH_W = width * 0.45;

const CATEGORIES = [
  { name: 'Men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&q=80' },
  { name: 'Women', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80' },
  { name: 'Kids', image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=500&q=80' },
  { name: 'Winterwear', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80' },
];

export default function HomeScreen({ navigation }) {
  const { products, getCartCount, currency, backendUrl } = useContext(ShopContext);
  const [search, setSearch] = useState('');
  
  // Data State
  const [stories, setStories] = useState([]);
  const [flashConfig, setFlashConfig] = useState(null);

  // Flash Deal Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    // Fetch Stories
    const fetchStories = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/story/list`);
        if (res.data.success) setStories(res.data.stories);
      } catch (e) { console.error('Error fetching stories:', e); }
    };
    fetchStories();

    // Fetch Flash Sale
    const fetchFlashSale = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/flash-sale/active`);
        if (res.data.success && res.data.flashSale) {
          const fs = res.data.flashSale;
          setFlashConfig(fs);
          if (fs.endTime) {
            const diff = Math.max(0, Math.floor((new Date(fs.endTime).getTime() - Date.now()) / 1000));
            const hrs = Math.floor(diff / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const secs = diff % 60;
            setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
          }
        }
      } catch (e) { console.error('Error fetching flash sale:', e); }
    };
    fetchFlashSale();
  }, [backendUrl]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filtered = search ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : [];
  
  const latest = products.slice(0, 10);
  const bestSellers = products.filter(p => p.bestseller);

  // Admin Flash Deals
  const flashDeals = flashConfig?.selectedProducts?.map(sp => {
    const prodObj = products.find(p => p._id === (sp.productId?._id || sp.productId));
    if (!prodObj) return null;
    return { ...prodObj, flashPrice: Math.round(prodObj.price * (1 - (sp.discountPercent || 35)/100)) };
  }).filter(Boolean) || [];

  const renderProduct = ({ item, customWidth }) => (
    <TouchableOpacity
      style={[styles.card, customWidth && { width: customWidth }]}
      onPress={() => navigation.navigate('Product', { productId: item._id })}
      activeOpacity={0.88}
    >
      <Image source={{ uri: item.image?.[0] }} style={styles.cardImage} />
      {item.bestseller && (
        <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>TRENDING</Text></View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>{currency}{item.flashPrice || item.price}</Text>
          <Text style={styles.cardMrp}>{currency}{Math.round(item.price * 1.33)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}><Text style={styles.brandIconText}>F</Text></View>
          <Text style={styles.brandName}>FOREVER</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartEmoji}>🛍</Text>
          {getCartCount() > 0 && (
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{getCartCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
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

        {search ? (
          <>
            <Text style={styles.sectionTitle}>Results ({filtered.length})</Text>
            <FlatList
              data={filtered}
              keyExtractor={i => i._id}
              renderItem={(props) => renderProduct({ ...props, customWidth: CARD_W })}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            />
          </>
        ) : (
          <>
            {/* Stories */}
            {stories.length > 0 && (
              <View style={styles.storiesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                  {stories.map(story => (
                    <TouchableOpacity 
                      key={story._id} 
                      style={styles.storyCard}
                      onPress={() => navigation.navigate('StoryScreen', { story })}
                    >
                      <View style={styles.storyRing}>
                        <Image source={{ uri: story.image.replace('http://', 'https://') }} style={styles.storyImage} />
                      </View>
                      <Text style={styles.storyText} numberOfLines={1}>{story.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Hero Section with Image */}
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => navigation.navigate('Collection')}
              style={styles.heroContainer}
            >
              <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80' }} 
                style={styles.heroBg}
                imageStyle={{ borderRadius: 16 }}
              >
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroLabel}>LATEST TRENDS</Text>
                  <Text style={styles.heroTitle}>Spring Collection 2024</Text>
                  <Text style={styles.heroSub}>Discover the freshest trends today</Text>
                  <View style={styles.heroBtn}>
                    <Text style={styles.heroBtnText}>SHOP NOW →</Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Categories */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Collection')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat.name} 
                  style={styles.catCard}
                  onPress={() => navigation.navigate('Collection', { category: cat.name })}
                >
                  <Image source={{ uri: cat.image }} style={styles.catImage} />
                  <View style={styles.catOverlay}>
                    <Text style={styles.catName}>{cat.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Flash Deals from Admin */}
            {flashConfig && flashConfig.isActive && flashDeals.length > 0 && (
              <View style={styles.flashSection}>
                <View style={styles.flashHeader}>
                  <View style={styles.flashTitleRow}>
                    <Text style={styles.flashTitle}>⚡ {flashConfig.title || 'Flash Deals'}</Text>
                    <View style={styles.timerBox}>
                      <Text style={styles.timerText}>
                        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Collection')}>
                    <Text style={styles.seeAll}>See all →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollGrid}>
                  {flashDeals.map(item => (
                    <View key={item._id} style={{ position: 'relative' }}>
                      {renderProduct({ item, customWidth: FLASH_W })}
                      <View style={styles.flashBadge}>
                        <Text style={styles.flashBadgeText}>FLASH</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Latest Collection */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Latest Arrivals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Collection')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={latest}
              keyExtractor={i => i._id}
              renderItem={(props) => renderProduct({ ...props, customWidth: CARD_W })}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            />

            {/* Best Sellers */}
            {bestSellers.length > 0 && (
              <View style={styles.bestSellerSection}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>🏆 Best Sellers</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Collection')}>
                    <Text style={styles.seeAll}>See all →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollGrid}>
                  {bestSellers.map(item => renderProduct({ item, customWidth: TRENDING_W }))}
                </ScrollView>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerBrandRow}>
                <Text style={styles.footerBrand}>FOREVER</Text>
                <Text style={styles.footerBrandDot}>.</Text>
              </View>
              <Text style={styles.footerDesc}>
                Premium quality clothing and accessories. We deliver the best fashion right to your doorstep, bringing elegance to your everyday style.
              </Text>
              <View style={styles.footerLinks}>
                <Text style={styles.footerLink}>Home</Text>
                <Text style={styles.footerLink}>About</Text>
                <Text style={styles.footerLink}>Delivery</Text>
                <Text style={styles.footerLink}>Privacy</Text>
                <Text style={styles.footerLink}>Terms</Text>
              </View>
              <View style={styles.footerDivider} />
              <Text style={styles.footerCopyright}>© {new Date().getFullYear()} Forever. All rights reserved.</Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  brandIconText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  brandName: { fontSize: 18, fontWeight: '900', color: '#111', letterSpacing: 4 },
  cartBtn: { position: 'relative', padding: 4 },
  cartEmoji: { fontSize: 24 },
  cartCount: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444',
    borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  cartCountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    marginHorizontal: 14, marginTop: 12, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  clearBtn: { fontSize: 14, color: '#9ca3af', fontWeight: '700' },
  
  heroContainer: { margin: 14, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  heroBg: { width: '100%', height: 200, justifyContent: 'flex-end' },
  heroOverlay: { padding: 20, backgroundColor: 'rgba(0,0,0,0.3)', flex: 1, justifyContent: 'flex-end' },
  heroLabel: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', lineHeight: 32, marginTop: 4 },
  heroSub: { fontSize: 13, color: '#f3f4f6', marginTop: 4, marginBottom: 12 },
  heroBtn: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, alignSelf: 'flex-start' },
  heroBtnText: { color: '#111', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  seeAll: { fontSize: 12, color: '#6b7280', fontWeight: '700', textDecorationLine: 'underline' },
  
  categoryScroll: { paddingHorizontal: 14, gap: 12, paddingBottom: 10 },
  storiesContainer: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  storiesScroll: { paddingHorizontal: 16, gap: 16 },
  storyCard: { alignItems: 'center', gap: 6 },
  storyRing: { 
    width: 68, height: 68, borderRadius: 34, padding: 3,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#f43f5e',
    justifyContent: 'center', alignItems: 'center'
  },
  storyImage: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#f9fafb' },
  storyText: { fontSize: 11, fontWeight: '600', color: '#111', width: 68, textAlign: 'center' },

  catCard: { width: 100, height: 120, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  catImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  catOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, alignItems: 'center' },
  catName: { color: '#fff', fontSize: 12, fontWeight: '800' },
  
  flashSection: { backgroundColor: '#fff1f2', paddingVertical: 20, marginTop: 10 },
  flashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12 },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flashTitle: { fontSize: 16, fontWeight: '800', color: '#be123c' },
  timerBox: { backgroundColor: '#be123c', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  timerText: { color: '#fff', fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  flashBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  flashBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  scrollGrid: { paddingHorizontal: 14, gap: 12, paddingBottom: 10 },
  grid: { paddingHorizontal: 14 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardImage: { width: '100%', aspectRatio: 0.8, resizeMode: 'cover' },
  bestBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#111', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  bestSellerSection: { marginTop: 8 },
  footer: { 
    marginTop: 30, paddingVertical: 40, paddingHorizontal: 24, backgroundColor: '#f9fafb', alignItems: 'center', 
    borderTopWidth: 1, borderTopColor: '#e5e7eb' 
  },
  footerBrandRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  footerBrand: { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: 6 },
  footerBrandDot: { fontSize: 32, fontWeight: '900', color: '#f43f5e', marginLeft: 2 },
  footerDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: '90%' },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginBottom: 24 },
  footerLink: { fontSize: 13, fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1 },
  footerDivider: { width: 40, height: 2, backgroundColor: '#d1d5db', marginBottom: 24, borderRadius: 2 },
  footerCopyright: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  
  cardBody: { padding: 10, gap: 4 },
  cardName: { fontSize: 12, color: '#374151', fontWeight: '600', lineHeight: 16 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#111' },
  cardMrp: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
});
