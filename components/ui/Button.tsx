/**
 * @file components/ui/Button.tsx
 * @description AAA+ High-Performance Button Component.
 * Features: Native-thread Spring scaling, Premium Glow Effects, Platform-safe Haptics.
 */

import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  Pressable,
  View,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { NORTH_THEME } from '@/constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>; // Fixed: Proper StyleProp typing
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0); // For premium hover/press glow

  // --- PHYSICS ENGINE ---
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.95, NORTH_THEME.animation.springBouncy);
    glowOpacity.value = withTiming(variant === 'primary' ? 0.6 : 0, {
      duration: 150,
    });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, NORTH_THEME.animation.spring);
    glowOpacity.value = withTiming(0, { duration: 250 });
  };

  const handleHoverIn = () => {
    if (disabled || loading || Platform.OS !== 'web') return;
    scale.value = withSpring(1.02, NORTH_THEME.animation.spring);
    glowOpacity.value = withTiming(variant === 'primary' ? 0.4 : 0, {
      duration: 200,
    });
  };

  const handleHoverOut = () => {
    if (disabled || loading || Platform.OS !== 'web') return;
    scale.value = withSpring(1, NORTH_THEME.animation.spring);
    glowOpacity.value = withTiming(0, { duration: 200 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        variant === 'destructive'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium,
      );
    }
    onPress();
  };

  // --- SIZING LOGIC ---
  const height = size === 'sm' ? 36 : size === 'md' ? 48 : 56;
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 16;

  return (
    <Animated.View
      style={[
        styles.container,
        { height },
        animatedStyle,
        getGlowStyle(variant),
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.pressable,
          getVariantStyle(variant),
          disabled && styles.disabled,
        ]}
      >
        {variant === 'primary' && !disabled && (
          <LinearGradient
            colors={[
              NORTH_THEME.colors.accent.cyan,
              NORTH_THEME.colors.accent.purple,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.contentRow}>
          {loading ? (
            <ActivityIndicator
              color={variant === 'primary' ? '#000' : '#FFF'}
              style={styles.icon}
            />
          ) : icon ? (
            <View style={styles.icon}>{icon}</View>
          ) : null}
          <Text
            style={[
              styles.text,
              { fontSize },
              getTextColor(variant, disabled),
              textStyle,
            ]}
          >
            {loading ? 'PROCESSING...' : label.toUpperCase()}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// --- STYLING HELPERS ---
const getVariantStyle = (variant: string): ViewStyle => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'destructive':
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
      };
    default:
      return { backgroundColor: NORTH_THEME.colors.accent.purple }; // Fallback for primary
  }
};

const getTextColor = (variant: string, disabled: boolean): TextStyle => {
  if (disabled) return { color: NORTH_THEME.colors.text.muted };
  switch (variant) {
    case 'primary':
      return { color: '#000000', fontWeight: '900' }; // High contrast on neon gradient
    case 'secondary':
      return { color: '#FFFFFF', fontWeight: '700' };
    case 'ghost':
      return { color: NORTH_THEME.colors.accent.cyan, fontWeight: '800' };
    case 'destructive':
      return { color: '#EF4444', fontWeight: '800' };
    default:
      return { color: '#FFFFFF' };
  }
};

const getGlowStyle = (variant: string): ViewStyle => {
  if (variant !== 'primary') return {};
  return {
    shadowColor: NORTH_THEME.colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 8,
  };
};

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 12 },
  pressable: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  text: { letterSpacing: 1 },
  icon: { marginRight: 8 },
});
