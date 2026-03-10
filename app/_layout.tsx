/**
 * @file app/_layout.tsx
 * @description Absolute Root Layout. 
 * Initializes Tailwind CSS and the Reanimated Physics engine. No routing logic here.
 */

import '../global.css';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <StatusBar style="light" backgroundColor="#0A0D14" />
      <Slot />
    </GestureHandlerRootView>
  );
}