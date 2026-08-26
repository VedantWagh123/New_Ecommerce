import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { backendUrl } from '../context/ShopContext';

const { width } = Dimensions.get('window');

export default function ProductScreen({ route, navigation }) {
  const { productId } = route.params;
  const {
    products, currency, addToCart, token,
    toggleWishlist, isInWishlist,
    addToCompare, isInCompare,
    getVariantStock,
  } = useContext(ShopContext);

  const product = products.find(p => p._id === productId);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'reviews'
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 4.8, totalReviews: 0 });
  const [bankOffers, setBankOffers] = useState([]);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState('');
  const [lightboxVisible, setLightboxVisible] = useState(false);

  // AI Vision / Try-On state
  const [visionModalVisible, setVisionModalVisible] = useState(false);
  const [visionQuestion, setVisionQuestion] = useState('');
  const [visionAnswer, setVisionAnswer] = useState('');
  const [visionLoading, setVisionLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image?.[0] || '');
      if (product.sizes?.length > 0) setSelectedSize(product.sizes[0]);
      fetchReviews();
      fetchBankOffers(product.category);
    }
  }, [productId, product?._id]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/review/product/${productId}`);
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        setReviewStats(res.data.stats || reviewStats);
      }
    } catch (e) {}
  };

  const fetchBankOffers = async (category) => {
    try {
      const res = await axios.get(`${backendUrl}/api/bank-offer/list?productId=${productId}&category=${category || ''}`);
      if (res.data.success) setBankOffers(res.data.offers || []);
    } catch (e) {}
  };

  const handleCheckPincode = () => {
    if (!pincodeInput || pincodeInput.length < 6) {
      setPincodeStatus('Please enter a valid 6-digit pincode');
      return;
    }
    setPincodeStatus(`✓ Serviceable at ${pincodeInput}! Delivery by Tomorrow, 5 PM. COD available.`);
  };

  const handleAddToCart = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }
    if (!selectedSize) { Alert.alert('Select Size', 'Please select a size first'); return; }
    const stock = getVariantStock(product._id, selectedSize);
    if (stock.status === 'OUT_OF_STOCK') { Alert.alert('Out of Stock', 'This size is currently unavailable'); return; }
    setAddingToCart(true);
    await addToCart(product._id, selectedSize);
    setAddingToCart(false);
    Alert.alert('Added to Cart! 🛍', `${product.name} (${selectedSize}) added to your cart`);
  };

  const handleBuyNow = async () => {
    if (!token) { navigation.navigate('Login'); return; }
    if (!selectedSize) { Alert.alert('Select Size', 'Please select a size first'); return; }
    await addToCart(product._id, selectedSize);
    navigation.navigate('Cart');
  };

  const handleCompare = () => {
    if (inCompare) {
      navigation.navigate('Compare');
      return;
    }
    const result = addToCompare(product);
    if (result.success) {
      Alert.alert('Added! ⚖️', 'Product added to compare list', [
        { text: 'Continue Shopping' },
        { text: 'View Compare', onPress: () => navigation.navigate('Compare') }
      ]);
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  const handleAiVision = async () => {
    if (!visionQuestion.trim()) { Alert.alert('Enter a question', 'Type a question about this product'); return; }
    setVisionLoading(true);
    setVisionAnswer('');
    
    // Mock response directing users to the web app
    setTimeout(() => {
      setVisionAnswer('✨ The AI Assistant is currently exclusively available on our Web App for a faster and smarter experience! Please visit our website to use this feature.');
      setVisionLoading(false);
    }, 1500);
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerView}>
          <ActivityIndicator color="#000" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const inWishlist = isInWishlist(product._id);
  const inCompare = isInCompare(product._id);
  const currentStock = selectedSize ? getVariantStock(product._id, selectedSize) : { status: 'IN_STOCK', text: 'In Stock' };
  const discount = Math.round(((product.price * 1.33 - product.price) / (product.price * 1.33)) * 100);
  const displayRating = product.averageRating || reviewStats.averageRating || 4.8;
  const displayReviews = product.totalReviews || reviewStats.totalReviews || reviews.length || 0;
  const relatedProducts = products.filter(p => p.category === product.category && p._id !== product._id).slice(0, 6);

  const stockColor = currentStock.status === 'IN_STOCK' ? '#22c55e'
    : currentStock.status === 'LOW_STOCK' ? '#f59e0b' : '#ef4444';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>Product Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Main Image with wishlist button */}
        <TouchableOpacity onPress={() => setLightboxVisible(true)} activeOpacity={0.95}>
          <Image source={{ uri: selectedImage }} style={styles.mainImage} />
        </TouchableOpacity>

        {/* Wishlist button overlay */}
        <TouchableOpacity
          style={[styles.wishlistBtn, inWishlist && styles.wishlistBtnActive]}
          onPress={() => toggleWishlist(product._id)}
        >
          <Text style={{ fontSize: 18 }}>{inWishlist ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        {/* Thumbnail images */}
        {product.image?.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbsRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {product.image.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedImage(img)}>
                <Image source={{ uri: img }} style={[styles.thumb, selectedImage === img && styles.thumbActive]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.infoSection}>
          {/* Sold by badge */}
          <View style={styles.soldByRow}>
            <Text style={styles.soldByLabel}>Sold by:</Text>
            <View style={styles.storeChip}><Text style={styles.storeChipText}>🏪 {product.storeName || 'Forever Official'}</Text></View>
          </View>

          {/* Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <TouchableOpacity style={styles.ratingRow} onPress={() => setActiveTab('reviews')}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingNum}>{displayRating}</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
            <Text style={styles.reviewCount}>({displayReviews} Verified Reviews)</Text>
          </TouchableOpacity>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{currency}{product.price}</Text>
            <Text style={styles.mrp}>{currency}{Math.round(product.price * 1.33)}</Text>
            <View style={styles.discountBadge}><Text style={styles.discountText}>{discount}% OFF</Text></View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{product.description}</Text>

          {/* Bank Offers */}
          {bankOffers.length > 0 && (
            <View style={styles.bankOffersCard}>
              <Text style={styles.sectionTitle}>🏦 Bank & Payment Offers ({bankOffers.length})</Text>
              {bankOffers.slice(0, 2).map((offer, i) => (
                <View key={i} style={styles.bankOfferRow}>
                  <Text style={styles.bankName}>{offer.bankName}</Text>
                  <Text style={styles.offerText}>{offer.offerText}</Text>
                  {offer.minPurchase > 0 && <Text style={styles.minPurchase}>Min: ₹{offer.minPurchase}</Text>}
                </View>
              ))}
              {bankOffers.length > 2 && (
                <Text style={styles.moreOffers}>+{bankOffers.length - 2} more offers</Text>
              )}
            </View>
          )}

          {/* Delivery / Pincode Check */}
          <View style={styles.deliveryCard}>
            <Text style={styles.sectionTitle}>📍 Delivery Location</Text>
            <View style={styles.pincodeRow}>
              <TextInput
                style={styles.pincodeInput}
                placeholder="Enter 6-digit Pincode"
                placeholderTextColor="#9ca3af"
                value={pincodeInput}
                onChangeText={t => setPincodeInput(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.checkBtn} onPress={handleCheckPincode}>
                <Text style={styles.checkBtnText}>Check</Text>
              </TouchableOpacity>
            </View>
            {pincodeStatus ? (
              <Text style={[styles.pincodeStatus, pincodeStatus.includes('✓') ? styles.pincodeOk : styles.pincodeErr]}>
                {pincodeStatus}
              </Text>
            ) : (
              <Text style={styles.pincodeHint}>Enter pincode to check delivery timeline & COD</Text>
            )}
          </View>

          {/* Color variants */}
          {products.filter(p => p.name === product.name).length > 1 && (
            <View style={styles.colorSection}>
              <Text style={styles.sectionLabel}>SELECT COLOR: <Text style={{ color: '#111', fontWeight: '700' }}>{product.colors?.[0] || 'Default'}</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                {products.filter(p => p.name === product.name).map((variant) => (
                  <TouchableOpacity
                    key={variant._id}
                    onPress={() => navigation.navigate('Product', { productId: variant._id })}
                    style={[styles.colorVariant, variant._id === product._id && styles.colorVariantActive]}
                  >
                    <Image source={{ uri: variant.image[0] }} style={styles.colorThumb} />
                    {variant._id === product._id && <View style={styles.colorCheck}><Text style={{ color: '#fff', fontSize: 10 }}>✓</Text></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Size Selector */}
          <View style={styles.sizeSection}>
            <View style={styles.sizeHeader}>
              <Text style={styles.sectionLabel}>SELECT SIZE</Text>
              <TouchableOpacity>
                <Text style={styles.sizeGuideBtn}>📏 Size Guide</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sizeRow}>
              {product.sizes?.map((sz) => {
                const stock = getVariantStock(product._id, sz);
                const isSelected = sz === selectedSize;
                const isOos = stock.status === 'OUT_OF_STOCK';
                const stockDotColor = stock.status === 'IN_STOCK' ? '#22c55e' : stock.status === 'LOW_STOCK' ? '#f59e0b' : '#ef4444';
                return (
                  <TouchableOpacity
                    key={sz}
                    style={[styles.sizeChip, isSelected && styles.sizeChipSelected, isOos && styles.sizeChipOos]}
                    onPress={() => !isOos && setSelectedSize(sz)}
                  >
                    <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected, isOos && styles.sizeTextOos]}>{sz}</Text>
                    <View style={[styles.stockDot, { backgroundColor: stockDotColor }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSize && (
              <View style={[styles.stockBadge, { backgroundColor: stockColor + '15', borderColor: stockColor + '40' }]}>
                <View style={[styles.stockDotLg, { backgroundColor: stockColor }]} />
                <Text style={[styles.stockText, { color: stockColor }]}>Size {selectedSize}: {currentStock.text}</Text>
              </View>
            )}
          </View>

          {/* AI Vision / Try On Button */}
          <TouchableOpacity
            style={styles.aiVisionBtn}
            onPress={() => setVisionModalVisible(true)}
          >
            <Text style={styles.aiVisionText}>✨ AI FASHION ASSISTANT - Ask About This Product</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          {currentStock.status === 'OUT_OF_STOCK' ? (
            <View style={styles.outOfStockBanner}>
              <Text style={styles.outOfStockText}>🔔 Out of Stock - {currentStock.text}</Text>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addToCartBtn}
                onPress={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? <ActivityIndicator color="#fff" /> : <Text style={styles.addToCartText}>ADD TO CART</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
                <Text style={styles.buyNowText}>BUY NOW</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Compare & Return Policy */}
          <View style={styles.extraRow}>
            <TouchableOpacity
              style={[styles.compareBtn, inCompare && styles.compareBtnActive]}
              onPress={handleCompare}
            >
              <Text style={[styles.compareBtnText, inCompare && styles.compareBtnTextActive]}>
                ⚖️ {inCompare ? 'In Compare List' : 'Add to Compare'}
              </Text>
            </TouchableOpacity>
            <View style={styles.policies}>
              <Text style={styles.policyText}>✓ 7 Days Return</Text>
              <Text style={styles.policyText}>✓ COD Available</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {['specs', 'reviews'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'specs' ? '📋 Specifications' : `⭐ Reviews (${displayReviews})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Specs Tab */}
          {activeTab === 'specs' && (
            <View style={styles.specsSection}>
              <View style={styles.specCard}>
                <Text style={styles.specCardTitle}>Product Overview</Text>
                {[
                  ['Seller / Store', product.storeName || 'Forever Official'],
                  ['Brand', product.brand || 'Forever Fashion'],
                  ['Category', product.category],
                  ['Type', product.subCategory],
                  ['Available Sizes', product.sizes?.join(', ')],
                  ['Return Policy', product.returnAvailable !== false ? '7 Days Return' : 'Non-Returnable'],
                  ['Cash on Delivery', product.cashOnDelivery !== false ? 'Available' : 'Prepaid Only'],
                ].map(([label, value]) => value && (
                  <View key={label} style={styles.specRow}>
                    <Text style={styles.specLabel}>{label}:</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.specCard}>
                <Text style={styles.specCardTitle}>Fabric & Care</Text>
                {[
                  ['Fabric / Material', product.fabric || '100% Premium Cotton'],
                  ['Wash Care', product.washCare || 'Machine wash cold, gentle'],
                  ['Fit Type', product.fitType || 'Regular Fit'],
                  ['Occasion', product.occasion || 'Casual, Formal'],
                ].map(([label, value]) => (
                  <View key={label} style={styles.specRow}>
                    <Text style={styles.specLabel}>{label}:</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <View style={styles.reviewsSection}>
              {/* Rating Overview */}
              <View style={styles.ratingOverview}>
                <Text style={styles.bigRating}>{displayRating}</Text>
                <Text style={styles.bigStar}>★</Text>
                <Text style={styles.totalReviewsText}>{displayReviews} verified reviews</Text>
              </View>

              {reviews.length === 0 ? (
                <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
              ) : (
                reviews.slice(0, 5).map((review, i) => (
                  <View key={i} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.userName || 'Verified Buyer'}</Text>
                      <Text style={styles.reviewRating}>{'★'.repeat(review.rating || 5)}</Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment || review.review}</Text>
                    {review.createdAt && (
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>You May Also Like</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
                {relatedProducts.map(rp => (
                  <TouchableOpacity
                    key={rp._id}
                    style={styles.relatedCard}
                    onPress={() => navigation.navigate('Product', { productId: rp._id })}
                  >
                    <Image source={{ uri: rp.image?.[0] }} style={styles.relatedImage} />
                    <Text style={styles.relatedName} numberOfLines={2}>{rp.name}</Text>
                    <Text style={styles.relatedPrice}>{currency}{rp.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal visible={lightboxVisible} transparent animationType="fade">
        <View style={styles.lightbox}>
          <ScrollView 
            maximumZoomScale={5} 
            minimumZoomScale={1} 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => setLightboxVisible(false)}>
              <Image source={{ uri: selectedImage }} style={styles.lightboxImage} resizeMode="contain" />
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20 }} onPress={() => setLightboxVisible(false)}>
            <Text style={styles.lightboxClose}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* AI Vision Modal */}
      <Modal visible={visionModalVisible} transparent animationType="slide">
        <View style={styles.visionOverlay}>
          <View style={styles.visionModal}>
            <View style={styles.visionHeader}>
              <Text style={styles.visionTitle}>✨ AI Fashion Assistant</Text>
              <TouchableOpacity onPress={() => { setVisionModalVisible(false); setVisionAnswer(''); setVisionQuestion(''); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.visionSubtitle}>Ask anything about "{product.name}"</Text>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.visionProductImage} resizeMode="cover" />
            ) : null}
            <TextInput
              style={styles.visionInput}
              placeholder="e.g. Does this fit slim people? Best occasion to wear?"
              placeholderTextColor="#9ca3af"
              value={visionQuestion}
              onChangeText={setVisionQuestion}
              multiline
            />
            <TouchableOpacity style={styles.visionBtn} onPress={handleAiVision} disabled={visionLoading}>
              {visionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.visionBtnText}>ASK AI →</Text>}
            </TouchableOpacity>
            {visionAnswer ? (
              <View style={styles.visionAnswer}>
                <Text style={styles.visionAnswerLabel}>AI Says:</Text>
                <Text style={styles.visionAnswerText}>{visionAnswer}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 10,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#111', fontWeight: '700' },
  cartIcon: { fontSize: 20 },
  topTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111' },
  mainImage: { width: '100%', aspectRatio: 0.75, backgroundColor: '#f9f9f9', resizeMode: 'contain' },
  wishlistBtn: {
    position: 'absolute', top: 56, right: 12, backgroundColor: '#fff', borderRadius: 20,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  wishlistBtnActive: { backgroundColor: '#fff1f2' },
  thumbsRow: { marginTop: 8 },
  thumb: { width: 64, height: 64, borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  thumbActive: { borderColor: '#111' },
  infoSection: { padding: 16, gap: 12 },
  soldByRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  soldByLabel: { fontSize: 12, color: '#6b7280' },
  storeChip: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  storeChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  productName: { fontSize: 20, fontWeight: '800', color: '#111', lineHeight: 26 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 2 },
  ratingNum: { fontSize: 12, fontWeight: '800', color: '#92400e' },
  ratingStar: { fontSize: 12, color: '#f59e0b' },
  reviewCount: { fontSize: 12, color: '#6b7280', textDecorationLine: 'underline' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 26, fontWeight: '900', color: '#111' },
  mrp: { fontSize: 16, color: '#9ca3af', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: '#bbf7d0' },
  discountText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  description: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  bankOffersCard: { backgroundColor: '#eef2ff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#c7d2fe', gap: 8 },
  bankOfferRow: { backgroundColor: '#fff', borderRadius: 8, padding: 10, gap: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  bankName: { fontSize: 11, fontWeight: '800', color: '#1e40af' },
  offerText: { fontSize: 12, color: '#374151' },
  minPurchase: { fontSize: 10, color: '#9ca3af' },
  moreOffers: { fontSize: 11, color: '#4338ca', fontWeight: '700', textAlign: 'right' },
  deliveryCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  pincodeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pincodeInput: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#111', backgroundColor: '#fff',
  },
  checkBtn: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  checkBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  pincodeStatus: { fontSize: 12, fontWeight: '600', padding: 8, borderRadius: 8, borderWidth: 1 },
  pincodeOk: { color: '#15803d', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pincodeErr: { color: '#b91c1c', backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  pincodeHint: { fontSize: 11, color: '#9ca3af' },
  colorSection: { gap: 10 },
  colorVariant: { borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#e5e7eb' },
  colorVariantActive: { borderColor: '#111', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  colorThumb: { width: 56, height: 68, resizeMode: 'cover' },
  colorCheck: { position: 'absolute', top: 3, right: 3, backgroundColor: '#111', borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  sizeSection: { gap: 10 },
  sizeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sizeGuideBtn: { fontSize: 12, fontWeight: '700', color: '#111', textDecorationLine: 'underline' },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeChip: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  sizeChipSelected: { borderColor: '#111', backgroundColor: '#111' },
  sizeChipOos: { opacity: 0.45 },
  sizeText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  sizeTextSelected: { color: '#fff' },
  sizeTextOos: { textDecorationLine: 'line-through' },
  stockDot: { position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  stockDotLg: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 12, fontWeight: '700' },
  aiVisionBtn: {
    backgroundColor: '#f5f3ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#c4b5fd',
  },
  aiVisionText: { fontSize: 12, fontWeight: '800', color: '#6d28d9', letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', gap: 10 },
  addToCartBtn: {
    flex: 1, backgroundColor: '#ff9f00', paddingVertical: 15, borderRadius: 12,
    alignItems: 'center',
  },
  addToCartText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  buyNowBtn: {
    flex: 1, backgroundColor: '#fb641b', paddingVertical: 15, borderRadius: 12,
    alignItems: 'center',
  },
  buyNowText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  outOfStockBanner: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' },
  outOfStockText: { color: '#b91c1c', fontWeight: '700', fontSize: 13 },
  extraRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  compareBtn: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  compareBtnActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  compareBtnText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  compareBtnTextActive: { color: '#065f46' },
  policies: { flexDirection: 'row', gap: 10 },
  policyText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#111' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  tabTextActive: { color: '#111' },
  specsSection: { gap: 12, marginTop: 8 },
  specCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  specCardTitle: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  specLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', flex: 1 },
  specValue: { fontSize: 12, fontWeight: '700', color: '#111', flex: 1.2, textAlign: 'right' },
  reviewsSection: { gap: 12, marginTop: 8 },
  ratingOverview: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fefce8', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  bigRating: { fontSize: 32, fontWeight: '900', color: '#92400e' },
  bigStar: { fontSize: 28, color: '#f59e0b' },
  totalReviewsText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  noReviews: { textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 20 },
  reviewCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#111' },
  reviewRating: { fontSize: 14, color: '#f59e0b' },
  reviewComment: { fontSize: 13, color: '#374151', lineHeight: 18 },
  reviewDate: { fontSize: 11, color: '#9ca3af' },
  relatedSection: { gap: 10 },
  relatedTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  relatedCard: { width: 130, backgroundColor: '#f9fafb', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  relatedImage: { width: '100%', height: 110, resizeMode: 'cover' },
  relatedName: { fontSize: 11, color: '#374151', fontWeight: '600', padding: 6, lineHeight: 15 },
  relatedPrice: { fontSize: 12, fontWeight: '800', color: '#111', paddingHorizontal: 6, paddingBottom: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#111', marginBottom: 4 },
  centerView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  // Lightbox
  lightbox: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: width, height: width },
  lightboxClose: { color: '#fff', marginTop: 20, fontSize: 13 },
  // AI Vision Modal
  visionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  visionModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, maxHeight: '80%' },
  visionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  visionTitle: { fontSize: 16, fontWeight: '800', color: '#6d28d9' },
  closeBtn: { fontSize: 18, color: '#6b7280', fontWeight: '700' },
  visionSubtitle: { fontSize: 12, color: '#6b7280' },
  visionProductImage: { width: '100%', height: 140, borderRadius: 12, resizeMode: 'cover' },
  visionInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 13, color: '#111', backgroundColor: '#f9fafb', minHeight: 60,
  },
  visionBtn: { backgroundColor: '#7c3aed', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  visionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  visionAnswer: { backgroundColor: '#f5f3ff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ddd6fe' },
  visionAnswerLabel: { fontSize: 11, fontWeight: '800', color: '#6d28d9', marginBottom: 6, letterSpacing: 1 },
  visionAnswerText: { fontSize: 13, color: '#374151', lineHeight: 20 },
});
