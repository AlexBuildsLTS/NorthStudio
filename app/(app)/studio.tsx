/**
 * @file app/(app)/studio.tsx
 * @description The North Studio Master Rendering Engine.
 * High-performance Skia-based canvas with hardware-accelerated manipulation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  Group,
  Skia,
  Rect,
  useCanvasRef,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import {
  Layers,
  Type,
  Image as ImageIcon,
  Maximize,
  Download,
  RotateCcw,
  Plus,
  ChevronLeft,
  Settings2,
  Zap,
  MousePointer2,
  Trash2,
  Move,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { NORTH_THEME } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 32;

// Types for layer management
interface CanvasLayer {
  id: string;
  uri: string;
  type: 'LOGO' | 'TEXT' | 'PRODUCT';
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  rotation: SharedValue<number>;
  zIndex: number;
}

export default function StudioEngine() {
  const router = useRouter();
  const canvasRef = useCanvasRef();
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- ASSET STATE ---
  // Default base mockup (Placeholder until user selects one)
  const baseImage = useImage(require('@/assets/images/icon.png'));

  // Dynamic Layers State
  const [layers, setLayers] = useState<CanvasLayer[]>([]);

  // --- GESTURE LOGIC ---
  // We use Shared Values for the current active transformation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const context = useSharedValue({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;
    });

  const pinchGesture = Gesture.Pinch().onUpdate((event) => {
    scale.value = event.scale;
  });

  const rotateGesture = Gesture.Rotation().onUpdate((event) => {
    rotation.value = event.rotation;
  });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    rotateGesture,
  );

  // --- ACTIONS ---
  const handleImport = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newLayer: CanvasLayer = {
        id: Math.random().toString(36),
        uri: result.assets[0].uri,
        type: 'LOGO',
        x: translateX,
        y: translateY,
        scale: scale,
        rotation: rotation,
        zIndex: layers.length + 1,
      };

      setLayers([...layers, newLayer]);
      setActiveLayerId(newLayer.id);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    // Real Skia Image Snapshot logic
    const image = canvasRef.current?.makeImageSnapshot();
    if (image) {
      const data = image.encodeToBytes();
      // Logic to save to device gallery would go here
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={['#050508', '#0A0D14']}
        style={StyleSheet.absoluteFill}
      />

      {/* 2026 FLOATING HEADER */}
      <View style={styles.topNav}>
        <BlurView intensity={20} tint="dark" style={styles.navBlur}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.circleBtn}
          >
            <ChevronLeft size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle}>
              SKIA ENGINE <Text style={{ color: '#00F0FF' }}>V2</Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            style={styles.exportBtn}
          >
            <LinearGradient
              colors={['#B026FF', '#00F0FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Download size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* RENDERING ZONE */}
      <View style={styles.canvasContainer}>
        <GestureDetector gesture={composedGesture}>
          <View style={styles.canvasFrame}>
            <Canvas
              ref={canvasRef}
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            >
              {/* Layer 0: Background/Environment */}
              <Rect
                x={0}
                y={0}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                color="#0F111A"
              />

              {/* Layer 1: Base Product Mockup */}
              {baseImage && (
                <Image
                  image={baseImage}
                  x={0}
                  y={0}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  fit="contain"
                />
              )}

              {/* Layer 2+: User Overlays */}
              {layers.map((layer) => (
                <RenderLayer key={layer.id} layer={layer} />
              ))}
            </Canvas>

            {/* Contextual UI Overlays for Skia */}
            <View style={styles.canvasOverlay} pointerEvents="none">
              <View style={styles.guideLines} />
            </View>
          </View>
        </GestureDetector>
      </View>

      {/* INTERACTIVE CONTROLS PANEL */}
      <BlurView intensity={30} tint="dark" style={styles.controlPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Composition Tools</Text>
          <View style={styles.headerRight}>
            <Zap size={14} color="#F59E0B" />
            <Text style={styles.creditText}>1,240</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsScroll}
        >
          <ToolCard
            icon={ImageIcon}
            label="Add Asset"
            onPress={handleImport}
            color="#B026FF"
          />
          <ToolCard
            icon={Type}
            label="Add Text"
            onPress={() => {}}
            color="#00F0FF"
          />
          <ToolCard
            icon={Maximize}
            label="Warp Mesh"
            onPress={() => {}}
            color="#FF3366"
          />
          <ToolCard
            icon={Layers}
            label="Settings"
            onPress={() => {}}
            color="#10B981"
          />
        </ScrollView>

        <View style={styles.activeLayerBar}>
          <View style={styles.layerInfo}>
            <MousePointer2 size={16} color="#00F0FF" />
            <Text style={styles.layerName}>
              {activeLayerId ? 'Logo_Overlay_01.png' : 'Select a layer'}
            </Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </GestureHandlerRootView>
  );
}

// Sub-component for Layer Rendering
const RenderLayer = ({ layer }: { layer: CanvasLayer }) => {
  const img = useImage(layer.uri);
  if (!img) return null;

  return (
    <Group
      origin={{ x: layer.x.value + 50, y: layer.y.value + 50 }}
      transform={[
        { translateX: layer.x.value },
        { translateY: layer.y.value },
        { scale: layer.scale.value },
        { rotate: layer.rotation.value },
      ]}
    >
      <Image image={img} x={0} y={0} width={100} height={100} fit="contain" />
    </Group>
  );
};

// Sub-component for UI Tools
const ToolCard = ({ icon: Icon, label, onPress, color }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.toolCard}>
    <View style={[styles.toolIconFrame, { borderColor: `${color}40` }]}>
      <Icon size={22} color={color} />
    </View>
    <Text style={styles.toolLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
  },
  navBlur: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: { flex: 1, alignItems: 'center' },
  navTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  exportBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  canvasContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasFrame: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#050508',
    elevation: 20,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.1,
    shadowRadius: 40,
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderStyle: 'dashed',
    borderRadius: 32,
  },
  guideLines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    marginHorizontal: CANVAS_SIZE / 3,
    borderColor: '#FFF',
  },

  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 340,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 40,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  panelTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  creditText: { color: '#F59E0B', fontWeight: '900', fontSize: 13 },

  toolsScroll: { paddingLeft: 24, gap: 16, height: 100 },
  toolCard: { width: 90, alignItems: 'center', gap: 10 },
  toolIconFrame: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toolLabel: { color: '#64748B', fontSize: 11, fontWeight: '700' },

  activeLayerBar: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  layerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  layerName: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
