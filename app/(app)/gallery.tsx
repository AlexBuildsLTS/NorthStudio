/**
 * @file app/(app)/gallery.tsx
 * @description High-fidelity project showcase with real-time Supabase sync.
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
  Dimensions,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Grid,
  Layout,
  ExternalLink,
  Trash2,
  Layers,
  Box,
  Sparkles,
  Search,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  Layout as ReanimatedLayout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/ui/GlassCard';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;

export default function GalleryScreen() {
  const { session } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'EXPORTS'>(
    'PROJECTS',
  );

  useEffect(() => {
    fetchGallery();
  }, [activeTab]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const userId = session?.user.id;
      if (!userId) return;

      const tableName = activeTab === 'PROJECTS' ? 'mockups' : 'studio_assets';

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Gallery Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (Platform.OS !== 'web')
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const tableName = activeTab === 'PROJECTS' ? 'mockups' : 'studio_assets';
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Delete Error:', err);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={ReanimatedLayout.springify()}
      style={[styles.itemContainer, { width: isDesktop ? '31%' : '100%' }]}
    >
      <GlassCard intensity="medium" style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri:
                activeTab === 'PROJECTS'
                  ? item.thumbnail_path
                  : item.storage_path,
            }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {activeTab === 'PROJECTS' ? item.title : item.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <View style={styles.statusBadge}>
              <Sparkles size={10} color="#00F0FF" />
              <Text style={styles.statusText}>AI-Optimized</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#050508', '#0A0A14']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Project Gallery</Text>
          <Text style={styles.subtitle}>Your visual command history</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Search size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* SEGMENTED TABS */}
      <View style={styles.tabContainer}>
        {['PROJECTS', 'EXPORTS'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#B026FF" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 3 : 1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Grid size={64} color="rgba(255,255,255,0.03)" />
              <Text style={styles.emptyTitle}>Nothing Here Yet</Text>
              <Text style={styles.emptySub}>
                Start a session in the Studio to see your work appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 30,
  },
  title: { color: '#FFF', fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#64748B', fontSize: 16, marginTop: 4 },
  searchBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(176, 38, 255, 0.3)',
  },
  tabText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  activeTabText: { color: '#B026FF' },

  listContent: { padding: 20, paddingBottom: 120 },
  itemContainer: { margin: 8 },
  card: { borderRadius: 28, padding: 0, overflow: 'hidden' },
  imageWrapper: { width: '100%', height: 220, backgroundColor: '#111' },
  previewImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  actionIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardInfo: { padding: 20 },
  itemTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dateText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  emptySub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
