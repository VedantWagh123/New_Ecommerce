import React, { useContext, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { backendUrl } from '../context/ShopContext';

const STARTERS = [
  "Show men's shirts under $50",
  "What are today's bestsellers?",
  "Suggest outfit for summer",
  "Do you have women's jackets?",
  "How does sizing work?",
  "What's your return policy?",
];

export default function ChatbotScreen({ navigation }) {
  const { token } = useContext(ShopContext);
  const [messages, setMessages] = useState([
    {
      id: '0', role: 'assistant',
      text: "👋 Hi! I'm your Forever AI Shopping Assistant.\n\nAsk me anything about our collection, sizing, outfit suggestions, or product details!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef(null);

  const sendMessage = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    // Mock response directing users to the web app
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: "The AI Assistant is currently exclusively available on our Web App for a faster and smarter experience! Please visit our website to use this feature." 
      }]);
      setIsTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }, 1500);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>AI</Text></View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.text}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}><Text style={styles.userAvatarText}>👤</Text></View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.onlineDot} />
          <View>
            <Text style={styles.headerTitle}>AI Fashion Assistant</Text>
            <Text style={styles.headerSub}>Powered by Ollama · Online</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.msgRow, styles.msgRowBot]}>
                <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>AI</Text></View>
                <View style={[styles.bubble, styles.bubbleBot]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#6b7280" />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        {/* Starter Prompts (only initially) */}
        {messages.length <= 1 && !isTyping && (
          <View style={styles.startersSection}>
            <Text style={styles.startersLabel}>QUICK QUESTIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {STARTERS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.starterChip} onPress={() => sendMessage(s)}>
                  <Text style={styles.starterText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about fashion, sizes, trends..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#111', fontSize: 18, fontWeight: '700' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#22c55e' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  headerSub: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
  messageList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgRowBot: {},
  aiAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  aiAvatarText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  userAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  userAvatarText: { fontSize: 14 },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser: { backgroundColor: '#111', borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: '#111' },
  typingText: { color: '#6b7280', fontSize: 13, fontStyle: 'italic' },
  startersSection: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  startersLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 1.5, marginBottom: 8 },
  starterChip: { backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  starterText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff',
  },
  input: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 14, color: '#111', maxHeight: 120,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#e5e7eb' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
