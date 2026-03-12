import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore'; // Swapped to Zustand

// North Studio Deep Dark Theme
const THEME = {
  obsidian: '#000000', // True black for OLED/Deep Dark
};

export default function MessagesLayout() {
  // Zustand state selection
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.obsidian },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false,
          contentStyle: { backgroundColor: THEME.obsidian },
        }}
      />
    </Stack>
  );
}
