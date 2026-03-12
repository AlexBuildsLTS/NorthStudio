/**
 * @file components/studio/panels/RightInspector.tsx
 * @description AAA+ Canvas State Inspector.
 * @features Live layer selection, Z-Index stacking, and hardware deletion.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Layers, Trash2, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useLayerStore } from '@/store/studio/useLayerStore';
import { NORTH_THEME } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

export const RightInspector = () => {
  // Read live state from the Engine
  const layers = useLayerStore((state) => state.present.layers);
  const selectedLayerIds = useLayerStore(
    (state) => state.present.selectedLayerIds,
  );

  // Mutations
  const selectLayer = useLayerStore((state) => state.selectLayer);
  const removeLayer = useLayerStore((state) => state.removeLayer);
  const updateLayer = useLayerStore((state) => state.updateLayer);

  const handleSelect = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    selectLayer(id);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeLayer(id);
  };

  const toggleVisibility = (id: string, currentVis: boolean) => {
    updateLayer(id, { visible: !currentVis });
  };

  return (
    <GlassCard intensity="heavy" style={styles.container}>
      <View style={styles.headerRow}>
        <Layers size={14} color={NORTH_THEME.colors.accent.purple} />
        <Text style={styles.header}>LAYER STACK</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Render the layers in reverse so the top of the list is the top layer visually */}
        {[...layers].reverse().map((layer) => {
          const isSelected = selectedLayerIds.includes(layer.id);

          return (
            <TouchableOpacity
              key={layer.id}
              activeOpacity={0.8}
              onPress={() => handleSelect(layer.id)}
              style={[styles.layerItem, isSelected && styles.layerItemActive]}
            >
              <View style={styles.layerInfo}>
                <Text
                  style={[
                    styles.layerName,
                    isSelected && styles.layerNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {layer.name}
                </Text>
                <Text style={styles.layerType}>{layer.type}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => toggleVisibility(layer.id, layer.visible)}
                  style={styles.actionBtn}
                >
                  {layer.visible ? (
                    <Eye size={14} color={NORTH_THEME.colors.text.muted} />
                  ) : (
                    <EyeOff
                      size={14}
                      color={NORTH_THEME.colors.status.danger}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(layer.id)}
                  style={styles.actionBtn}
                >
                  <Trash2 size={14} color={NORTH_THEME.colors.status.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {layers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Canvas is empty.</Text>
          </View>
        )}
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  header: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scroll: { flex: 1 },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layerItemActive: {
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
    borderColor: NORTH_THEME.colors.accent.purple,
  },
  layerInfo: { flex: 1 },
  layerName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  layerNameActive: { color: NORTH_THEME.colors.accent.purple },
  layerType: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: '800',
  },
});
