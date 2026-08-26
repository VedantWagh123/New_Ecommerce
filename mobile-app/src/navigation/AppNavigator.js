import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import FloatingChatbot from '../components/FloatingChatbot';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CollectionScreen from '../screens/CollectionScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductScreen from '../screens/ProductScreen';
import LoginScreen from '../screens/LoginScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PlaceOrderScreen from '../screens/PlaceOrderScreen';
import CompareScreen from '../screens/CompareScreen';
import StoryScreen from '../screens/StoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Collection: '🔍',
  Cart: '🛍',
  Profile: '👤',
};

const MainTabs = () => {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({

        headerShown: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Collection" component={CollectionScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
    <FloatingChatbot />
    </>
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Product" component={ProductScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Compare" component={CompareScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PlaceOrder" component={PlaceOrderScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Checkout" component={PlaceOrderScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="StoryScreen" component={StoryScreen} options={{ presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
