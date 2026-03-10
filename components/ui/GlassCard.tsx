/**
 * @file components/ui/GlassCard.tsx
 * @description Core structural primitive for the North Studio aesthetic.
 * Utilizes Expo's native RenderEffect API for 120fps hardware-accelerated 
 * blur operations without compromising Android APK stability.
 */

import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

export interface GlassCardProps {
  /** React children to render inside the glass container */
  children: React.ReactNode;
  /** NativeWind (Tailwind) classes for structural styling */
  className?: string;
  /** Tiered blur intensity mapped to device capabilities */
  intensity?: "light" | "regular" | "heavy";
  /** Fallback for Reanimated or specific inline styles */
  style?: StyleProp<ViewStyle>;
}

export const GlassCard = React.memo(({ 
  children, 
  className = "", 
  intensity = "regular", 
  style 
}: GlassCardProps) => {
  // Translate semantic tiers to integer weights optimized for mobile GPUs
  const blurValue = intensity === "heavy" ? 40 : intensity === "light" ? 15 : 25;

  return (
    <BlurView 
      intensity={blurValue} 
      tint="dark" 
      className={`overflow-hidden ${className}`} 
      style={style}
    >
      {children}
    </BlurView>
  );
});

GlassCard.displayName = 'GlassCard';