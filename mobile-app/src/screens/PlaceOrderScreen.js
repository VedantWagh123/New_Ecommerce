import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { backendUrl } from '../context/ShopContext';

const EMPTY_ADDR = { firstName: '', lastName: '', email: '', street: '', city: '', state: '', zipcode: '', country: '', phone: '' };

export default function PlaceOrderScreen({ navigation }) {
  const {
    cartItems, products, currency,
    getCartAmount, delivery_fee,
    setCartItems, token, karmaScore,
    couponData,
  } = useContext(ShopContext);

  const [method, setMethod] = useState('cod');
  const [formData, setFormData] = useState(EMPTY_ADDR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const subtotal = getCartAmount();
  const shipping = subtotal > 0 && subtotal < 50 ? delivery_fee : 0;
  const couponDiscount = couponData?.discount || 0;
  const total = subtotal + shipping - couponDiscount;

  // Build order items list
  const orderItems = [];
  for (const itemId in cartItems) {
    for (const size in cartItems[itemId]) {
      const qty = cartItems[itemId][size];
      if (qty > 0) {
        const p = products.find(pr => pr._id === itemId);
        if (p) orderItems.push({ ...p, size, quantity: qty });
      }
    }
  }

  // COD blocked if karma < 40
  const codBlocked = karmaScore < 40;
  useEffect(() => {
    if (codBlocked && method === 'cod') setMethod('stripe');
  }, [karmaScore]);

  // Load saved address
  useEffect(() => {
    const loadAddr = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_shipping_address');
        if (saved) setFormData(JSON.parse(saved));
      } catch (e) {}
    };
    loadAddr();
  }, []);

  const handleChange = async (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    try { await AsyncStorage.setItem('user_shipping_address', JSON.stringify(updated)); } catch (e) {}
  };

  const validate = () => {
    const required = ['firstName', 'lastName', 'email', 'street', 'city', 'zipcode', 'country', 'phone'];
    for (const field of required) {
      if (!formData[field] || !formData[field].trim()) {
        Alert.alert('Missing Info', `Please fill in "${field.replace(/([A-Z])/g, ' $1')}" field`);
        return false;
      }
    }
    return true;
  };

  const onPlaceOrder = async () => {
    if (orderItems.length === 0) { Alert.alert('Empty Cart', 'Add items to cart first'); return; }
    if (!validate()) return;
    if (!token) { navigation.navigate('Login'); return; }

    setIsSubmitting(true);
    const orderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    const orderData = {
      address: formData,
      items: orderItems,
      amount: total,
      couponCode: couponData?.code || '',
      couponDiscount: couponDiscount || 0,
    };

    try {
      if (method === 'cod') {
        const res = await axios.post(backendUrl + '/api/order/place', orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          handleSuccess(orderId);
        } else {
          Alert.alert('Order Failed', res.data.message || 'Something went wrong');
        }
      } else if (method === 'stripe') {
        Alert.alert('Stripe Payment', 'Stripe online payment requires web browser. Please use the website for online payment, or choose Cash on Delivery.');
      } else if (method === 'razorpay') {
        Alert.alert('Razorpay', 'Razorpay payment requires web browser. Please use the website for online payment, or choose Cash on Delivery.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccess = (orderId) => {
    setCartItems({});
    setCompletedOrder({
      orderId,
      itemCount: orderItems.reduce((s, i) => s + i.quantity, 0),
      total,
      currency,
      method: method === 'cod' ? 'Cash on Delivery' : 'Online',
    });
    setOrderSuccess(true);
  };

  // Order Success Screen
  if (orderSuccess && completedOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successOrderId}>#{completedOrder.orderId}</Text>
          <View style={styles.successDetails}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Items</Text>
              <Text style={styles.successVal}>{completedOrder.itemCount}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Total Paid</Text>
              <Text style={[styles.successVal, { fontWeight: '900', fontSize: 18 }]}>{currency}{completedOrder.total.toFixed(2)}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Payment</Text>
              <Text style={styles.successVal}>{completedOrder.method}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Delivery</Text>
              <Text style={styles.successVal}>3–5 business days</Text>
            </View>
          </View>
          <Text style={styles.successDelivery}>📍 Delivering to {formData.city}, {formData.country}</Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.successBtnText}>CONTINUE SHOPPING →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ordersBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.ordersBtnText}>View My Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const InputField = ({ label, field, placeholder, keyboard, capitalize }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder || label}
        placeholderTextColor="#9ca3af"
        value={formData[field]}
        onChangeText={v => handleChange(field, v)}
        keyboardType={keyboard || 'default'}
        autoCapitalize={capitalize || 'words'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={styles.stepDone}><Text style={styles.stepDoneText}>✓</Text></View>
        <Text style={styles.stepDoneLabel}>Cart</Text>
        <View style={styles.stepLine} />
        <View style={styles.stepActive}><Text style={styles.stepActiveText}>2</Text></View>
        <Text style={styles.stepActiveLabel}>Delivery</Text>
        <View style={styles.stepLine} />
        <View style={styles.stepPending}><Text style={styles.stepPendingText}>3</Text></View>
        <Text style={styles.stepPendingLabel}>Payment</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Cart Summary */}
        <View style={styles.cartSummaryCard}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY ({orderItems.length} items)</Text>
          {orderItems.map((item, i) => (
            <View key={`${item._id}_${item.size}_${i}`} style={styles.cartSummaryItem}>
              <Image source={{ uri: item.image?.[0] }} style={styles.summaryImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.summaryMeta}>Size: {item.size} · Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.summaryItemPrice}>{currency}{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 DELIVERY ADDRESS</Text>
          <View style={styles.rowInputs}>
            <InputField label="First Name *" field="firstName" />
            <InputField label="Last Name *" field="lastName" />
          </View>
          <InputField label="Email *" field="email" placeholder="email@example.com" keyboard="email-address" capitalize="none" />
          <InputField label="Phone *" field="phone" placeholder="+91 ..." keyboard="phone-pad" capitalize="none" />
          <InputField label="Street Address *" field="street" capitalize="sentences" />
          <View style={styles.rowInputs}>
            <InputField label="City *" field="city" />
            <InputField label="State" field="state" />
          </View>
          <View style={styles.rowInputs}>
            <InputField label="ZIP Code *" field="zipcode" keyboard="numeric" capitalize="none" />
            <InputField label="Country *" field="country" />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 PAYMENT METHOD</Text>

          {codBlocked && (
            <View style={styles.codBlockedBanner}>
              <Text style={styles.codBlockedText}>⚠️ COD is not available for your account (Karma Score: {karmaScore}). Please choose online payment.</Text>
            </View>
          )}

          {[
            { id: 'cod', label: 'Cash on Delivery', icon: '💵', disabled: codBlocked, sub: 'Pay when you receive the order' },
            { id: 'stripe', label: 'Stripe (Online)', icon: '💳', disabled: false, sub: 'Opens web browser for payment' },
            { id: 'razorpay', label: 'Razorpay (Online)', icon: '🏦', disabled: false, sub: 'Opens web browser for payment' },
          ].map(pm => (
            <TouchableOpacity
              key={pm.id}
              style={[styles.paymentOption, method === pm.id && styles.paymentOptionActive, pm.disabled && styles.paymentOptionDisabled]}
              onPress={() => !pm.disabled && setMethod(pm.id)}
              disabled={pm.disabled}
            >
              <View style={[styles.radio, method === pm.id && styles.radioActive]}>
                {method === pm.id && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.paymentIcon}>{pm.icon}</Text>
              <View>
                <Text style={[styles.paymentLabel, pm.disabled && styles.disabledText]}>{pm.label}</Text>
                <Text style={styles.paymentSub}>{pm.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CART TOTAL</Text>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>{currency}{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={[styles.totalVal, shipping === 0 && { color: '#15803d' }]}>{shipping === 0 ? 'FREE' : `${currency}${shipping}`}</Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#15803d' }]}>Coupon ({couponData.code})</Text>
                <Text style={{ fontWeight: '700', color: '#15803d' }}>−{currency}{couponDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalVal}>{currency}{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, isSubmitting && styles.placeOrderBtnDisabled]}
          onPress={onPlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.placeOrderText}>PLACE ORDER · {currency}{total.toFixed(2)}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#111', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 6 },
  stepDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  stepDoneText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  stepDoneLabel: { fontSize: 11, color: '#22c55e', fontWeight: '700' },
  stepLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  stepActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  stepActiveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  stepActiveLabel: { fontSize: 11, color: '#111', fontWeight: '800' },
  stepPending: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepPendingText: { color: '#9ca3af', fontSize: 10, fontWeight: '700' },
  stepPendingLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#374151', letterSpacing: 1.5 },
  cartSummaryCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10 },
  cartSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryImage: { width: 48, height: 56, borderRadius: 8, resizeMode: 'cover', backgroundColor: '#f9fafb' },
  summaryName: { fontSize: 12, fontWeight: '700', color: '#111', flex: 1 },
  summaryMeta: { fontSize: 11, color: '#6b7280' },
  summaryItemPrice: { fontSize: 13, fontWeight: '800', color: '#111' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  inputGroup: { flex: 1, gap: 5 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#374151', letterSpacing: 1 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#111', backgroundColor: '#f9fafb' },
  codBlockedBanner: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  codBlockedText: { fontSize: 12, color: '#b91c1c', fontWeight: '600', lineHeight: 18 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14 },
  paymentOptionActive: { borderColor: '#111', backgroundColor: '#f9fafb' },
  paymentOptionDisabled: { opacity: 0.4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#111' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#111' },
  paymentIcon: { fontSize: 22 },
  paymentLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  paymentSub: { fontSize: 11, color: '#6b7280' },
  disabledText: { color: '#9ca3af' },
  totalCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#6b7280' },
  totalVal: { fontSize: 13, fontWeight: '700', color: '#111' },
  divider: { height: 1, backgroundColor: '#e5e7eb' },
  grandTotalLabel: { fontSize: 15, fontWeight: '800', color: '#111' },
  grandTotalVal: { fontSize: 20, fontWeight: '900', color: '#111' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  placeOrderBtn: { backgroundColor: '#111', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  placeOrderBtnDisabled: { backgroundColor: '#374151' },
  placeOrderText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  // Success screen
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successIcon: { fontSize: 72, marginBottom: 8 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#111' },
  successOrderId: { fontSize: 13, color: '#6b7280', fontFamily: 'monospace' },
  successDetails: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 20, width: '100%', gap: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 8 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between' },
  successLabel: { fontSize: 13, color: '#6b7280' },
  successVal: { fontSize: 14, fontWeight: '700', color: '#111' },
  successDelivery: { fontSize: 13, color: '#374151', textAlign: 'center' },
  successBtn: { backgroundColor: '#111', paddingVertical: 15, paddingHorizontal: 32, borderRadius: 14, alignItems: 'center', width: '100%', marginTop: 8 },
  successBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  ordersBtn: { paddingVertical: 12, alignItems: 'center' },
  ordersBtnText: { color: '#6b7280', fontWeight: '700', textDecorationLine: 'underline' },
});
