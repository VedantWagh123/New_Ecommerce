import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShopContext } from '../context/ShopContext';

export default function CartScreen({ navigation }) {
  const { cartItems, products, updateQuantity, getCartAmount, delivery_fee, currency, token } = useContext(ShopContext);

  const cartData = [];
  for (const itemId in cartItems) {
    for (const size in cartItems[itemId]) {
      if (cartItems[itemId][size] > 0) {
        const product = products.find(p => p._id === itemId);
        if (product) cartData.push({ ...product, size, quantity: cartItems[itemId][size] });
      }
    }
  }

  const subtotal = getCartAmount();
  const shipping = subtotal > 0 && subtotal < 50 ? delivery_fee : 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to proceed to checkout', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }
    navigation.navigate('PlaceOrder');
  };

  if (cartData.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}><Text style={styles.headerTitle}>Shopping Cart</Text></View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛍</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add products to get started</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopBtnText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart ({cartData.length})</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Items */}
        {cartData.map((item, idx) => (
          <View key={`${item._id}_${item.size}_${idx}`} style={styles.cartItem}>
            <Image source={{ uri: item.image?.[0] }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.itemMeta}>
                <View style={styles.sizePill}><Text style={styles.sizeText}>{item.size}</Text></View>
              </View>
              <Text style={styles.itemPrice}>{currency}{item.price}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (item.quantity === 1) {
                      Alert.alert('Remove Item', 'Remove this item from cart?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => updateQuantity(item._id, item.size, 0) }
                      ]);
                    } else {
                      updateQuantity(item._id, item.size, item.quantity - 1);
                    }
                  }}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.itemSubtotal}>{currency}{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Remove', 'Remove from cart?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => updateQuantity(item._id, item.size, 0) }
                ])}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>CART TOTALS</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{currency}{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={[styles.summaryVal, shipping === 0 && { color: '#15803d' }]}>
              {shipping === 0 ? 'FREE' : `${currency}${shipping}`}
            </Text>
          </View>
          {shipping === 0 && subtotal > 0 && (
            <Text style={styles.freeMsgText}>🎉 You qualify for free delivery!</Text>
          )}
          {shipping > 0 && (
            <Text style={styles.freeThresholdText}>Add {currency}{(50 - subtotal).toFixed(2)} more for free delivery</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>{currency}{total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  emptySub: { fontSize: 13, color: '#9ca3af' },
  shopBtn: { backgroundColor: '#111', paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  shopBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  cartItem: { flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemImage: { width: 88, height: 108, borderRadius: 10, resizeMode: 'cover', backgroundColor: '#f9fafb' },
  itemInfo: { flex: 1, gap: 6 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#111', lineHeight: 18 },
  itemMeta: { flexDirection: 'row', gap: 8 },
  sizePill: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  sizeText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  itemPrice: { fontSize: 15, fontWeight: '800', color: '#111' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  qtyBtnText: { color: '#111', fontSize: 16, fontWeight: '700' },
  qtyNum: { fontSize: 15, fontWeight: '800', color: '#111', minWidth: 22, textAlign: 'center' },
  itemSubtotal: { marginLeft: 'auto', fontSize: 14, fontWeight: '800', color: '#111' },
  removeText: { fontSize: 11, color: '#ef4444', fontWeight: '700' },
  summarySection: { margin: 16, backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  summaryTitle: { fontSize: 11, fontWeight: '800', color: '#374151', letterSpacing: 1.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#6b7280' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#111' },
  freeMsgText: { fontSize: 12, color: '#15803d', fontWeight: '600' },
  freeThresholdText: { fontSize: 11, color: '#6b7280' },
  divider: { height: 1, backgroundColor: '#e5e7eb' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#111' },
  totalVal: { fontSize: 20, fontWeight: '900', color: '#111' },
  bottomBar: { padding: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' },
  checkoutBtn: { backgroundColor: '#111', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
