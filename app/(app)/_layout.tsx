/**
 * @file app/(app)/_layout.tsx
 * * FEATURES:
 * 1. Hardware Keyboard Management: Dynamically adjusts padding
 * 2. AppState Synchronization: Refreshes Supabase session & user profile when app returns from background.
 * 3. Integrated Error Boundary: Catches React render crashes gracefully without white-screening the app.
 * 4. Responsive Layout Engine: Seamlessly toggles Sidebar (Desktop) and BottomBar (Mobile).
 * 5. Route Registration: Safely registers all (app) routes (Settings, Support) while hiding them from the Tab UI.
 * 6. High-Performance Boot Screen: 120fps native-thread
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Keyboard,
  KeyboardEvent,
  AppState,
  AppStateStatus,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Redirect, Tabs, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// --- ICONS ---
import {
  AlertTriangle,
  RefreshCcw,
  ShieldAlert,
  Layers,
} from 'lucide-react-native';

// --- STORES & THEME ---
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { NORTH_THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabase/client';

// --- UI COMPONENTS ---
import { TopBar } from '@/components/navigation/TopBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { GlassCard } from '@/components/ui/GlassCard';

const APP_ICON = require('@/assets/images/icon.png');

// ============================================================================
// 1. CUSTOM HOOKS (Hardware & State Management)
// ============================================================================

const useKeyboardPadding = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: KeyboardEvent) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onKeyboardHide = () => setKeyboardHeight(0);

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
};

const useAppStateSync = (
  fetchProfile: (id: string) => Promise<void>,
  userId?: string,
) => {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && userId) {
          await fetchProfile(userId);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [fetchProfile, userId]);
};

// ============================================================================
// 2. ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class NorthErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[NorthStudio Crash]:', error, errorInfo);
  }

  handleReset = () => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={[NORTH_THEME.colors.background.primary, '#1a0510']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.errorContent}
          >
            <View style={styles.errorIconCircle}>
              <ShieldAlert size={48} color={NORTH_THEME.colors.accent.pink} />
            </View>
            <Text style={styles.errorTitle}>System Fault Detected</Text>
            <Text style={styles.errorSubtitle}>
              The studio engine encountered an unexpected runtime error. Your
              project state has been preserved.
            </Text>
            <GlassCard intensity="heavy" style={styles.errorLogCard}>
              <Text style={styles.errorLogText} numberOfLines={4}>
                {this.state.error?.message ||
                  'Unknown rendering exception occurred in the React tree.'}
              </Text>
            </GlassCard>
            <TouchableOpacity
              style={styles.errorBtn}
              onPress={this.handleReset}
            >
              <RefreshCcw size={18} color="#FFF" />
              <Text style={styles.errorBtnText}>Reboot Engine</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 3. HIGH-PERFORMANCE LOADING SCREEN
// ============================================================================

const NorthBootScreen = () => {
  // Shared values strictly mapped to native driver for 120fps performance
  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Initial entrance pop
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
    scale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.elastic(1.2),
    });

    // Infinite ambient floating physics
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    // Infinite ambient glowing physics
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  return (
    <View style={styles.bootContainer}>
      <LinearGradient
        colors={[NORTH_THEME.colors.background.primary, '#0A0A14']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.bootContent}>
        {/* Glow Element */}
        <Animated.View style={[styles.glowRing, animatedGlowStyle]} />

        {/* Core Icon */}
        <Animated.View style={[styles.brandIconBox, animatedIconStyle]}>
          <Image
            source={APP_ICON}
            style={styles.appIconImage}
            contentFit="contain"
            transition={300}
            cachePolicy="memory"
          />
        </Animated.View>

        {/* Staggered Text Entrance */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(800).springify()}
          style={styles.textContainer}
        >
          <View style={styles.badgeContainer}>
            <Layers size={14} color={NORTH_THEME.colors.accent.cyan} />
            <Text style={styles.headerBadgeText}>Initializing Engine</Text>
          </View>
          <Text style={styles.bootSub}>
            Decrypting Vault & Mounting Canvas...
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

// ============================================================================
// 4. MAIN LAYOUT CONTROLLER
// ============================================================================

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardPadding();

  const { session, isInitialized, initialize } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (session?.user?.id && !profile) fetchProfile(session.user.id);
  }, [session, profile, fetchProfile]);

  useAppStateSync(fetchProfile, session?.user?.id);

  if (!isInitialized) return <NorthBootScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;

  const dynamicBottomPadding = isDesktop
    ? 0
    : keyboardHeight > 0
      ? keyboardHeight
      : 90;
  const isImmersiveMode = pathname.includes('/studio');

  return (
    <NorthErrorBoundary>
      <View style={styles.masterLayout}>
        <StatusBar style="light" />
        <LinearGradient
          colors={[
            NORTH_THEME.colors.background.primary,
            NORTH_THEME.colors.background.secondary,
            '#000000',
          ]}
          style={StyleSheet.absoluteFill}
        />

        {!isImmersiveMode && <TopBar />}

        <View
          style={[
            styles.contentArea,
            { paddingTop: isImmersiveMode ? insets.top : 0 },
          ]}
        >
          {isDesktop && !isImmersiveMode && <Sidebar />}

          <View
            style={[styles.mainCanvas, { paddingBottom: dynamicBottomPadding }]}
          >
            <Tabs
              tabBar={(props) => {
                if (isDesktop || keyboardHeight > 0 || isImmersiveMode)
                  return null;
                return <BottomTabBar />;
              }}
              screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                sceneStyle: { backgroundColor: 'transparent' },
                animation: 'shift',
              }}
            >
              <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
              <Tabs.Screen name="vault" options={{ title: 'Vault' }} />
              <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
              <Tabs.Screen name="gallery" options={{ title: 'Gallery' }} />
              <Tabs.Screen
                name="settings"
                options={{ title: 'Settings', href: null }}
              />
              <Tabs.Screen
                name="support"
                options={{ title: 'Support', href: null }}
              />
              {/* Registered empty endpoints to prevent route crashes */}
              <Tabs.Screen name="admin" options={{ href: null }} />
              <Tabs.Screen name="messages" options={{ href: null }} />
            </Tabs>
          </View>
        </View>
      </View>
    </NorthErrorBoundary>
  );
}

// ============================================================================
// 5. STYLESHEET
// ============================================================================

const styles = StyleSheet.create({
  masterLayout: {
    flex: 1,
    backgroundColor: NORTH_THEME.colors.background.primary,
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
  },
  mainCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  bootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NORTH_THEME.colors.background.primary,
  },
  bootContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  brandIconBox: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: NORTH_THEME.colors.accent.cyan,
    filter: Platform.OS === 'web' ? 'blur(40px)' : undefined,
    zIndex: 1,
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  headerBadgeText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bootSub: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorLogCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.border.glass,
    marginBottom: 32,
  },
  errorLogText: {
    color: NORTH_THEME.colors.accent.pink,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: NORTH_THEME.colors.accent.pink,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    elevation: 6,
  },
  errorBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
