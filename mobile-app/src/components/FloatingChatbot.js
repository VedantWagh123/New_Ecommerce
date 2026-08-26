import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function FloatingChatbot() {
  const navigation = useNavigation();
  const jumpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(jumpAnim, { toValue: -15, duration: 300, useNativeDriver: true }),
        Animated.timing(jumpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(jumpAnim, { toValue: -8, duration: 200, useNativeDriver: true }),
        Animated.timing(jumpAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(3000), // Jump every 3 seconds
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: jumpAnim }] }]}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🤖</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above the tab bar
    right: 16,
    zIndex: 999,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  icon: {
    fontSize: 22,
  }
});
