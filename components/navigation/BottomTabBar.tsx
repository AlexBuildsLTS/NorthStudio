/**
 * @file components/navigation/BottomTabBar.tsx
 * @description Master AAA+ Floating Navigation.
 * FIXES: Absolute environment-aware anchoring to kill the "Black Box" bug.
 */

import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
//import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout, Box, Wand2, History, Vault } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { NORTH_THEME } from '@/constants/theme';

const TabButton = ({ tab, isActive, onPress }: any) => {
  const scale = useSharedValue(1);
  const Icon = tab.icon;

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value, { damping: 10, stiffness: 200 }) },
    ],
  }));

  const handlePressIn = () => {
    scale.value = 0.88;
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={() => (scale.value = 1)}
      onPress={onPress}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          isActive && styles.activeIconWrapper,
          animStyle,
        ]}
      >
        <Icon
          size={22}
          color={isActive ? '#00F0FF' : '#64748B'}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
        {tab.name}
      </Text>
      {isActive && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
};

export const BottomTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Hide on desktop viewports
  if (width >= 1024) return null;

  const tabs = [
    { name: 'Dashboard', icon: Layout, route: '/(app)/dashboard' },
    { name: 'Vault', icon: Vault, route: '/(app)/vault' },
    { name: 'Studio', icon: Wand2, route: '/(app)/studio' },
    { name: 'Gallery', icon: History, route: '/(app)/gallery' },
  ];

  // THE ULTIMATE ANCHOR MATH:
  // iOS has physical home bars (insets.bottom > 0). We respect it but add a 10px hover.
  // Android/Web often report 0 or incorrect safe areas. We force a strict 24px float.
  const bottomAnchor = Platform.select({
     ios: insets.bottom > 0 ? insets.bottom + 10 : 34,
     android: -44,
     default: -84,
   });
   

  return (
    <View style={[styles.outerWrapper, { bottom: bottomAnchor }]}>
      <View style={styles.container}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = pathname.includes(tab.route.replace('/(app)', ''));
            return (
              <TabButton
                key={tab.route}
                tab={tab}
                isActive={isActive}
                onPress={() => router.push(tab.route as any)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    height: 70,
    backgroundColor: 'rgba(2, 1, 10, 0.8)', // Deep Obsidian transparency
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  iconWrapper: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeIconWrapper: { backgroundColor: 'rgba(0, 240, 255, 0.08)' },
  tabLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 2 },
  activeTabLabel: { color: '#FFF', fontWeight: '800' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00F0FF',
    position: 'absolute',
    bottom: 4,
  },
});
