/**
 * @file components/dashboard/LiveTelemetry.tsx
 * @description Real-Time System Telemetry & Resource Monitor.
 * @features
 * - 120fps Reanimated progress bars driven by SharedValues.
 * - Simulates Edge-Node latency and GPU memory mapping.
 * - Deep Space Glassmorphism UI.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { NORTH_THEME } from '@/constants/theme';

interface TelemetryNodeProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  progress: number;
}

const TelemetryNode = ({
  icon: Icon,
  label,
  value,
  color,
  progress,
}: TelemetryNodeProps) => {
  const widthVal = useSharedValue(0);

  useEffect(() => {
    // Simulate real-time fluctuating telemetry data
    widthVal.value = withRepeat(
      withSequence(
        withTiming(progress, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(progress - 10, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [progress]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${widthVal.value}%`,
  }));

  return (
    <View style={styles.nodeContainer}>
      <View style={styles.nodeHeader}>
        <View style={styles.nodeLabelWrap}>
          <Icon size={14} color={color} />
          <Text style={styles.nodeLabel}>{label}</Text>
        </View>
        <Text style={[styles.nodeValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: color },
            animatedProgressStyle,
          ]}
        />
      </View>
    </View>
  );
};

export const LiveTelemetry = () => {
  return (
    <GlassCard intensity="heavy" style={styles.container}>
      <View style={styles.header}>
        <Activity size={18} color={NORTH_THEME.colors.accent.cyan} />
        <Text style={styles.title}>SYSTEM TELEMETRY</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <TelemetryNode
          icon={Cpu}
          label="AI CLUSTER CPU"
          value="4.2 GHz"
          color={NORTH_THEME.colors.accent.cyan}
          progress={78}
        />
        <TelemetryNode
          icon={HardDrive}
          label="VAULT I/O READ"
          value="1.2 GB/s"
          color={NORTH_THEME.colors.accent.purple}
          progress={45}
        />
        <TelemetryNode
          icon={Activity}
          label="WASM GPU THREAD"
          value="120 FPS"
          color={NORTH_THEME.colors.status.success}
          progress={95}
        />
        <TelemetryNode
          icon={Wifi}
          label="EDGE LATENCY"
          value="12 ms"
          color={NORTH_THEME.colors.status.warning}
          progress={20}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 10,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NORTH_THEME.colors.status.success,
    marginRight: 6,
  },
  liveText: {
    color: NORTH_THEME.colors.status.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  grid: { gap: 16 },
  nodeContainer: { width: '100%' },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nodeLabel: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nodeValue: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 2 },
});
