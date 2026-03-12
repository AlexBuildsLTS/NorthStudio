/**
 * @file components/navigation/TopBar.tsx
 * @description Master 10x Top Navigation. Integrates Profile logic, RBAC, and Haptics.
 * No separate dropdown file—fully encapsulated for performance.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  User,
  Settings,
  LogOut,
  ShieldAlert,
  LifeBuoy,
  Edit,
} from 'lucide-react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// --- STORES & THEME ---
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { NORTH_THEME } from '@/constants/theme';

const APP_ICON = require('@/assets/images/icon.png');

export const TopBar: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Global State
  const { session, signOut } = useAuthStore();
  const { profile } = useUserStore();

  // Local State for Dropdown
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const avatarRef = useRef<View>(null);

  // Animation Shared Values
  const avatarScale = useSharedValue(1);

  // Role Validation
  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator';

  // Toggle Logic with Coordinate Capture
  const toggleDropdown = () => {
    if (avatarRef.current) {
      avatarRef.current.measure((fx, fy, width, height, px, py) => {
        setAnchor({ x: px, y: py + height });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setVisible(!visible);
      });
    }
  };

  const handleNavigate = (
    path: string,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  ) => {
    Haptics.impactAsync(hapticStyle);
    setVisible(false);
    router.push(path as any);
  };

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVisible(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(avatarScale.value) }],
  }));

  // =============================================================
  // 👤 RENDER MENU ITEMS
  // =============================================================
  const renderMenuItems = () => {
    const items = [
      {
        icon: User,
        label: 'Profile',
        path: '/(app)/settings',
        color: NORTH_THEME.colors.accent.cyan,
      },
      {
        icon: LifeBuoy,
        label: 'Support',
        path: '/(app)/support',
        color: '#3b82f6',
      },
    ];

    if (isStaff) {
      items.push({
        icon: ShieldAlert,
        label: 'Admin Console',
        path: '/(app)/support',
        color: '#10b981',
      });
    }

    items.push({
      icon: Settings,
      label: 'Settings',
      path: '/(app)/settings',
      color: '#94a3b8',
    });

    return (
      <View style={styles.menuContainer}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.menuItem}
            onPress={() => handleNavigate(item.path)}
          >
            <item.icon size={18} color={item.color} />
            <Text style={styles.menuText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.menuItem, styles.destructiveItem]}
          onPress={handleSignOut}
        >
          <LogOut size={18} color={NORTH_THEME.colors.accent.pink} />
          <Text
            style={[styles.menuText, { color: NORTH_THEME.colors.accent.pink }]}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.topBarContainer}>
      {/* 1. BRAND LOGO */}
      <Pressable onPress={() => router.push('/(app)/dashboard')}>
        <Image source={APP_ICON} style={styles.logo} />
      </Pressable>

      {/* 2. ACTIONS & AVATAR */}
      <View style={styles.rightSection}>
        <View style={styles.creditsBox}>
          <Text style={styles.creditsText}>Credits: ∞</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={20} color="#94A3B8" />
        </TouchableOpacity>

        <View ref={avatarRef}>
          <Animated.View style={avatarAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleDropdown}
              onPressIn={() => (avatarScale.value = 0.9)}
              onPressOut={() => (avatarScale.value = 1)}
              style={styles.avatarCircle}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* 3. MODAL DROPDOWN (10x Encapsulation) */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            style={[
              styles.dropdownContent,
              {
                top: anchor.y + 10,
                right: isDesktop ? width - anchor.x - 40 : 20,
              },
            ]}
          >
            {Platform.OS === 'ios' ? (
              <BlurView
                tint="dark"
                intensity={90}
                style={StyleSheet.absoluteFill}
              >
                {renderUserInfo(profile, session)}
                {renderMenuItems()}
              </BlurView>
            ) : (
              <View style={styles.androidFallback}>
                {renderUserInfo(profile, session)}
                {renderMenuItems()}
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

// Internal Helper for Dropdown User Info
const renderUserInfo = (profile: any, session: any) => (
  <View style={styles.userInfoHeader}>
    <Text style={styles.userName} numberOfLines={1}>
      {profile?.full_name || profile?.username || 'Creator'}
    </Text>
    <Text style={styles.userEmail} numberOfLines={1}>
      {session?.user?.email}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  topBarContainer: {
    height: 70,
    backgroundColor: 'rgba(2, 1, 10, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 1000,
  },
  logo: { width: 34, height: 34 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  creditsBox: {
    backgroundColor: 'rgba(13, 2, 33, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    shadowColor: 'rgba(0, 240, 255, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  creditsText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: { padding: 4 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(176, 38, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: NORTH_THEME.colors.accent.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: {
    color: NORTH_THEME.colors.accent.purple,
    fontWeight: '900',
    fontSize: 16,
  },

  // Dropdown
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  dropdownContent: {
    position: 'absolute',
    width: 260,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  androidFallback: { backgroundColor: '#0D0221', flex: 1 },
  userInfoHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  userName: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  userEmail: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  menuContainer: { padding: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  menuText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 8,
  },
  destructiveItem: { backgroundColor: 'rgba(255, 51, 102, 0.05)' },
});
