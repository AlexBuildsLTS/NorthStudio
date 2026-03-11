/**
 * @file components/navigation/TopBar.tsx
 * @description 2026 Modern Top Navigation. Corrected store mapping and variable definitions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  ShieldAlert,
  LifeBuoy,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore'; // Import this to get the profile data

const APP_ICON = require('@/assets/images/icon.png');

interface TopBarProps {
  onOpenSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar }) => {
  const router = useRouter();

  // 1. Get session from AuthStore
  const { session, signOut } = useAuthStore();
  // 2. Get profile from UserStore (where your actual roles/credits live)
  const { profile } = useUserStore();

  // Local alias for easier template usage
  const user = session?.user;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const logoScale = useSharedValue(1);
  const avatarScale = useSharedValue(1);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const animatePressIn = (sv: any) => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sv.value = withSpring(0.9);
  };
  const animatePressOut = (sv: any) => (sv.value = withSpring(1));

  const handleSignOut = async () => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDropdownOpen(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleNavigate = (route: string) => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDropdownOpen(false);
    router.push(route as any);
  };

  // Check roles from the profile object
  const isStaff =
    profile?.role === 'admin' ||
    profile?.role === 'moderator' ||
    profile?.role === 'premium';

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onOpenSidebar && (
          <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        <Animated.View style={logoStyle}>
          <TouchableOpacity
            onPressIn={() => animatePressIn(logoScale)}
            onPressOut={() => animatePressOut(logoScale)}
            activeOpacity={1}
            style={styles.logoWrapper}
          >
            <Image
              source={APP_ICON}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={20} color="#94A3B8" />
        </TouchableOpacity>

        <View style={{ zIndex: 100 }}>
          <Animated.View style={avatarStyle}>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== 'web')
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDropdownOpen(!dropdownOpen);
              }}
              onPressIn={() => animatePressIn(avatarScale)}
              onPressOut={() => animatePressOut(avatarScale)}
              activeOpacity={1}
              style={styles.avatarButton}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {profile?.full_name?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase() ||
                      'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {dropdownOpen && (
            <>
              <Pressable
                style={styles.fullscreenOverlay}
                onPress={() => setDropdownOpen(false)}
              />

              <Animated.View
                entering={FadeInUp.duration(200).springify()}
                exiting={FadeOutUp.duration(200)}
                style={styles.dropdownContainer}
              >
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownName} numberOfLines={1}>
                    {profile?.full_name || user?.email || 'Creator'}
                  </Text>
                  <Text style={styles.dropdownEmail} numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>

                <View style={styles.dropdownDivider} />

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigate('/(app)/settings/profile')}
                >
                  <User size={16} color="#00F0FF" />
                  <Text style={styles.dropdownItemText}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigate('/(app)/support')}
                >
                  <LifeBuoy size={16} color="#3b82f6" />
                  <Text style={styles.dropdownItemText}>Support</Text>
                </TouchableOpacity>

                {isStaff && (
                  <>
                    <View style={styles.dropdownDivider} />
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleNavigate('/(app)/admin')}
                    >
                      <ShieldAlert size={16} color="#10b981" />
                      <Text style={styles.dropdownItemText}>Admin Console</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.dropdownDivider} />

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleNavigate('/(app)/settings')}
                >
                  <Settings size={16} color="#94A3B8" />
                  <Text style={styles.dropdownItemText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dropdownItem, styles.destructiveBg]}
                  onPress={handleSignOut}
                >
                  <LogOut size={16} color="#EF4444" />
                  <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: 'rgba(10, 13, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuButton: { padding: 4 },
  logoWrapper: { justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 36, height: 36 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 100,
  },
  avatarButton: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(176, 38, 255, 0.4)',
    overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(176, 38, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: '#B026FF', fontWeight: 'bold', fontSize: 16 },
  fullscreenOverlay: {
    position: 'absolute',
    top: -100,
    left: -500,
    right: -500,
    bottom: -1000,
    zIndex: 99,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 240,
    backgroundColor: '#0F121C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: { padding: 16 },
  dropdownName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  dropdownEmail: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  dropdownDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  dropdownItemText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  destructiveBg: { backgroundColor: 'rgba(239, 68, 68, 0.05)' },
});
