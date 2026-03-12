/**
 * @file components/studio/panels/RightInspector.tsx
 * @description Master Right Panel for Studio.
 * Handles Layer Management, Z-Index sorting, and Blend Modes.
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
import { Layers, Eye, Lock, Unlock, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { NORTH_THEME } from '@/constants/theme';
import { useLayerStore } from '@/store/studio/useLayerStore';

export const RightInspector = () => {
  const { present, selectLayer, updateLayer } = useLayerStore();
  const layers = present.layers;
  const selectedIds = present.selectedLayerIds;

  const handleSelect = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    selectLayer(id, false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Layers size={18} color={NORTH_THEME.colors.accent.purple} />
        <Text style={styles.headerTitle}>LAYER STACK</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {layers.length === 0 ? (
          <Text style={styles.emptyText}>No layers in project.</Text>
        ) : (
          [...layers].reverse().map((layer) => {
            const isSelected = selectedIds.includes(layer.id);
            return (
              <TouchableOpacity
                key={layer.id}
                activeOpacity={0.7}
                onPress={() => handleSelect(layer.id)}
                style={[styles.layerItem, isSelected && styles.layerItemActive]}
              >
                <View style={styles.layerInfo}>
                  <View
                    style={[
                      styles.typeBadge,
                      isSelected && {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.typeText, isSelected && { color: '#FFF' }]}
                    >
                      {layer.type === 'BASE_PRODUCT' ? 'BASE' : layer.type}
                    </Text>
                  </View>
                  <Text
                    style={[styles.layerName, isSelected && { color: '#FFF' }]}
                    numberOfLines={1}
                  >
                    {layer.name}
                  </Text>
                </View>

                {/* Layer Toggles */}
                <View style={styles.layerActions}>
                  <TouchableOpacity
                    onPress={() =>
                      updateLayer(layer.id, { locked: !layer.locked })
                    }
                  >
                    {layer.locked ? (
                      <Lock size={14} color="#EF4444" />
                    ) : (
                      <Unlock size={14} color="#64748B" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      updateLayer(layer.id, { visible: !layer.visible })
                    }
                  >
                    {layer.visible ? (
                      <Eye size={14} color="#FFF" />
                    ) : (
                      <EyeOff size={14} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: 'rgba(9, 12, 19, 0.6)', // Matches Sidebar exactly
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollArea: { flex: 1 },
  scrollContent: { gap: 8 },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layerItemActive: {
    backgroundColor: 'rgba(176, 38, 255, 0.1)',
    borderColor: 'rgba(176, 38, 255, 0.3)',
  },
  layerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: { color: '#64748B', fontSize: 8, fontWeight: '900' },
  layerName: { color: '#94A3B8', fontSize: 13, fontWeight: '600', flex: 1 },
  layerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
