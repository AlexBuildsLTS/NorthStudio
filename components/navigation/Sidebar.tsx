/**
 * @file components/navigation/Sidebar.tsx
 * @description Desktop/Tablet Navigation Rail. Uses Reanimated for smooth expand/collapse.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Layers, MonitorPlay, Image as ImageIcon, Menu, ChevronLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { NORTH_THEME } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/(app)/dashboard', icon: Home },
  { name: 'Asset Vault', path: '/(app)/assets', icon: Layers },
  { name: 'Studio Engine', path: '/(app)/studio', icon: MonitorPlay },
  { name: 'Gallery', path: '/(app)/gallery', icon: ImageIcon },
];

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const sidebarWidth = useSharedValue(260);
  const textOpacity = useSharedValue(1);

  const toggleSidebar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    sidebarWidth.value = withSpring(nextExpanded ? 260 : 80, { damping: 20, stiffness: 200 });
    textOpacity.value = withTiming(nextExpanded ? 1 : 0, { duration: 150 });
  };

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    display: textOpacity.value === 0 ? 'none' : 'flex',
  }));

  return (
    <Animated.View style={[styles.container, animatedSidebarStyle]}>
      {/* Header / Toggle */}
      <View style={styles.header}>
        <Animated.View style={animatedTextStyle}>
          <Text style={styles.brandText}>North<Text style={{ color: '#00F0FF' }}>Studio</Text></Text>
        </Animated.View>
        <TouchableOpacity onPress={toggleSidebar} style={styles.toggleBtn}>
          {isExpanded ? <ChevronLeft size={20} color="#94A3B8" /> : <Menu size={20} color="#94A3B8" />}
        </TouchableOpacity>
      </View>

      {/* Navigation Links */}
      <View style={styles.navContainer}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.includes(item.path.replace('/(app)', ''));
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(item.path as any);
              }}
            >
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <Icon size={20} color={isActive ? '#FFF' : '#94A3B8'} />
              </View>
              <Animated.View style={[styles.textWrapper, animatedTextStyle]}>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Text>
              </Animated.View>
              
              {/* Studio Highlight Indicator */}
              {item.name === 'Studio Engine' && isActive && isExpanded && (
                 <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    paddingTop: Platform.OS === 'web' ? 20 : 40,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
    height: 40,
  },
  brandText: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  toggleBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  navContainer: { paddingHorizontal: 12, gap: 8 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 12,
  },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  iconBoxActive: { backgroundColor: '#B026FF', shadowColor: '#B026FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  textWrapper: { flex: 1 },
  navText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  navTextActive: { color: '#FFF', fontWeight: '800' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00F0FF' }
});