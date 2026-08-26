import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { backendUrl } from '../context/ShopContext';

export default function LoginScreen({ navigation }) {
  const { token, setToken } = useContext(ShopContext);
  const [currentState, setCurrentState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP
  const [otpPending, setOtpPending] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (token) navigation.replace('MainTabs');
  }, [token]);

  const formatEmail = (emailStr) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const user = parts[0];
    if (user.length <= 2) return emailStr;
    return `${user[0]}****${user[user.length - 1]}@${parts[1]}`;
  };

  const onSubmit = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    setIsLoading(true);
    try {
      if (currentState === 'Sign Up') {
        if (!name) { Alert.alert('Error', 'Please enter your name'); setIsLoading(false); return; }
        const res = await axios.post(backendUrl + '/api/user/register', { name, email, password });
        if (res.data.success) setToken(res.data.token);
        else Alert.alert('Error', res.data.message);
      } else {
        const res = await axios.post(backendUrl + '/api/user/login', { email, password });
        if (res.data.success) {
          if (res.data.otpPending) {
            setOtpPending(true);
            setTempToken(res.data.tempToken);
            setTimer(60);
            Alert.alert('OTP Sent', `Code sent to ${formatEmail(email)}`);
          } else {
            setToken(res.data.token);
          }
        } else Alert.alert('Error', res.data.message);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Could not connect. Check your WiFi.');
    } finally {
      setIsLoading(false);
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
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const onVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { Alert.alert('Error', 'Enter full 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(backendUrl + '/api/user/verify-otp', { tempToken, otp: otpValue });
      if (res.data.success) setToken(res.data.token);
      else {
        Alert.alert('Error', res.data.message);
        if (res.data.message?.includes('expired') || res.data.message?.includes('session')) {
          setOtpPending(false); setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (e) { Alert.alert('Error', 'Something went wrong'); }
    finally { setIsLoading(false); }
  };

  const onResendOtp = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const res = await axios.post(backendUrl + '/api/user/resend-otp', { tempToken });
      if (res.data.success) {
        setTimer(60); setOtp(['', '', '', '', '', '']);
        Alert.alert('Success', 'OTP resent!');
      } else Alert.alert('Error', res.data.message);
    } catch (e) { Alert.alert('Error', 'Failed'); }
    finally { setIsLoading(false); }
  };

  // OTP Screen
  if (otpPending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.logoArea}>
              <View style={styles.logoBox}><Text style={styles.logoLetter}>F</Text></View>
              <Text style={styles.brandName}>FOREVER</Text>
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to{'\n'}{formatEmail(email)}</Text>

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

            <TouchableOpacity style={styles.submitBtn} onPress={onVerifyOtp} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>VERIFY →</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onResendOtp} disabled={timer > 0} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: timer > 0 ? '#9ca3af' : '#111', fontWeight: '600' }}>
                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => { setOtpPending(false); setOtp(['', '', '', '', '', '']); }}>
              <Text style={{ color: '#6b7280', fontSize: 13 }}>← Back to Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main Login / Register
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <View style={styles.logoBox}><Text style={styles.logoLetter}>F</Text></View>
            <Text style={styles.brandName}>FOREVER</Text>
            <Text style={styles.tagline}>Premium Fashion Store</Text>
          </View>

          <Text style={styles.title}>{currentState === 'Login' ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>{currentState === 'Login' ? 'Sign in to your account' : 'Join the Forever community'}</Text>

          <View style={styles.form}>
            {currentState === 'Sign Up' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} autoCapitalize="words" />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.passwordRow}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Enter password" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {currentState === 'Login' && (
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{currentState === 'Login' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setCurrentState(currentState === 'Login' ? 'Sign Up' : 'Login')}>
            <Text style={styles.switchText}>
              {currentState === 'Login' ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchLink}>{currentState === 'Login' ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  logoLetter: { fontSize: 28, fontWeight: '900', color: '#fff' },
  brandName: { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: 5, marginBottom: 4 },
  tagline: { fontSize: 11, color: '#9ca3af', fontWeight: '500', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 28, lineHeight: 18 },
  form: { gap: 14, marginBottom: 20 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#374151', letterSpacing: 1.5 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#111', backgroundColor: '#f9fafb' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 20 },
  forgotText: { textAlign: 'right', color: '#111', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  submitBtn: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  switchText: { textAlign: 'center', color: '#6b7280', fontSize: 13, marginTop: 4 },
  switchLink: { color: '#111', fontWeight: '700', textDecorationLine: 'underline' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 20 },
  otpBox: { width: 48, height: 56, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  otpBoxFilled: { borderColor: '#111', backgroundColor: '#fff' },
});
