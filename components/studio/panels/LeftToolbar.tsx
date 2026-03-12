/**
 * @file components/studio/panels/LeftToolbar.tsx
 * @description AAA+ Asset Injection Panel.
 * @features Real-time Supabase syncing, instant Skia Layer injection.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Box, Image as ImageIcon, Plus } from 'lucide-react-native';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayerStore } from '@/store/studio/useLayerStore';
import { NORTH_THEME } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

export const LeftToolbar = () => {
  const session = useAuthStore((state) => state.session);
  const addLayer = useLayerStore((state) => state.addLayer);

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the assets you uploaded via the Vault
  useEffect(() => {
    const fetchAssets = async () => {
      if (!session?.user.id) return;
      const { data, error } = await supabase
        .from('studio_assets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setAssets(data);
      setLoading(false);
    };
    fetchAssets();
  }, [session]);

  // Inject the binary directly into the C++ Skia Engine
  const injectToCanvas = (asset: any) => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    addLayer({
      name: asset.name,
      type: asset.type === 'BASE' ? 'BASE_PRODUCT' : 'IMAGE',
      uri: asset.storage_path,
      opacity: 1,
      visible: true,
      locked: false,
      blendMode: 'normal',
      transform: {
        x: 100, // Drop it slightly offset from the top left
        y: 100,
        scale: 0.8, // Scale it down so 4K images don't overflow the screen
        rotation: 0,
      },
    });
  };

  return (
    <GlassCard intensity="heavy" style={styles.container}>
      <Text style={styles.header}>ASSET VAULT</Text>

      {loading ? (
        <ActivityIndicator
          color={NORTH_THEME.colors.accent.cyan}
          style={{ marginTop: 20 }}
        />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {assets.map((asset) => (
            <TouchableOpacity
              key={asset.id}
              activeOpacity={0.8}
              style={styles.assetCard}
              onPress={() => injectToCanvas(asset)}
            >
              <View style={styles.imageBox}>
                <Image
                  source={{ uri: asset.storage_path }}
                  style={styles.image}
                  contentFit="contain"
                />
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.assetName} numberOfLines={1}>
                  {asset.name}
                </Text>
                <View style={styles.badge}>
                  {asset.type === 'BASE' ? (
                    <Box size={10} color="#000" />
                  ) : (
                    <ImageIcon size={10} color="#000" />
                  )}
                  <Text style={styles.badgeText}>{asset.type}</Text>
                </View>
              </View>
              <View style={styles.injectBtn}>
                <Plus size={16} color={NORTH_THEME.colors.accent.cyan} />
              </View>
            </TouchableOpacity>
          ))}

          {assets.length === 0 && (
            <Text style={styles.emptyText}>
              Vault empty. Upload assets from the Dashboard.
            </Text>
          )}
        </ScrollView>
      )}
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
  header: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imageBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#000',
    overflow: 'hidden',
    marginRight: 12,
  },
  image: { width: '100%', height: '100%' },
  infoBox: { flex: 1 },
  assetName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    backgroundColor: NORTH_THEME.colors.accent.cyan,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  injectBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
});
