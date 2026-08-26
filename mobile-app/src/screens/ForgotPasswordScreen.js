import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { backendUrl } from '../context/ShopContext';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const formatEmail = (emailStr) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const user = parts[0];
    if (user.length <= 2) return emailStr;
    return `${user[0]}****${user[user.length - 1]}@${parts[1]}`;
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(backendUrl + '/api/user/forgot-password', { email });
      if (res.data.success) {
        setStep(2);
        Alert.alert('OTP Sent', res.data.message || 'Check your inbox for the OTP code');
      } else {
        Alert.alert('Error', res.data.message || 'Failed to send OTP');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, index) => {
    if (!/^[0-9]*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Enter full 6-digit OTP');
      return;
    }
    // We move to step 3 to ask for the new password. 
    // Actual verification will happen along with the new password in the final request.
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(backendUrl + '/api/user/reset-password', {
        email,
        otp: otp.join(''),
        newPassword
      });
      if (res.data.success) {
        Alert.alert('Success', 'Password reset successfully! You can now login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Error', res.data.message || 'Invalid or expired OTP');
        if (res.data.message?.includes('expired') || res.data.message?.includes('Invalid')) {
          setStep(2);
          setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (step > 1) setStep(step - 1);
            else navigation.goBack();
          }}>
            <Text style={styles.backText}>← {step === 1 ? 'Back to Login' : 'Back'}</Text>
          </TouchableOpacity>

          <View style={styles.iconBox}>
            <Text style={styles.iconText}>
              {step === 1 ? '🔑' : step === 2 ? '✉️' : '🔒'}
            </Text>
          </View>

          <Text style={styles.title}>
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Verify OTP' : 'New Password'}
          </Text>

          <Text style={styles.subtitle}>
            {step === 1 ? "Enter your account email and we'll send you an OTP code to reset your password."
              : step === 2 ? `Enter the 6-digit code sent to\n${formatEmail(email)}`
              : "Create a new strong password for your account."}
          </Text>

          <View style={styles.formSection}>
            {step === 1 && (
              <>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>SEND OTP →</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={ref => otpRefs.current[i] = ref}
                      style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                      value={digit}
                      onChangeText={val => handleOtpChange(val, i)}
                      onKeyPress={e => handleOtpKeyPress(e, i)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                    />
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.primaryBtnText}>VERIFY OTP →</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={{ marginTop: 12 }}>
                  <Text style={{ textAlign: 'center', color: '#111', fontSize: 13, fontWeight: '600' }}>
                    Didn't receive the code? Resend
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                
                <Text style={[styles.label, { marginTop: 10 }]}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleResetPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>RESET PASSWORD ✓</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === 1 && (
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 8 }}>
                <Text style={styles.backToLoginText}>Return to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 10 },
  backText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  iconBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb', alignSelf: 'center' },
  iconText: { fontSize: 28 },
  title: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 32, textAlign: 'center', paddingHorizontal: 20 },
  formSection: { gap: 14 },
  label: { fontSize: 10, fontWeight: '800', color: '#374151', letterSpacing: 1.5 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111', backgroundColor: '#f9fafb' },
  primaryBtn: { backgroundColor: '#111', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, marginTop: 4 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  backToLoginText: { textAlign: 'center', color: '#6b7280', fontSize: 13, fontWeight: '600' },
  
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  otpBox: { width: 48, height: 56, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  otpBoxFilled: { borderColor: '#111', backgroundColor: '#fff' },
});
