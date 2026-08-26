import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { backendUrl } from '../context/ShopContext';

export default function ProfileScreen({ navigation }) {
  const { token, setToken, setCartItems, wishlist, compareList } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile Data
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zipcode: '', country: ''
  });
  const [avatar, setAvatar] = useState('');

  // Seller Modal
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [applyingSeller, setApplyingSeller] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    storeName: '', storePhone: '', storeDescription: '',
    accountHolder: '', accountNumber: '', bankName: '', ifscCode: ''
  });

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/user/profile`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const user = res.data.user;
        const addressObj = user.addresses?.[0] || {};
        const nameParts = (user.name || '').split(' ');
        
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.phone || '',
          address: addressObj.address || '',
          city: addressObj.city || '',
          state: addressObj.state || '',
          zipcode: addressObj.zipcode || '',
          country: addressObj.country || '',
        });
        setAvatar(user.avatar || '');
      }
    } catch (e) { console.error('Fetch profile error:', e); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/order/userorders`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setOrders(res.data.orders.reverse());
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
      
      const res = await axios.post(`${backendUrl}/api/user/update-profile`, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
        fetchProfile();
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleApplySeller = async () => {
    setApplyingSeller(true);
    try {
      const submitPayload = {
        ...sellerForm,
        bankDetails: {
          accountHolder: sellerForm.accountHolder,
          accountNumber: sellerForm.accountNumber,
          bankName: sellerForm.bankName,
          ifscCode: sellerForm.ifscCode
        }
      };
      
      const res = await axios.post(`${backendUrl}/api/seller/apply`, submitPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        Alert.alert('Application Submitted', 'Your seller application is under review.');
        setShowSellerModal(false);
      } else {
        Alert.alert('Error', res.data.message);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Application failed');
    } finally {
      setApplyingSeller(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('token');
          setToken('');
          setCartItems({});
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Not Logged In</Text>
          <Text style={styles.guestSub}>Login to view orders and profile</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>LOGIN / REGISTER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const InputField = ({ label, value, field, keyboardType = 'default', editable = true }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(val) => setFormData(prev => ({ ...prev, [field]: val }))}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      ) : (
        <Text style={[styles.inputValue, !editable && { color: '#9ca3af' }]}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => isEditing ? handleUpdateProfile() : setIsEditing(true)} disabled={updating}>
          {updating ? <ActivityIndicator size="small" color="#111" /> : (
            <Text style={styles.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* User Header */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{formData.firstName ? formData.firstName.charAt(0).toUpperCase() : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{formData.firstName} {formData.lastName}</Text>
              <Text style={styles.userEmail}>{formData.email}</Text>
              <View style={styles.memberBadge}><Text style={styles.memberText}>Forever Member</Text></View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            {[
              { icon: '🛍', label: 'Shop Now', onPress: () => navigation.navigate('Home') },
              { icon: '🛒', label: 'My Cart', onPress: () => navigation.navigate('Cart') },
              { icon: '❤️', label: 'Wishlist', onPress: () => navigation.navigate('Collection') },
              { icon: '🤖', label: 'AI Chat', onPress: () => navigation.navigate('Chatbot') },
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.actionCard} onPress={item.onPress}>
                <Text style={styles.actionIcon}>{item.icon}</Text>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Become a Seller Banner */}
          <TouchableOpacity style={styles.sellerBanner} onPress={() => setShowSellerModal(true)}>
            <View>
              <Text style={styles.sellerBannerTitle}>Become a Seller</Text>
              <Text style={styles.sellerBannerSub}>Start selling your products today.</Text>
            </View>
            <Text style={styles.sellerBannerIcon}>💼</Text>
          </TouchableOpacity>

          {/* Personal Information */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            <InputField label="FIRST NAME" value={formData.firstName} field="firstName" />
            <InputField label="LAST NAME" value={formData.lastName} field="lastName" />
            <InputField label="EMAIL" value={formData.email} field="email" keyboardType="email-address" editable={false} />
            <InputField label="PHONE" value={formData.phone} field="phone" keyboardType="phone-pad" />
          </View>

          {/* Address Information */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>SHIPPING ADDRESS</Text>
            <InputField label="ADDRESS" value={formData.address} field="address" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}><InputField label="CITY" value={formData.city} field="city" /></View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}><InputField label="STATE" value={formData.state} field="state" /></View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><InputField label="ZIPCODE" value={formData.zipcode} field="zipcode" keyboardType="number-pad" /></View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}><InputField label="COUNTRY" value={formData.country} field="country" /></View>
            </View>
          </View>

          {/* Orders Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>RECENT ORDERS ({orders.length})</Text>
            {loading ? (
              <ActivityIndicator style={{ padding: 20 }} color="#111" />
            ) : orders.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 10 }}>No orders found.</Text>
            ) : (
              orders.slice(0, 3).map((order, i) => (
                <View key={i} style={styles.orderCard}>
                  <View style={styles.orderTop}>
                    <Text style={styles.orderDate}>
                      {new Date(order.date).toLocaleDateString()}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#111' }}>{order.status}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '800', marginTop: 8 }}>${order.amount} • {order.items?.length} items</Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Seller Application Modal */}
      <Modal visible={showSellerModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSellerModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seller Application</Text>
            <TouchableOpacity onPress={() => setShowSellerModal(false)}>
              <Text style={{ fontSize: 24, color: '#111' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.modalDesc}>Join our platform and start selling your products to thousands of customers.</Text>
              
              <Text style={styles.sectionTitle}>STORE DETAILS</Text>
              <TextInput style={styles.modalInput} placeholder="Store Name" value={sellerForm.storeName} onChangeText={t => setSellerForm(p => ({...p, storeName: t}))} />
              <TextInput style={styles.modalInput} placeholder="Store Phone" keyboardType="phone-pad" value={sellerForm.storePhone} onChangeText={t => setSellerForm(p => ({...p, storePhone: t}))} />
              <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Store Description" multiline value={sellerForm.storeDescription} onChangeText={t => setSellerForm(p => ({...p, storeDescription: t}))} />
              
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>BANK DETAILS</Text>
              <TextInput style={styles.modalInput} placeholder="Account Holder Name" value={sellerForm.accountHolder} onChangeText={t => setSellerForm(p => ({...p, accountHolder: t}))} />
              <TextInput style={styles.modalInput} placeholder="Account Number" keyboardType="number-pad" value={sellerForm.accountNumber} onChangeText={t => setSellerForm(p => ({...p, accountNumber: t}))} />
              <TextInput style={styles.modalInput} placeholder="Bank Name" value={sellerForm.bankName} onChangeText={t => setSellerForm(p => ({...p, bankName: t}))} />
              <TextInput style={styles.modalInput} placeholder="IFSC / Routing Code" value={sellerForm.ifscCode} onChangeText={t => setSellerForm(p => ({...p, ifscCode: t}))} autoCapitalize="characters" />
              
              <TouchableOpacity style={styles.submitBtn} onPress={handleApplySeller} disabled={applyingSeller}>
                {applyingSeller ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Application</Text>}
              </TouchableOpacity>
              <View style={{ height: 60 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#111' },
  
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  guestIcon: { fontSize: 64 },
  guestTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  guestSub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  loginBtn: { backgroundColor: '#111', paddingVertical: 13, paddingHorizontal: 32, borderRadius: 12, marginTop: 8 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 18, fontWeight: '800', color: '#111' },
  userEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  memberBadge: { marginTop: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e5e7eb' },
  memberText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  actionCard: { flex: 1, minWidth: '22%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 10, fontWeight: '700', color: '#374151' },
  
  sellerBanner: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#fdf4ff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#fae8ff' },
  sellerBannerTitle: { fontSize: 16, fontWeight: '800', color: '#86198f', marginBottom: 2 },
  sellerBannerSub: { fontSize: 12, color: '#a21caf' },
  sellerBannerIcon: { fontSize: 32 },
  
  sectionBlock: { marginHorizontal: 16, marginBottom: 24, gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#374151', letterSpacing: 1.5, marginBottom: 4 },
  
  inputGroup: { gap: 6, marginBottom: 4 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280' },
  inputValue: { fontSize: 14, color: '#111', fontWeight: '500', paddingVertical: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111', backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row' },
  
  orderCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate: { fontSize: 12, color: '#6b7280' },
  
  logoutBtn: { marginHorizontal: 16, backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { color: '#b91c1c', fontWeight: '800', fontSize: 14 },
  
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  modalDesc: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', backgroundColor: '#f9fafb', marginBottom: 12 },
  submitBtn: { backgroundColor: '#111', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
