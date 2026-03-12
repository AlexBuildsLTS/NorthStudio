/**
 * @file app/(app)/dashboard.tsx
 * @description High-Fidelity Bento Dashboard.

 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {
  Wand2,
  Image as ImageIcon,
  ArrowRight,
  Zap,
  Activity,
  History,
  Layers,
  ShieldCheck,
  Cpu,
  Database,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/components/ui/GlassCard';
import { NORTH_THEME } from '@/constants/theme';
import { useUserStore } from '@/store/useUserStore';

const PulseDot = () => {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.pulseDot, style]} />;
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { profile } = useUserStore();
  const isDesktop = width >= 1024;

  const handleNavigate = (path: string) => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(path as any);
  };

  const stagger = (index: number) => 100 * index;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Animated.View entering={FadeInDown.delay(stagger(1))}>
          <Text style={styles.welcomeLabel}>WELCOME</Text>
          <Text style={styles.userName}>
            {profile?.username || 'AdminHost'}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInRight.delay(stagger(2))}
          style={styles.systemStatus}
        >
          <PulseDot />
          <Text style={styles.systemStatusText}>ENGINE V2.4: ONLINE</Text>
        </Animated.View>
      </View>

      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {/* HERO CARD: STUDIO */}
        <Animated.View
          entering={FadeInDown.delay(stagger(3))}
          style={[styles.gridItem, isDesktop && styles.heroItem]}
        >
          <GlassCard
            interactive
            intensity="heavy"
            onPress={() => handleNavigate('/(app)/studio')}
            style={styles.cardFill}
          >
            <LinearGradient
              colors={['rgba(0, 240, 255, 0.08)', 'rgba(176, 38, 255, 0.03)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroTop}>
                <View style={styles.heroBadge}>
                  <Zap size={14} color={NORTH_THEME.colors.accent.cyan} />
                  <Text style={styles.heroBadgeText}>AI PERSPECTIVE WRAP</Text>
                </View>
                <Wand2 size={32} color={NORTH_THEME.colors.accent.cyan} />
              </View>
              <View>
                <Text style={styles.heroTitle}>Studio Engine</Text>
                <Text style={styles.heroDesc}>
                  Initialize high-performance rendering canvas. Composite logos
                  with realistic lighting and shadows.
                </Text>
              </View>
              <View style={styles.heroFooter}>
                <Text style={styles.heroActionText}>LAUNCH INTERFACE</Text>
                <ArrowRight size={18} color={NORTH_THEME.colors.accent.cyan} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* STATS COLUMN */}
        <View
          style={[styles.statsColumn, isDesktop && styles.statsColumnDesktop]}
        >
          <Animated.View
            entering={FadeInDown.delay(stagger(4))}
            style={styles.miniGridItem}
          >
            <GlassCard intensity="medium" style={styles.cardFill}>
              <View style={styles.statContent}>
                <View style={styles.ccIconContainer}>
                  <View style={styles.ccIconCircle} />
                  <View
                    style={[
                      styles.ccIconCircle,
                      { left: 10, backgroundColor: 'rgba(0, 240, 255, 0.5)' },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{profile?.credits || '10'}</Text>
                <Text style={styles.statLabel}>REMAINING CREDITS</Text>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(stagger(5))}
            style={styles.miniGridItem}
          >
            <GlassCard intensity="medium" style={styles.cardFill}>
              <View style={styles.statContent}>
                <Layers size={20} color={NORTH_THEME.colors.accent.purple} />
                <Text style={styles.statValue}>
                  {profile?.total_renders || '0'}
                </Text>
                <Text style={styles.statLabel}>TOTAL RENDERS</Text>
              </View>
            </GlassCard>
          </Animated.View>
        </View>

        {/* ASSET VAULT */}
        <Animated.View
          entering={FadeInDown.delay(stagger(6))}
          style={styles.gridItem}
        >
          <GlassCard
            interactive
            intensity="medium"
            onPress={() => handleNavigate('/(app)/assets')}
            style={styles.cardFill}
          >
            <View style={styles.vaultContent}>
              <View style={styles.iconBox}>
                <ImageIcon size={24} color={NORTH_THEME.colors.accent.purple} />
              </View>
              <Text style={styles.vaultTitle}>Asset Vault</Text>
              <Text style={styles.vaultDesc}>
                Sync branding kits and base products.
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '65%' }]} />
              </View>
              <Text style={styles.vaultMeta}>STORAGE: 650MB / 1GB</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* SYSTEM MONITOR */}
        <Animated.View
          entering={FadeInDown.delay(stagger(7))}
          style={styles.gridItem}
        >
          <GlassCard intensity="light" style={styles.cardFill}>
            <View style={styles.monitorContent}>
              <View style={styles.monitorHeader}>
                <Activity size={16} color={NORTH_THEME.colors.status.success} />
                <Text style={styles.monitorTitle}>SYSTEM MONITOR</Text>
              </View>
              <View style={styles.monitorLine}>
                <Cpu size={12} color={NORTH_THEME.colors.text.muted} />
                <Text style={styles.monitorText}>
                  AI CLUSTER: ACTIVE (0.4ms)
                </Text>
              </View>
              <View style={styles.monitorLine}>
                <Database size={12} color={NORTH_THEME.colors.text.muted} />
                <Text style={styles.monitorText}>SUPABASE: SYNCED</Text>
              </View>
              <View style={styles.monitorLine}>
                <ShieldCheck size={12} color={NORTH_THEME.colors.text.muted} />
                <Text style={styles.monitorText}>ENCRYPTION: AES-256</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  }, // Padding bottom ensures cards don't hide behind BottomBar
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  welcomeLabel: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  userName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  systemStatusText: {
    color: NORTH_THEME.colors.status.success,
    fontSize: 10,
    fontWeight: '800',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NORTH_THEME.colors.status.success,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridDesktop: {},
  gridItem: { flexBasis: '100%', minHeight: 200 },
  cardFill: { flex: 1 },
  heroItem: { flexBasis: 'calc(66% - 8px)' as any, minHeight: 420 },
  heroContent: { flex: 1, justifyContent: 'space-between' },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  heroBadgeText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 10,
    fontWeight: '900',
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroDesc: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 450,
  },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsColumn: { flexBasis: '100%', gap: 16 },
  statsColumnDesktop: { flexBasis: 'calc(33% - 8px)' as any },
  miniGridItem: { height: 202 },
  statContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statValue: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  statLabel: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  vaultContent: { flex: 1 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
  },
  vaultTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  vaultDesc: {
    color: NORTH_THEME.colors.text.secondary,
    fontSize: 13,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: NORTH_THEME.colors.accent.purple,
    borderRadius: 2,
  },
  vaultMeta: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  monitorContent: { flex: 1, gap: 12 },
  monitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  monitorTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  monitorLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monitorText: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ccIconContainer: {
    width: 30,
    height: 20,
    position: 'relative',
    marginBottom: 10,
  },
  ccIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(176, 38, 255, 0.5)',
    position: 'absolute',
  },
});
