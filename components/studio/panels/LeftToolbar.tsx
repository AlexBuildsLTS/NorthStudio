/**
 * @file components/studio/panels/LeftToolbar.tsx
 * @description Master Left Panel for Studio.
 * Handles Asset Injection and AI Generation triggers.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Image as ImageIcon, Type, Sparkles, Box } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { NORTH_THEME } from '@/constants/theme';
import { useLayerStore } from '@/store/studio/useLayerStore';

export const LeftToolbar = () => {
  const addLayer = useLayerStore((state) => state.addLayer);

  const handleAddAsset = (type: 'IMAGE' | 'TEXT' | 'BASE_PRODUCT') => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Dispatches a new layer to the Zustand State Machine
    addLayer({
      name: `New ${type}`,
      type: type,
      transform: { x: 150, y: 150, scale: 1, rotation: 0 },
      opacity: 1,
      blendMode: 'normal',
      visible: true,
      locked: false,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>ASSET VAULT</Text>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ACTION: Add Base Product */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAddAsset('BASE_PRODUCT')}
        >
          <Box size={20} color={NORTH_THEME.colors.accent.purple} />
          <View style={styles.actionTextWrapper}>
            <Text style={styles.actionTitle}>Base Product</Text>
            <Text style={styles.actionSub}>Load T-Shirt, Hoodie, etc.</Text>
          </View>
        </TouchableOpacity>

        {/* ACTION: Add Logo/Image */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAddAsset('IMAGE')}
        >
          <ImageIcon size={20} color={NORTH_THEME.colors.accent.cyan} />
          <View style={styles.actionTextWrapper}>
            <Text style={styles.actionTitle}>Graphic / Logo</Text>
            <Text style={styles.actionSub}>Insert PNG/SVG assets</Text>
          </View>
        </TouchableOpacity>

        {/* ACTION: AI Magic Compositor */}
        <View style={styles.aiBox}>
          <View style={styles.aiHeader}>
            <Sparkles size={16} color="#000" />
            <Text style={styles.aiTitle}>AI COMPOSITOR</Text>
          </View>
          <Text style={styles.aiDesc}>
            Select a logo and base product, then let the engine calculate
            perspective wrap and dynamic shadows.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: 'rgba(9, 12, 19, 0.6)', // Matches Sidebar exactly
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  scrollArea: { flex: 1 },
  scrollContent: { gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  actionTextWrapper: { flex: 1 },
  actionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSub: { color: '#64748B', fontSize: 11 },
  aiBox: {
    marginTop: 20,
    backgroundColor: NORTH_THEME.colors.accent.cyan,
    padding: 16,
    borderRadius: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiTitle: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  aiDesc: { color: '#000', fontSize: 12, opacity: 0.8, lineHeight: 18 },
});
