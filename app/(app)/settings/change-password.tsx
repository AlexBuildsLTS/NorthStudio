import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { NORTH_THEME } from '@/constants/theme';
import { Button } from '@/components/ui/Button'; // CRITICAL: MUST BE NAMED EXPORT
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

const PasswordField = ({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={NORTH_THEME.colors.text.muted}
        secureTextEntry={!show}
        style={styles.textInput}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
        {show ? (
          <EyeOff size={20} color={NORTH_THEME.colors.text.muted} />
        ) : (
          <Eye size={20} color={NORTH_THEME.colors.text.muted} />
        )}
      </TouchableOpacity>
    </View>
  </View>
);

export default function ChangePasswordScreen() {
  const { session } = useAuthStore();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPass || !newPass || !confirmPass)
      return Alert.alert('Error', 'Fill all fields.');
    if (newPass !== confirmPass)
      return Alert.alert('Error', 'Passwords do not match.');

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email || '',
        password: currentPass,
      });
      if (signInError) throw new Error('Current password incorrect.');

      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Credentials updated.');
    } catch (error: any) {
      Alert.alert('Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#02010A', '#0D0221', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={styles.card}>
                <View style={styles.header}>
                  <View style={styles.iconBox}>
                    <Lock size={32} color={NORTH_THEME.colors.accent.purple} />
                  </View>
                  <Text style={styles.title}>Secure Vault</Text>
                  <Text style={styles.subtitle}>Update your master key.</Text>
                </View>

                <PasswordField
                  label="CURRENT PASSWORD"
                  value={currentPass}
                  onChange={setCurrentPass}
                  show={showCurrent}
                  onToggle={() => setShowCurrent(!showCurrent)}
                  placeholder="Enter current"
                />
                <PasswordField
                  label="NEW PASSWORD"
                  value={newPass}
                  onChange={setNewPass}
                  show={showNew}
                  onToggle={() => setShowNew(!showNew)}
                  placeholder="Enter new"
                />

                <View style={{ marginBottom: 24 }}>
                  <PasswordStrengthIndicator password={newPass} />
                </View>

                <PasswordField
                  label="CONFIRM PASSWORD"
                  value={confirmPass}
                  onChange={setConfirmPass}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(!showConfirm)}
                  placeholder="Confirm new"
                />

                <Button
                  label="UPDATE CREDENTIALS"
                  icon={<Lock size={18} color="#000" />}
                  onPress={handleSubmit}
                  loading={loading}
                  variant="primary"
                  size="lg"
                />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02010A' },
  scrollContent: {
    padding: 24,
    maxWidth: 600,
    marginHorizontal: 'auto',
    width: '100%',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(13, 2, 33, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.accent.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  inputGroup: { marginBottom: 20 },
  label: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
  },
  textInput: {
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingRight: 48,
    height: '100%',
    fontWeight: '600',
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
});
