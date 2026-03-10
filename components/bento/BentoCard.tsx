// components/bento/BentoCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  interpolate,
  Extrapolation,
  FadeInRight,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { NORTH_THEME } from '@/constants/theme';

export interface BentoItemProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Props {
  item: BentoItemProps;
  index: number;
  isDesktop: boolean;
}

export const BentoCard = React.memo(({ item, index, isDesktop }: Props) => {
  const Icon = item.icon;
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const [layout, setLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: withSpring(scale.value, NORTH_THEME.animation.spring) },
    ],
    backgroundColor: interpolateColor(
      glowOpacity.value,
      [0, 1],
      [NORTH_THEME.colors.background.card, 'rgba(176, 38, 255, 0.1)'],
    ),
    borderColor: interpolateColor(
      glowOpacity.value,
      [0, 1],
      [NORTH_THEME.colors.border.glass, 'rgba(176, 38, 255, 0.4)'],
    ),
  }));

  const handleInteraction = (active: boolean) => {
    scale.value = withSpring(active ? 0.96 : 1);
    glowOpacity.value = withTiming(active ? 1 : 0, { duration: 150 });
    if (!active && !isDesktop) {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    }
  };

  const handleMove = (event: any) => {
    const x =
      Platform.OS === 'web'
        ? event.nativeEvent.offsetX
        : event.nativeEvent.locationX;
    const y =
      Platform.OS === 'web'
        ? event.nativeEvent.offsetY
        : event.nativeEvent.locationY;

    if (layout.width > 0 && layout.height > 0) {
      rotateX.value = interpolate(
        y,
        [0, layout.height],
        [12, -12],
        Extrapolation.CLAMP,
      );
      rotateY.value = interpolate(
        x,
        [0, layout.width],
        [-12, 12],
        Extrapolation.CLAMP,
      );
    }
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(200 + index * 100).springify()}
      style={[
        styles.container,
        { width: isDesktop ? '48%' : '100%' },
        animatedStyle,
      ]}
      onLayout={(e: LayoutChangeEvent) => setLayout(e.nativeEvent.layout)}
    >
      <Pressable
        style={styles.innerContent}
        onHoverIn={() => isDesktop && handleInteraction(true)}
        onHoverOut={() => isDesktop && handleInteraction(false)}
        onPressIn={() => handleInteraction(true)}
        onPressOut={() => handleInteraction(false)}
        // @ts-ignore - React Native Web internal prop
        onPointerMove={isDesktop ? handleMove : undefined}
        onTouchMove={!isDesktop ? handleMove : undefined}
      >
        <View style={styles.iconBox}>
          <Icon size={24} stroke={NORTH_THEME.colors.accent.cyan} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.desc}</Text>
      </Pressable>
    </Animated.View>
  );
});

BentoCard.displayName = 'BentoCard';

const styles = StyleSheet.create({
  container: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  innerContent: { padding: 32, minHeight: 200, justifyContent: 'flex-start' },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  title: {
    color: NORTH_THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  desc: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
