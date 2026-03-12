/**
 * @file components/studio/StudioContainer.tsx
 * @description The Master Orchestrator for North Studio.
 * @note This file is dynamically imported by WithSkiaWeb. It is fully GPU-safe.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Undo2,
  Redo2,
  Download,
  ChevronLeft,
  Save,
  RefreshCcw,
  Layers,
  Box,
} from 'lucide-react-native';

// --- CORE ENGINE ---
import { SkiaCanvas } from '@/components/studio/engine/SkiaCanvas';
import { GestureController } from '@/components/studio/interactions/GestureController';

// --- UI PANELS ---
import { LeftToolbar } from '@/components/studio/panels/LeftToolbar';
import { RightInspector } from '@/components/studio/panels/RightInspector';

// --- DATA & STATE ---
import { NORTH_THEME } from '@/constants/theme';
import { useLayerStore } from '@/store/studio/useLayerStore';
import { useToolStore } from '@/store/studio/useToolStore';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Json } from '@/types/database.types';

const castToSupabaseJson = (obj: any): Json => JSON.parse(JSON.stringify(obj));

const useStudioShortcuts = () => {
  const { undo, redo, removeLayer, present } = useLayerStore();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName !== 'INPUT') {
          present.selectedLayerIds.forEach((id) => removeLayer(id));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, removeLayer, present.selectedLayerIds]);
};

// Must be default export so getComponent() resolves it correctly
export default function StudioContainer() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  const [isSaving, setIsSaving] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<
    'NONE' | 'LEFT' | 'RIGHT'
  >('NONE');

  const { viewport } = useToolStore();
  const { present, past, future, undo, redo } = useLayerStore();
  const isDesktop = width > 1024;

  useStudioShortcuts();

  // --- CLOUD SYNC ENGINE ---
  const saveProject = useCallback(async () => {
    if (!session?.user.id || present.layers.length === 0) return;

    setIsSaving(true);
    try {
      const payload = { layers: present.layers, viewport };
      const { error } = await supabase.from('mockup_versions').insert({
        user_id: session.user.id,
        mockup_id: 'd9b2e1c0-82a1-4f33-8c77-1e5f7689912a',
        canvas_state: castToSupabaseJson(payload),
      });

      if (error) throw error;
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('PERSISTENCE_FAILURE', e);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  }, [present.layers, viewport, session]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveProject();
    }, 5000);
    return () => clearTimeout(timer);
  }, [present.layers, saveProject]);

  const handleExit = () => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <View style={styles.masterContainer}>
      <LinearGradient
        colors={['#050110', '#0D0221', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={SlideInUp.springify()}
        style={[styles.topBar, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleExit}>
            <ChevronLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.projectTitle}>NORTH_V1_ALPHA</Text>
            <View style={styles.saveStatus}>
              {isSaving ? (
                <RefreshCcw size={10} color={NORTH_THEME.colors.accent.cyan} />
              ) : (
                <Save size={10} color={NORTH_THEME.colors.text.muted} />
              )}
              <Text style={styles.saveText}>
                {isSaving ? 'SYNCING...' : 'CLOUD SECURE'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.topBarCenter}>
          <TouchableOpacity
            style={[styles.historyBtn, past.length === 0 && styles.disabled]}
            onPress={undo}
            disabled={past.length === 0}
          >
            <Undo2 size={18} color={past.length === 0 ? '#475569' : '#FFF'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.historyBtn, future.length === 0 && styles.disabled]}
            onPress={redo}
            disabled={future.length === 0}
          >
            <Redo2 size={18} color={future.length === 0 ? '#475569' : '#FFF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.exportBtn}>
            <Download size={14} color="#000" />
            <Text style={styles.exportText}>EXPORT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <GestureController>
        <View
          style={[
            styles.workspace,
            { paddingBottom: isDesktop ? 20 : insets.bottom + 100 },
          ]}
        >
          {(isDesktop || activeMobilePanel === 'LEFT') && (
            <Animated.View
              entering={FadeIn}
              style={isDesktop ? styles.sidePanel : styles.mobileFloatPanel}
            >
              <LeftToolbar />
            </Animated.View>
          )}

          <View style={styles.canvasContainer}>
            {/* The Engine is safely mounted here */}
            <SkiaCanvas />

            {!isDesktop && (
              <View style={styles.mobileToggles}>
                <TouchableOpacity
                  onPress={() =>
                    setActiveMobilePanel((p) =>
                      p === 'LEFT' ? 'NONE' : 'LEFT',
                    )
                  }
                  style={[
                    styles.toggleBtn,
                    activeMobilePanel === 'LEFT' && styles.toggleBtnActive,
                  ]}
                >
                  <Box
                    size={20}
                    color={activeMobilePanel === 'LEFT' ? '#000' : '#FFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setActiveMobilePanel((p) =>
                      p === 'RIGHT' ? 'NONE' : 'RIGHT',
                    )
                  }
                  style={[
                    styles.toggleBtn,
                    activeMobilePanel === 'RIGHT' && styles.toggleBtnActive,
                  ]}
                >
                  <Layers
                    size={20}
                    color={activeMobilePanel === 'RIGHT' ? '#000' : '#FFF'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {(isDesktop || activeMobilePanel === 'RIGHT') && (
            <Animated.View
              entering={FadeIn}
              style={isDesktop ? styles.sidePanel : styles.mobileFloatPanel}
            >
              <RightInspector />
            </Animated.View>
          )}
        </View>
      </GestureController>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1, backgroundColor: '#02010A' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(2, 1, 10, 0.9)',
    zIndex: 1000,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projectTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  saveText: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  topBarCenter: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
  },
  historyBtn: { padding: 8, borderRadius: 8 },
  topBarRight: { flexDirection: 'row' },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NORTH_THEME.colors.accent.cyan,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportText: { color: '#000', fontWeight: '900', fontSize: 11 },
  workspace: { flex: 1, flexDirection: 'row', gap: 12, padding: 12 },
  sidePanel: { width: 280, height: '100%' },
  mobileFloatPanel: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    right: 12,
    height: '50%',
    zIndex: 100,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: '#05030A',
    position: 'relative',
    justifyContent: 'center',
  },
  mobileToggles: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleBtnActive: { backgroundColor: NORTH_THEME.colors.accent.cyan },
  disabled: { opacity: 0.3 },
});
