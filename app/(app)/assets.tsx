/**
 * @file app/(app)/assets.tsx
 * @description AAA+ Asset Management System for North Studio.
 * Handles cloud storage sync, binary uploads, and high-fidelity project assets.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  HardDrive,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { NORTH_THEME } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AssetsScreen() {
  const { session } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LOGO' | 'BASE'>('ALL');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [filter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      if (!session?.user.id) {
        setAssets([]);
        return;
      }
      let query = supabase
        .from('studio_assets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Fetch Assets Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      setUploading(true);
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      // Convert to Blob for Supabase Storage
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: storageError } = await supabase.storage
        .from('studio-assets')
        .upload(filePath, blob);

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('studio-assets').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('studio_assets').insert({
        user_id: session?.user.id,
        name: fileName,
        storage_path: publicUrl,
        type: filter === 'ALL' ? 'LOGO' : filter,
        metadata: { width: file.width, height: file.height },
      });

      if (dbError) throw dbError;

      fetchAssets();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (id: string, path: string) => {
    try {
      if (Platform.OS !== 'web')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const { error } = await supabase
        .from('studio_assets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setAssets(assets.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderAssetItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
      style={[styles.assetWrapper, { width: isDesktop ? '23%' : '47%' }]}
    >
      <GlassCard intensity="medium" style={styles.assetCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.storage_path }}
            style={styles.assetImage}
            resizeMode="contain"
          />
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.assetFooter}>
          <Text style={styles.assetName} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={() => deleteAsset(item.id, item.storage_path)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050508', '#0A0A14']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Asset Engine</Text>
          <Text style={styles.subtitle}>
            {assets.length} items synced to cloud
          </Text>
        </View>

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handleUpload}
          disabled={uploading}
        >
          <LinearGradient
            colors={[
              NORTH_THEME.colors.accent.purple,
              NORTH_THEME.colors.accent.cyan,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Plus size={20} color="#FFF" />
              <Text style={styles.uploadText}>Import</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        {['ALL', 'LOGO', 'BASE'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => {
              if (Platform.OS !== 'web')
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(t as any);
            }}
            style={[styles.filterBtn, filter === t && styles.filterBtnActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === t && styles.filterTextActive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 4 : 2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <HardDrive size={48} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyTitle}>Vault is Empty</Text>
              <Text style={styles.emptySub}>
                Import your first logo or mockup base to begin.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 4 },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    overflow: 'hidden',
  },
  uploadText: { color: '#FFF', fontWeight: '900', fontSize: 14 },

  filterBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  filterText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#00F0FF' },

  listContent: { padding: 16, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  assetWrapper: { marginBottom: 8 },
  assetCard: { borderRadius: 20, padding: 12 },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetImage: { width: '80%', height: '80%' },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  assetName: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 12,
  },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  emptySub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
});
