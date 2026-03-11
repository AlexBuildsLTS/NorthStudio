/**
 * @file app/(app)/settings.tsx
 * @description AAA+ Account Settings and Security Management.
 * Uses Reanimated Bento Grid layout, GlassCard primitives, and Supabase Auth integration.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/store/useUserStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Lock, ShieldCheck, User, Mail, Sparkles, ShieldAlert } from 'lucide-react-native';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { NORTH_THEME } from '@/constants/theme';

export default function SettingsScreen() {
  const { profile, fetchProfile } = useUserStore();
  
  // Local state for forms
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  
  const [profileForm, setProfileForm] = useState({ full_name: '' });
  const [securityForm, setSecurityForm] = useState({ newPassword: '', confirmPassword: '' });

  // Pre-fill profile data when it loads
  useEffect(() => {
    if (profile) {
      setProfileForm({ full_name: profile.full_name || '' });
    }
  }, [profile]);

  // --- Handlers ---
  const handleProfileUpdate = async () => {
    if (!profile?.id) return;
    setLoadingProfile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileForm.full_name })
        .eq('id', profile.id);

      if (error) throw error;
      
      // Refresh the global store
      await fetchProfile(profile.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Creator profile updated.');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Update Failed', error.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return Alert.alert('Security Error', 'Passwords do not match.');
    }
    if (securityForm.newPassword.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Security Notice', 'Access token must be at least 6 characters.');
    }

    setLoadingSecurity(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: securityForm.newPassword });
      if (error) throw error;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Vault Secured', 'Access keys updated successfully.');
      setSecurityForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Encryption Failed', error.message);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const renderRoleBadge = () => {
    if (!profile) return null;
    if (profile.role === 'admin') {
      return (
        <View style={styles.badgeAdmin}>
          <ShieldAlert size={14} color="#EF4444" />
          <Text style={styles.badgeTextAdmin}>SYSTEM ADMIN</Text>
        </View>
      );
    }
    if (profile.role === 'premium') {
      return (
        <View style={styles.badgePremium}>
          <Sparkles size={14} color={NORTH_THEME.colors.accent.purple} />
          <Text style={styles.badgeTextPremium}>PREMIUM CREATOR</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeMember}>
        <User size={14} color={NORTH_THEME.colors.accent.cyan} />
        <Text style={styles.badgeTextMember}>STANDARD CREATOR</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.header}>
        <Text style={styles.pageTitle}>Creator Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your studio identity, security protocols, and subscription tier.</Text>
      </Animated.View>

      <View style={styles.grid}>
        
        {/* PROFILE CARD */}
        <Animated.View entering={FadeInDown.duration(800).delay(100).springify()} style={styles.gridItem}>
          <GlassCard intensity="heavy" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}><User size={20} color={NORTH_THEME.colors.accent.cyan} /></View>
              <Text style={styles.cardTitle}>Identity Matrix</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Registered Email (Read-Only)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: 0.7 }]}>
                <Mail size={16} color={NORTH_THEME.colors.text.muted} />
                <TextInput
                  style={[styles.input, { color: NORTH_THEME.colors.text.muted }]}
                  value={profile?.email || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Creator Name</Text>
              <View style={styles.inputWrapper}>
                <User size={16} color={NORTH_THEME.colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={NORTH_THEME.colors.text.muted}
                  value={profileForm.full_name}
                  onChangeText={(val) => setProfileForm({ ...profileForm, full_name: val })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtnOutline} onPress={handleProfileUpdate} disabled={loadingProfile}>
              {loadingProfile ? <ActivityIndicator color={NORTH_THEME.colors.accent.cyan} /> : <Text style={styles.submitBtnTextOutline}>Update Identity</Text>}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* SECURITY CARD */}
        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.gridItem}>
          <GlassCard intensity="heavy" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(176, 38, 255, 0.1)', borderColor: 'rgba(176, 38, 255, 0.3)' }]}>
                <Lock size={20} color={NORTH_THEME.colors.accent.purple} />
              </View>
              <Text style={styles.cardTitle}>Security Protocols</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>New Access Token</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color={NORTH_THEME.colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={NORTH_THEME.colors.text.muted}
                  value={securityForm.newPassword}
                  onChangeText={(val) => setSecurityForm({ ...securityForm, newPassword: val })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Access Token</Text>
              <View style={styles.inputWrapper}>
                <ShieldCheck size={16} color={NORTH_THEME.colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={NORTH_THEME.colors.text.muted}
                  value={securityForm.confirmPassword}
                  onChangeText={(val) => setSecurityForm({ ...securityForm, confirmPassword: val })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtnFilled} onPress={handlePasswordChange} disabled={loadingSecurity}>
              {loadingSecurity ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnTextFilled}>Encrypt & Save</Text>}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* ACCOUNT STATUS CARD */}
        <Animated.View entering={FadeInDown.duration(800).delay(300).springify()} style={styles.gridItem}>
          <GlassCard intensity="heavy" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <Sparkles size={20} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Account Status</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Clearance:</Text>
              {renderRoleBadge()}
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Available Studio Credits:</Text>
              <Text style={styles.creditsHighlight}>{profile?.credits || 0}</Text>
            </View>

            {profile?.role === 'member' && (
              <TouchableOpacity style={styles.upgradeBtn}>
                <Sparkles size={16} color="#FFF" />
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        </Animated.View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NORTH_THEME.colors.background.primary },
  scrollContent: { padding: Platform.OS === 'web' ? 60 : 24, paddingBottom: 120, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  header: { marginBottom: 40 },
  pageTitle: { color: NORTH_THEME.colors.text.primary, fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  pageSubtitle: { color: NORTH_THEME.colors.text.secondary, fontSize: 16, marginTop: 8, maxWidth: 600, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  gridItem: { flexGrow: 1, minWidth: 320, flexBasis: '45%' },
  card: { padding: 32, borderRadius: 24, borderWidth: 1, borderColor: NORTH_THEME.colors.border.glass, height: '100%' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0, 240, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)' },
  cardTitle: { color: NORTH_THEME.colors.text.primary, fontSize: 20, fontWeight: '800' },
  formGroup: { marginBottom: 20 },
  label: { color: NORTH_THEME.colors.text.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  inputWrapper: { height: 56, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, borderWidth: 1, borderColor: NORTH_THEME.colors.border.glass, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, color: NORTH_THEME.colors.text.primary, fontSize: 15, fontWeight: '500', height: '100%' },
  submitBtnOutline: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: NORTH_THEME.colors.accent.cyan, backgroundColor: 'rgba(0, 240, 255, 0.05)' },
  submitBtnTextOutline: { color: NORTH_THEME.colors.accent.cyan, fontSize: 16, fontWeight: '800' },
  submitBtnFilled: { height: 56, backgroundColor: NORTH_THEME.colors.accent.purple, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitBtnTextFilled: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: NORTH_THEME.colors.border.glass },
  statusLabel: { color: NORTH_THEME.colors.text.secondary, fontSize: 15, fontWeight: '600' },
  creditsHighlight: { color: '#F59E0B', fontSize: 20, fontWeight: '900' },
  upgradeBtn: { height: 56, backgroundColor: '#F59E0B', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24 },
  upgradeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  // Badges
  badgeAdmin: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  badgeTextAdmin: { color: '#EF4444', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  badgePremium: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(176, 38, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(176, 38, 255, 0.3)' },
  badgeTextPremium: { color: NORTH_THEME.colors.accent.purple, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  badgeMember: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 240, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.3)' },
  badgeTextMember: { color: NORTH_THEME.colors.accent.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});