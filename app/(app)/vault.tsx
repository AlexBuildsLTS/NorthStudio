/**
 * @file app/(app)/assets.tsx
 * @description Enterprise Asset Management System.
 * FIXES: Hyper-optimized for Mobile viewports. Headers stack on narrow screens,
 * text truncation prevents overflow, and bottom paddings clear the navigation bar.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Search,
  Trash2,
  HardDrive,
  X,
  Maximize2,
  Info,
  Calendar,
  Image as ImageIcon,
  CheckSquare,
  Square,
  UploadCloud,
  CloudCog,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  Layout,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { NORTH_THEME } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

type AssetType = 'ALL' | 'LOGO' | 'BASE' | 'FONT' | 'COMPOSITION';
type SortOrder = 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';

export default function AssetsScreen() {
  const { session } = useAuthStore();
  const { width } = useWindowDimensions();

  // --- MOBILE ADAPTIVE LOGIC ---
  const isSmallMobile = width < 390; // Detects narrow screens like iPhone SE/Mini

  const numColumns = useMemo(() => {
    if (width >= 1400) return 5;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  }, [width]);

  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<AssetType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!session?.user.id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('studio_assets')
        .select('*')
        .eq('user_id', session.user.id);
      if (filter !== 'ALL') query = query.eq('type', filter);
      const { data, error } = await query;
      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('[Assets]', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id, filter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    let result = [...assets];
    if (searchQuery.trim()) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setFilteredAssets(result);
  }, [assets, searchQuery, sortOrder]);

  const handleUpload = async () => {
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) return;
      setUploading(true);
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop() || 'png';
      const fileName = `asset_${Date.now()}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: storageError } = await supabase.storage
        .from('studio_uploads')
        .upload(filePath, blob, { upsert: true });
      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('studio_uploads').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('studio_assets').insert({
        user_id: session?.user.id,
        name: file.fileName || fileName,
        storage_path: publicUrl,
        type: filter === 'ALL' ? 'LOGO' : filter,
        metadata: {
          width: file.width,
          height: file.height,
          size: file.fileSize,
          format: fileExt.toUpperCase(),
        },
        is_public: false,
      });

      if (dbError) throw dbError;
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchAssets();
    } catch (err) {
      console.error('[Upload Error]', err);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      if (newSet.size === 0) setIsSelectionMode(false);
    } else {
      newSet.add(id);
      setIsSelectionMode(true);
    }
    setSelectedIds(newSet);
  };

  const executeDelete = async (idsToDelete: string[]) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('studio_assets')
        .delete()
        .in('id', idsToDelete);
      if (error) throw error;
      setAssets((prev) => prev.filter((a) => !idsToDelete.includes(a.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setPreviewAsset(null);
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[Assets] Delete Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderAssetCard = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    const cardWidth = `${100 / numColumns}%`;

    return (
      <Animated.View
        entering={FadeInDown.delay(index > 15 ? 0 : index * 40).springify()}
        layout={Layout.springify()}
        style={[styles.assetWrapper, { width: cardWidth as any }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            isSelectionMode ? toggleSelection(item.id) : setPreviewAsset(item)
          }
          onLongPress={() => toggleSelection(item.id)}
        >
          <GlassCard
            intensity="medium"
            style={[styles.assetCard, isSelected && styles.assetCardSelected]}
          >
            <View style={styles.imageContainer}>
              <View style={styles.transparentPattern} />
              <Image
                source={{ uri: item.storage_path }}
                style={styles.assetImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              <View style={styles.topBadges}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.type}</Text>
                </View>
              </View>
              {isSelectionMode && (
                <View
                  style={[
                    styles.selectionOverlay,
                    isSelected && styles.selectionOverlayActive,
                  ]}
                >
                  {isSelected ? (
                    <CheckSquare
                      size={24}
                      color={NORTH_THEME.colors.accent.cyan}
                    />
                  ) : (
                    <Square size={24} color="rgba(255,255,255,0.5)" />
                  )}
                </View>
              )}
            </View>
            <View style={styles.assetFooter}>
              <View style={styles.assetMetaWrap}>
                <Text style={styles.assetName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.assetMetaText}>
                  {item.metadata?.format || 'IMG'} •{' '}
                  {formatBytes(item.metadata?.size)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#050110', '#0D0221', '#050110']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* MOBILE ADAPTIVE HEADER */}
          <View style={[styles.header, isSmallMobile && styles.headerMobile]}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Asset Vault</Text>
              <Text style={styles.subtitle}>
                {assets.length} items synced securely
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                uploading && { opacity: 0.7 },
                isSmallMobile && styles.uploadBtnMobile,
              ]}
              onPress={handleUpload}
              disabled={uploading}
            >
              <LinearGradient
                colors={[
                  NORTH_THEME.colors.accent.cyan,
                  NORTH_THEME.colors.accent.purple,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {uploading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <CloudCog size={24} color="#01010A" />
                  <Text style={styles.uploadText}>IMPORT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* CONTROLS */}
          <View style={styles.controlsContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color={NORTH_THEME.colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={NORTH_THEME.colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <X size={14} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {['ALL', 'LOGO', 'BASE', 'FONT', 'COMPOSITION'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setFilter(t as AssetType)}
                  style={[
                    styles.filterChip,
                    filter === t && styles.filterChipActive,
                  ]}
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
            </ScrollView>
          </View>

          {/* GRID */}
          {loading && assets.length === 0 ? (
            <View style={styles.centerContent}>
              <ActivityIndicator
                size="large"
                color={NORTH_THEME.colors.accent.cyan}
              />
              <Text style={styles.loadingText}>Decrypting Vault...</Text>
            </View>
          ) : (
            <FlatList
              key={`grid-cols-${numColumns}`}
              data={filteredAssets}
              renderItem={renderAssetCard}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* MOBILE ADAPTIVE BULK ACTION BAR */}
          {isSelectionMode && (
            <Animated.View
              entering={SlideInDown.springify()}
              exiting={SlideOutDown.springify()}
              style={styles.bulkActionBar}
            >
              <BlurView
                intensity={50}
                tint="dark"
                style={styles.bulkActionInner}
              >
                <View style={styles.bulkLeft}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedIds(new Set());
                      setIsSelectionMode(false);
                    }}
                    style={styles.iconBtn}
                  >
                    <X size={20} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.bulkText}>{selectedIds.size}</Text>
                </View>

                <View style={styles.bulkRight}>
                  <TouchableOpacity
                    onPress={() => executeDelete(Array.from(selectedIds))}
                    style={styles.bulkActionBtn}
                  >
                    <Trash2 size={16} color={NORTH_THEME.colors.accent.pink} />
                    <Text style={styles.bulkActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* LIGHTBOX MODAL */}
      {previewAsset && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewAsset(null)}
        >
          <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setPreviewAsset(null)}
                >
                  <X size={28} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => executeDelete([previewAsset.id])}
                >
                  <Trash2 size={24} color={NORTH_THEME.colors.accent.pink} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalImageWrapper}>
                <Image
                  source={{ uri: previewAsset.storage_path }}
                  style={styles.modalImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.modalFooter}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {previewAsset.name}
                </Text>
                <Text style={styles.modalMeta}>
                  {previewAsset.metadata?.format} •{' '}
                  {previewAsset.metadata?.width}x{previewAsset.metadata?.height}
                </Text>
              </View>
            </SafeAreaView>
          </BlurView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050110' },

  // MOBILE ADAPTIVE HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start' }, // Stacks on small screens
  headerTextWrap: { flexShrink: 1 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subtitle: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
  },
  uploadBtnMobile: { width: '100%', justifyContent: 'center', marginTop: 10 },
  uploadText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },

  // CONTROLS
  controlsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 14 },
  clearSearchBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  filterScroll: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(176, 38, 255, 0.15)',
    borderColor: NORTH_THEME.colors.accent.purple,
  },
  filterText: {
    color: NORTH_THEME.colors.text.muted,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  filterTextActive: { color: '#FFF' },

  // GRID
  listContent: { paddingHorizontal: 12, paddingBottom: 140 }, // Clears BottomTabBar
  assetWrapper: { padding: 4 },
  assetCard: {
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  assetCardSelected: {
    borderColor: NORTH_THEME.colors.accent.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111520',
    opacity: 0.5,
  },
  assetImage: { width: '100%', height: '100%' },
  topBadges: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  typeBadge: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOverlayActive: { backgroundColor: 'rgba(0, 240, 255, 0.15)' },
  assetFooter: { marginTop: 8, paddingHorizontal: 4 },
  assetMetaWrap: { flexShrink: 1 },
  assetName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  assetMetaText: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 9,
    fontWeight: '700',
  },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: NORTH_THEME.colors.text.muted,
    marginTop: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // MOBILE BULK ACTION BAR
  bulkActionBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.accent.cyan,
  },
  bulkActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  bulkLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  bulkRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NORTH_THEME.colors.accent.pink,
  },
  bulkActionText: {
    color: NORTH_THEME.colors.accent.pink,
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: { padding: 4 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 1, 10, 0.95)' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalImageWrapper: { flex: 1, padding: 20 },
  modalImage: { flex: 1, width: '100%' },
  modalFooter: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalMeta: {
    color: NORTH_THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
