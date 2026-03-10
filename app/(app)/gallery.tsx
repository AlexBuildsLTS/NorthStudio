import React from 'react';
import { View, Text } from 'react-native';
import { NORTH_THEME } from '@/constants/theme';
export default function GalleryScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: NORTH_THEME.colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: NORTH_THEME.colors.text.primary, fontSize: 24, fontWeight: 'bold' }}>Gallery</Text>
    </View>
  );
}