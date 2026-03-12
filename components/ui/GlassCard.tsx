/**
 * @file components/ui/GlassCard.tsx
 * @description True AAA+ Glassmorphism.
 * FIX: Restored pure RGBA transparency so the background gradient shines through on all platforms.
 */
import React from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { NORTH_THEME } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'heavy';
  interactive?: boolean;
  onPress?: () => void;
}

export const GlassCard = ({
  children,
  style,
  intensity = 'medium',
  interactive = true,
  onPress,
}: GlassCardProps) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(1);
  const isHovered = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: glowOpacity.value,
      shadowColor: intensity === 'heavy' ? '#00F0FF' : '#B026FF',
      shadowRadius: intensity === 'heavy' ? 20 : 10,
      elevation: intensity === 'heavy' ? 10 : 5,
      borderColor: interpolateColor(
        isHovered.value,
        [0, 1],
        [
          NORTH_THEME.colors.border.glass,
          NORTH_THEME.colors.border.glassActive,
        ],
      ),
    };
  });

  const handleHoverIn = () => {
    if (!interactive) return;
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.02, NORTH_THEME.animation.springBouncy);
    glowOpacity.value = withTiming(intensity === 'heavy' ? 0.6 : 0.4, {
      duration: 200,
    });
    isHovered.value = withTiming(1, { duration: 200 });
  };

  const handleHoverOut = () => {
    if (!interactive) return;
    scale.value = withSpring(1, NORTH_THEME.animation.spring);
    glowOpacity.value = withTiming(1, { duration: 200 });
    isHovered.value = withTiming(0, { duration: 200 });
  };

  // TRUE CYBERPUNK TRANSPARENCY (No solid colors)
  const overlayColor =
    intensity === 'light'
      ? 'rgba(255, 255, 255, 0.03)'
      : intensity === 'medium'
        ? 'rgba(13, 2, 33, 0.4)' // Deep Violet Glass
        : 'rgba(2, 1, 10, 0.6)'; // Heavy Obsidian Glass

  return (
    <Animated.View
      style={[
        style,
        animatedStyle,
        {
          backgroundColor: overlayColor,
          borderRadius: NORTH_THEME.layout.radius.xl,
          borderWidth: 1,
          overflow: 'hidden',
        },
        Platform.OS === 'web' && ({ backdropFilter: 'blur(20px)' } as any),
      ]}
    >
      <Pressable
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handleHoverIn}
        onPressOut={handleHoverOut}
        onPress={onPress}
        disabled={!interactive && !onPress}
        style={{ flex: 1, padding: 24 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
