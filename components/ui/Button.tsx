/**
 * @file components/ui/Button.tsx
 * @description AAA Reanimated Button Component with Haptics and Gradients.
 */

import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
  const opacity = useSharedValue(disabled ? 0.5 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
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

  // Heights based on size
  const height = size === 'sm' ? 40 : size === 'md' ? 50 : 60;
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFF' : '#00F0FF'}
          style={styles.iconWrapper}
        />
      ) : icon ? (
        <Animated.View style={styles.iconWrapper}>{icon}</Animated.View>
      ) : null}
      <Text
        style={[styles.text, { fontSize }, getTextColor(variant), textStyle]}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Animated.View style={[styles.container, { height }, animatedStyle, style]}>
      {variant === 'primary' ? (
        <Animated.View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['#B026FF', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[styles.pressable, getVariantStyle(variant)]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        // @ts-ignore - React Native Web specific
        onMouseDown={handlePressIn}
        onMouseUp={handlePressOut}
        onMouseLeave={handlePressOut}
        onResponderGrant={handlePressIn}
        onResponderRelease={handlePressOut}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          disabled={disabled || loading}
          style={styles.innerTouchable}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

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
        borderColor: 'rgba(239, 68, 68, 0.4)',
      };
    default:
      return {}; // Primary uses LinearGradient behind it
  }
};

const getTextColor = (variant: string): TextStyle => {
  switch (variant) {
    case 'primary':
      return { color: '#FFFFFF', fontWeight: '800' };
    case 'secondary':
      return { color: '#E2E8F0', fontWeight: '700' };
    case 'ghost':
      return { color: '#00F0FF', fontWeight: '700' };
    case 'destructive':
      return { color: '#EF4444', fontWeight: '800' };
    default:
      return { color: '#FFFFFF' };
  }
};

const styles = StyleSheet.create({
  container: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  pressable: { flex: 1, borderRadius: 16 },
  innerTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: { letterSpacing: 0.5 },
  iconWrapper: { marginRight: 8 },
});
