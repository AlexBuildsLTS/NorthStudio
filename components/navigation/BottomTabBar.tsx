/**
 * @file components/navigation/BottomTabBar.tsx
 * @description Custom Mobile Bottom Navigation. High-performance, APK-safe (No BlurView).
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Home,
  Layers,
  MonitorPlay,
  Image as ImageIcon,
} from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BottomTabBar = memo(
  ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();

    return (
      <View
        style={[
          styles.container,
          // Dynamically adjust bottom padding based on device safe area
          { bottom: Platform.OS === 'ios' ? insets.bottom || 24 : 16 },
        ]}
      >
        {/* APK-SAFE GLASSMORPHISM: 
        Replaces expo-blur. Uses a solid dark color with 85% opacity 
        and a subtle white border to create depth without native crashing.
      */}
        <View style={[StyleSheet.absoluteFill, styles.glassBackground]} />

        <View style={styles.content}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            // Determine Icon based on route name
            let Icon = Home;
            if (route.name === 'assets') Icon = Layers;
            if (route.name === 'studio') Icon = MonitorPlay;
            if (route.name === 'gallery') Icon = ImageIcon;

            const color = isFocused ? '#00F0FF' : '#64748B';

            // Special rendering for the Studio tab (Center FAB)
            if (route.name === 'studio') {
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={styles.studioFabWrapper}
                >
                  <View
                    style={[
                      styles.studioFab,
                      isFocused && styles.studioFabActive,
                    ]}
                  >
                    <Icon size={24} color="#FFF" />
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.6}
                style={styles.tabItem}
              >
                <Icon size={24} color={color} />
                <Text style={[styles.tabLabel, { color }]}>
                  {options.title !== undefined ? options.title : route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

// Explicitly set displayName for memoized component debugging
BottomTabBar.displayName = 'BottomTabBar';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    // Elevate the tab bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  glassBackground: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Tailwind Slate 900 w/ 85% opacity
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 35,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  studioFabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -15 }], // Pop out slightly above the bar
  },
  studioFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B', // Tailwind Slate 800
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(176, 38, 255, 0.5)', // Muted Accent
  },
  studioFabActive: {
    backgroundColor: '#B026FF', // Brand Accent
    borderColor: '#00F0FF', // Cyan Glow
    shadowColor: '#B026FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
});
