/**
 * @file app/(app)/settings/biometric.tsx
 * @description AAA+ Biometric Configuration.
 * FIXES: Replaced Tailwind with StyleSheet, Applied Cosmic Background, Universal button formatting.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Fingerprint,
  ScanFace,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone,
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/ui/GlassCard';
import { secureStorage } from '@/lib/supabase/secureStorage';
import { NORTH_THEME } from '@/constants/theme';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export default function BiometricScreen() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<
    LocalAuthentication.AuthenticationType[]
  >([]);
  const [isHardwareSupported, setIsHardwareSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      checkBiometricStatus();
      loadBiometricSetting();
    }, []),
  );

  const checkBiometricStatus = async () => {
    setLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      setIsHardwareSupported(hasHardware);
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      setSupportedTypes(types);
    } catch (error) {
      console.error('[Biometric]', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBiometricSetting = async () => {
    try {
      const stored = await secureStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(stored === 'true');
    } catch (e) {}
  };

  const saveBiometricSetting = async (enabled: boolean) => {
    try {
      await secureStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
      setBiometricEnabled(enabled);
    } catch (e) {
      Alert.alert('Error', 'Could not save setting');
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      if (!isHardwareSupported)
        return Alert.alert('Not Supported', 'Lacks hardware.');
      if (!isEnrolled) return promptToEnroll();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm biometric binding',
      });
      if (result.success) {
        if (Platform.OS !== 'web')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await saveBiometricSetting(true);
      }
    } else {
      if (Platform.OS !== 'web')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await saveBiometricSetting(false);
    }
  };

  const testBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Biometric Test',
    });
    if (result.success) {
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Biometric ID Verified!');
    } else if (result.error !== 'user_cancel') {
      Alert.alert('Failed', 'Verification failed.');
    }
  };

  const promptToEnroll = () => {
    Alert.alert(
      'Setup Required',
      `Please set up ${getBiometricName()} in device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () =>
            Platform.OS === 'ios'
              ? Linking.openURL('App-Prefs:root=TOUCHID_PASSCODE')
              : Linking.sendIntent('android.settings.SECURITY_SETTINGS'),
        },
      ],
    );
  };

  const getBiometricIcon = () =>
    supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
      ? ScanFace
      : supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT,
          )
        ? Fingerprint
        : Smartphone;
  const getBiometricName = () =>
    Platform.OS === 'ios'
      ? supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
        ? 'Face ID'
        : 'Touch ID'
      : supportedTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ? 'Face Unlock'
        : 'Fingerprint';

  const BiometricIcon = getBiometricIcon();
  const biometricName = getBiometricName();
  const isReady = isHardwareSupported && isEnrolled;

  if (loading) {
    return (
      <View style={styles.loaderRoot}>
        <LinearGradient
          colors={['#02010A', '#130321', '#050110']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator
          size="large"
          color={NORTH_THEME.colors.accent.cyan}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <LinearGradient
        colors={['#02010A', '#130321', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard intensity="medium" style={styles.card}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.iconCircle,
                isReady ? styles.iconCircleReady : styles.iconCircleOff,
              ]}
            >
              {isReady ? (
                <BiometricIcon
                  size={48}
                  color={NORTH_THEME.colors.status.success}
                />
              ) : (
                <XCircle size={48} color={NORTH_THEME.colors.text.muted} />
              )}
            </View>
            <Text style={styles.title}>{biometricName}</Text>

            <View style={styles.statusBadge}>
              {isReady ? (
                <>
                  <CheckCircle
                    size={14}
                    color={NORTH_THEME.colors.status.success}
                  />
                  <Text style={styles.statusTextReady}>SECURE & AVAILABLE</Text>
                </>
              ) : (
                <>
                  <AlertCircle
                    size={14}
                    color={NORTH_THEME.colors.status.warning}
                  />
                  <Text style={styles.statusTextOff}>
                    {!isHardwareSupported ? 'NOT SUPPORTED' : 'NOT SET UP'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </GlassCard>

        <GlassCard intensity="medium" style={styles.card}>
          <View style={styles.controlRow}>
            <View style={styles.controlLeft}>
              <View style={styles.shieldIcon}>
                <Shield size={20} color={NORTH_THEME.colors.accent.cyan} />
              </View>
              <View>
                <Text style={styles.controlTitle}>Biometric Login</Text>
                <Text style={styles.controlSub}>
                  Use {biometricName} for instant access
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggle}
              disabled={!isReady}
              trackColor={{
                false: 'rgba(255,255,255,0.1)',
                true: NORTH_THEME.colors.accent.cyan,
              }}
              thumbColor="#FFF"
            />
          </View>
        </GlassCard>

        {isReady && (
          <TouchableOpacity onPress={testBiometric} style={styles.testBtn}>
            <Text style={styles.testBtnText}>Test {biometricName} Sensor</Text>
            <Text style={styles.testBtnSub}>
              Verify your hardware is responding correctly
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010A' },
  loaderRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    padding: 24,
    maxWidth: 600,
    marginHorizontal: 'auto',
    width: '100%',
  },
  card: { padding: 24, borderRadius: 24, marginBottom: 20 },

  statusHeader: { alignItems: 'center' },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  iconCircleReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  iconCircleOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTextReady: {
    color: NORTH_THEME.colors.status.success,
    fontSize: 12,
    fontWeight: '800',
  },
  statusTextOff: {
    color: NORTH_THEME.colors.status.warning,
    fontSize: 12,
    fontWeight: '800',
  },

  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  controlSub: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },

  testBtn: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 20,
  },
  testBtnText: {
    color: NORTH_THEME.colors.accent.cyan,
    fontSize: 16,
    fontWeight: '800',
  },
  testBtnSub: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
