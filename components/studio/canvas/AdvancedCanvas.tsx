import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useCanvasStore } from '@/store/useCanvasStore';

const SPRING_CONFIG = { damping: 15, stiffness: 120 };

export const AdvancedCanvas = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { layers, selectedLayerId, updateLayer } = useCanvasStore();

  // Base Mockup Constants
  const canvasSize = screenWidth - 32;

  return (
    <GestureHandlerRootView
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={[
          styles.canvasContainer,
          { width: canvasSize, height: canvasSize },
        ]}
      >
        {/* Base Mockup - Background Layer */}
        <Image
          source="https://placeholder.com/hoodie-base.png" // Replace with real asset
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        {/* Interactive Logo Layers */}
        {layers.map((layer) => (
          <TransformableLayer key={layer.id} layer={layer} />
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const TransformableLayer = ({ layer }: { layer: any }) => {
  const offset = useSharedValue({ x: layer.x, y: layer.y });
  const scale = useSharedValue(layer.scale);
  const rotation = useSharedValue(layer.rotation);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value.x },
      { translateY: offset.value.y },
      { scale: scale.value },
      { rotate: `${(rotation.value * 180) / Math.PI}deg` },
    ],
  }));

  const dragGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      offset.value = {
        x: e.translationX + layer.x,
        y: e.translationY + layer.y,
      };
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = startScale.value * e.scale;
    });

  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      startRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRotation.value + e.rotation;
    });

  const composed = Gesture.Race(
    dragGesture,
    Gesture.Simultaneous(pinchGesture, rotateGesture),
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.layerWrapper, animatedStyle]}>
        <Image
          source={layer.url}
          style={styles.logoImage}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  canvasContainer: {
    backgroundColor: '#1A1A1A', // High-contrast dark background
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  layerWrapper: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
