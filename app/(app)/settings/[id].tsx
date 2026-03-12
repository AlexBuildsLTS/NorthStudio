/**
 * @file app/(app)/settings/index.tsx
 * @description AAA+ Master Settings Hub.
 * - Implemented flexShrink for strict mobile adaptability.
 * - Bound to Zustand stores (useAuthStore, useUserStore) to drop legacy context.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  Lock,
  Fingerprint,
  Bell,
  Moon,
  Shield,
  ChevronRight,
  User,
  LogOut,
  CreditCard,
  LifeBuoy,
  ChevronLeft,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// --- STORES & COMPONENTS ---
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { NORTH_THEME } from '@/constants/theme';

// ============================================================================
// SUB-COMPONENT: REUSABLE MOBILE-ADAPTIVE MENU ITEM
// ============================================================================
interface SettingsMenuItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | boolean;
  onPress?: () => void;
  showChevron?: boolean;
  rightComponent?: React.ReactNode;
  color?: string;
  isDestructive?: boolean;
}

const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  icon: Icon,
  label,
  value,
  onPress,
  showChevron = true,
  rightComponent,
  color = NORTH_THEME.colors.accent.cyan,
  isDestructive = false,
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        if (onPress) {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          onPress();
        }
      }}
      style={styles.menuItem}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDestructive
                ? 'rgba(239, 68, 68, 0.1)'
                : `${color}1A`, // 10% opacity
            },
          ]}
        >
          <Icon
            size={18}
            color={isDestructive ? NORTH_THEME.colors.status.danger : color}
          />
        </View>

        {/* flexShrink prevents long text from pushing UI off-screen on narrow devices */}
        <View style={styles.menuTextContainer}>
          <Text
            style={[
              styles.menuLabel,
              isDestructive && { color: NORTH_THEME.colors.status.danger },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {value && typeof value === 'string' && (
            <Text style={styles.menuValue} numberOfLines={1}>
              {value}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.menuItemRight}>
        {rightComponent ||
          (showChevron && (
            <ChevronRight size={16} color={NORTH_THEME.colors.text.muted} />
          ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT: SETTINGS HUB
// ============================================================================
export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuthStore();
  const { profile } = useUserStore();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const role = profile?.role || 'member';
  const isStaff = role === 'admin' || role === 'moderator';
  const isPremium = role === 'premium' || isStaff;

  const handleSignOut = async () => {
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Disconnect', 'Terminate secure session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const stagger = (index: number) => 50 * index;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* UNIVERSAL COSMIC BACKGROUND */}
      <LinearGradient
        colors={['#050110', '#0D0221', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerIconBox}>
            <SlidersHorizontal size={18} color="#FFF" />
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* PROFILE CARD */}
          <Animated.View entering={FadeInDown.delay(stagger(1)).springify()}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push('/(app)/settings/profile');
              }}
            >
              <GlassCard intensity="heavy" style={styles.profileCard}>
                <View style={styles.profileRow}>
                  <View style={styles.avatarContainer}>
                    {profile?.avatar_url ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.profileTextWrap}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {profile?.full_name ||
                        profile?.username ||
                        'Studio Operator'}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                      {session?.user?.email}
                    </Text>

                    <View
                      style={[
                        styles.badge,
                        {
                          borderColor: isStaff
                            ? NORTH_THEME.colors.status.success
                            : NORTH_THEME.colors.border.glass,
                        },
                      ]}
                    >
                      {isStaff ? (
                        <ShieldAlert
                          size={10}
                          color={NORTH_THEME.colors.status.success}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.badgeText,
                          isStaff && {
                            color: NORTH_THEME.colors.status.success,
                          },
                        ]}
                      >
                        {role.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <ChevronRight
                    size={20}
                    color={NORTH_THEME.colors.text.muted}
                  />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>

          {/* GENERAL SECTION */}
          <Animated.View entering={FadeInDown.delay(stagger(2)).springify()}>
            <SectionHeader title="IDENTITY MATRIX" />
            <GlassCard intensity="medium" style={styles.menuGroup}>
              <SettingsMenuItem
                icon={User}
                label="Edit Identity"
                onPress={() => router.push('/(app)/settings/profile')}
                color={NORTH_THEME.colors.accent.purple}
              />
              <SettingsMenuItem
                icon={CreditCard}
                label="Subscription Plan"
                value={isPremium ? 'PRO TIER' : 'FREE TIER'}
                onPress={() => {}}
                color={NORTH_THEME.colors.status.warning}
              />
            </GlassCard>
          </Animated.View>

          {/* PREFERENCES SECTION */}
          <Animated.View entering={FadeInDown.delay(stagger(3)).springify()}>
            <SectionHeader title="ENVIRONMENT" />
            <GlassCard intensity="medium" style={styles.menuGroup}>
              <SettingsMenuItem
                icon={Bell}
                label="System Notifications"
                showChevron={false}
                rightComponent={
                  <Switch
                    value={notifications}
                    onValueChange={(v) => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setNotifications(v);
                    }}
                    trackColor={{
                      false: 'rgba(255,255,255,0.1)',
                      true: NORTH_THEME.colors.accent.cyan,
                    }}
                    thumbColor="#FFF"
                  />
                }
              />
            </GlassCard>
          </Animated.View>

          {/* SECURITY SECTION */}
          <Animated.View entering={FadeInDown.delay(stagger(4)).springify()}>
            <SectionHeader title="SECURITY PROTOCOLS" />
            <GlassCard intensity="medium" style={styles.menuGroup}>
              <SettingsMenuItem
                icon={Lock}
                label="Change Password"
                onPress={() => router.push('/(app)/settings/change-password')}
                color={NORTH_THEME.colors.status.success}
              />
              <SettingsMenuItem
                icon={Fingerprint}
                label="Hardware Biometrics"
                onPress={() => router.push('/(app)/settings/biometric')}
                color={NORTH_THEME.colors.status.success}
              />
            </GlassCard>
          </Animated.View>

          {/* DANGER ZONE */}
          <Animated.View
            entering={FadeInDown.delay(stagger(5)).springify()}
            style={styles.logoutWrapper}
          >
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={handleSignOut}
            >
              <LogOut size={18} color={NORTH_THEME.colors.status.danger} />
              <Text style={styles.logoutText}>Disconnect Session</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>NORTH STUDIO OS v2.4</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ============================================================================
// STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050110' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    maxWidth: 800,
    marginHorizontal: 'auto',
    width: '100%',
  },

  // PROFILE CARD
  profileCard: { marginBottom: 24, padding: 20, borderRadius: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.accent.purple,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: NORTH_THEME.colors.accent.purple,
  },
  profileTextWrap: { flex: 1, flexShrink: 1 },
  profileName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  profileEmail: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // SECTIONS
  sectionHeader: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
    marginTop: 16,
  },
  menuGroup: { borderRadius: 24, overflow: 'hidden', padding: 8 },

  // MENU ITEMS
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: { flex: 1, flexShrink: 1 },
  menuLabel: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  menuValue: {
    fontSize: 11,
    color: NORTH_THEME.colors.text.muted,
    marginTop: 2,
    fontWeight: '700',
  },
  menuItemRight: { paddingLeft: 8 },

  // LOGOUT
  logoutWrapper: { marginTop: 24, paddingHorizontal: 4 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: NORTH_THEME.colors.status.danger,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  versionText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 1.5,
  },
});
