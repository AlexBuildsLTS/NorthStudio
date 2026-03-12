/**
 * @file components/studio/engine/SkiaCanvas.tsx
 * @description The Master 120fps C++ Canvas Engine.
 * Features: Simultaneous Multi-Touch (Pan/Pinch/Rotate), Native-Thread state linking.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Fill } from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

import { useLayerStore } from '@/store/studio/useLayerStore';
import { LayerNode } from './LayerNode';

export const SkiaCanvas = () => {
  // Connect to Zustand State Machine
  const layers = useLayerStore((state) => state.present.layers);
  const selectedLayerIds = useLayerStore(
    (state) => state.present.selectedLayerIds,
  );
  const updateLayer = useLayerStore((state) => state.updateLayer);
  const commitHistory = useLayerStore((state) => state.commit);

  const activeLayerId =
    selectedLayerIds.length === 1 ? selectedLayerIds[0] : null;
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // --- NATIVE THREAD SHARED VALUES ---
  // These hold the live, 120fps state during a gesture.
  const activeX = useSharedValue(0);
  const activeY = useSharedValue(0);
  const activeScale = useSharedValue(1);
  const activeRotation = useSharedValue(0);

  // Offset storage for continuous gestures
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  // Sync SharedValues with the Zustand store when the active layer changes
  React.useEffect(() => {
    if (activeLayer && !activeLayer.locked) {
      activeX.value = activeLayer.transform.x;
      activeY.value = activeLayer.transform.y;
      activeScale.value = activeLayer.transform.scale;
      activeRotation.value = activeLayer.transform.rotation;

      savedX.value = activeLayer.transform.x;
      savedY.value = activeLayer.transform.y;
      savedScale.value = activeLayer.transform.scale;
      savedRotation.value = activeLayer.transform.rotation;
    }
  }, [activeLayerId, activeLayer?.transform]); // Only re-run if ID or DB transform changes

  // --- GESTURE DEFINITIONS ---

  // Shared callback for gesture completion
  const handleGestureEnd = () => {
    if (!activeLayerId || activeLayer?.locked) return;

    // When the user lifts their fingers, we send the final coordinates
    // across the bridge to Zustand, and trigger a History Commit for Undo/Redo.
    runOnJS(updateLayer)(activeLayerId, {
      transform: {
        x: activeX.value,
        y: activeY.value,
        scale: activeScale.value,
        rotation: activeRotation.value,
      },
    });
    runOnJS(commitHistory)();
  };

  // 1. PAN (Dragging)
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!activeLayerId || activeLayer?.locked) return;
      activeX.value = savedX.value + e.translationX;
      activeY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      if (!activeLayerId || activeLayer?.locked) return;
      savedX.value = activeX.value;
      savedY.value = activeY.value;
      handleGestureEnd();
    });

  // 2. PINCH (Scaling)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      if (!activeLayerId || activeLayer?.locked) return;
      activeScale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (!activeLayerId || activeLayer?.locked) return;
      savedScale.value = activeScale.value;
      handleGestureEnd();
    });

  // 3. ROTATION (Twisting)
  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      if (!activeLayerId || activeLayer?.locked) return;
      activeRotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      if (!activeLayerId || activeLayer?.locked) return;
      savedRotation.value = activeRotation.value;
      handleGestureEnd();
    });

  // Combine gestures to work simultaneously
  const composedGestures = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    rotationGesture,
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <GestureDetector gesture={composedGestures}>
        <View style={styles.container}>
          <Canvas style={styles.canvas}>
            {/* The Deep Void Background */}
            <Fill color="#05030A" />

            {/* Layer rendering loop */}
            {layers.map((layer) => {
              const isActive = layer.id === activeLayerId;
              return (
                <LayerNode
                  key={layer.id}
                  layer={layer}
                  isActive={isActive}
                  activeX={activeX}
                  activeY={activeY}
                  activeScale={activeScale}
                  activeRotation={activeRotation}
                />
              );
            })}
          </Canvas>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#05030A',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)', // Neon Cyan Engine Glow
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
