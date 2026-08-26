import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ShopContextProvider from './src/context/ShopContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ShopContextProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </ShopContextProvider>
    </SafeAreaProvider>
  );
}
