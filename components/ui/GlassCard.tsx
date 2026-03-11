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
} from 'react-native-reanimated';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'heavy';
  interactive?: boolean;
}

export const GlassCard = ({
  children,
  style,
  intensity = 'medium',
  interactive = true,
}: GlassCardProps) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glowOpacity.value,
    shadowColor: intensity === 'heavy' ? '#10011a' : '#190626',
    shadowRadius: intensity === 'heavy' ? 20 : 10,
    elevation: intensity === 'heavy' ? 10 : 5,
  }));

  const handleHoverIn = () => {
    if (!interactive) return;
    scale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(intensity === 'heavy' ? 0.4 : 0.3, {
      duration: 200,
    });
  };

  const handleHoverOut = () => {
    if (!interactive) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(1, { duration: 200 });
  };

  // Safe overlay colors that won't overwrite your gradient
  const overlayColor =
    intensity === 'light'
      ? 'rgba(255, 255, 255, 0.1)'
      : intensity === 'medium'
        ? 'rgba(15, 23, 42, 0.85)' // Tailwind Slate 900 w/ 85% opacity
        : 'rgba(0, 0, 0, 0.15)'; // Tailwind Slate 900 w/ 95% opacity

  const glassBorderColor =
    intensity === 'light' ? 'rgba(0, 0, 255, 0.15)' : intensity === 'medium';

  return (
    <Animated.View
      style={[style, animatedStyle, { backgroundColor: 'transparent' }]}
    >
      {/* THE GLASS LAYER:
        Absolutely positioned so it doesn't mess with padding.
        Strictly rounded corners and hidden overflow to kill the square.
      */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            borderRadius: 24,
            borderWidth: 1,
            backgroundColor: overlayColor,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(20px)' } as any)
            : {},
        ]}
      />

      {/* THE CONTENT LAYER:
        Handles the interactions and renders the children safely inside the glass.
      */}
      <Pressable
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handleHoverIn}
        onPressOut={handleHoverOut}
        disabled={!interactive}
        style={{ flex: 1, borderRadius: 24 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
