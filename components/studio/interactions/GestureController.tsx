/**
 * @file components/studio/interactions/GestureController.tsx
 * @description AAA+ C++ Multi-Touch Physics & Gesture Orchestrator.
 * @features
 * - Bifurcated Gesture Routing: Intelligently routes gestures to Camera or Objects.
 * - Magnetic Grid Snapping: Real-time UI thread modulo math for perfect alignment.
 * - SharedValue Context: Pipes 120fps matrix data directly to the Skia GPU.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSharedValue, runOnJS, SharedValue } from 'react-native-reanimated';
import { useLayerStore } from '@/store/studio/useLayerStore';
import { useToolStore } from '@/store/studio/useToolStore';

// ============================================================================
// 1. HIGH-PERFORMANCE SHARED CONTEXT
// ============================================================================
// This context holds the live 120fps values during a gesture.
// Skia nodes will consume this to render instantly without triggering React renders.
export interface GestureContextType {
  activeX: SharedValue<number>;
  activeY: SharedValue<number>;
  activeScale: SharedValue<number>;
  activeRotation: SharedValue<number>;
  isDragging: SharedValue<boolean>;
}

export const GestureContext = createContext<GestureContextType | null>(null);

export const useGestureContext = () => {
  const ctx = useContext(GestureContext);
  if (!ctx)
    throw new Error('useGestureContext must be used within GestureController');
  return ctx;
};

// ============================================================================
// 2. MASTER GESTURE CONTROLLER
// ============================================================================
export const GestureController = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Zustand State (JS Thread)
  const layers = useLayerStore((state) => state.present.layers);
  const selectedLayerIds = useLayerStore(
    (state) => state.present.selectedLayerIds,
  );
  const updateLayer = useLayerStore((state) => state.updateLayer);
  const commitHistory = useLayerStore((state) => state.commit);

  const { activeTool, viewport, updateViewport, snapConfig } = useToolStore();

  const activeLayerId =
    selectedLayerIds.length === 1 ? selectedLayerIds[0] : null;
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // --- C++ UI THREAD SHARED VALUES ---
  const activeX = useSharedValue(0);
  const activeY = useSharedValue(0);
  const activeScale = useSharedValue(1);
  const activeRotation = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Offsets for continuous relative gestures
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  // Camera Offsets
  const camSavedX = useSharedValue(0);
  const camSavedY = useSharedValue(0);
  const camSavedZoom = useSharedValue(1);

  // Sync active layer state to UI thread when selection changes
  useEffect(() => {
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
  }, [activeLayerId, activeLayer?.transform]);

  useEffect(() => {
    camSavedX.value = viewport.x;
    camSavedY.value = viewport.y;
    camSavedZoom.value = viewport.zoom;
  }, [viewport]);

  // ============================================================================
  // 3. GESTURE DEFINITIONS & PHYSICS
  // ============================================================================

  const finalizeLayerGesture = () => {
    if (!activeLayerId || activeLayer?.locked) return;
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

  // --- PAN GESTURE (MOVE) ---
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      if (
        activeTool === 'PAN_CAMERA' ||
        (!activeLayerId && activeTool === 'SELECT')
      ) {
        // Move Camera (Inverted translation for natural dragging)
        runOnJS(updateViewport)({
          x: camSavedX.value - e.translationX / camSavedZoom.value,
          y: camSavedY.value - e.translationY / camSavedZoom.value,
        });
        return;
      }

      if (!activeLayerId || activeLayer?.locked) return;

      // Move Object (Divided by viewport zoom so the object tracks the finger perfectly)
      let rawX = savedX.value + e.translationX / camSavedZoom.value;
      let rawY = savedY.value + e.translationY / camSavedZoom.value;

      // Magnetic Snapping Engine
      if (snapConfig.enabled && snapConfig.snapToGrid) {
        const snappedX =
          Math.round(rawX / snapConfig.gridSize) * snapConfig.gridSize;
        const snappedY =
          Math.round(rawY / snapConfig.gridSize) * snapConfig.gridSize;

        rawX =
          Math.abs(rawX - snappedX) < snapConfig.tolerance ? snappedX : rawX;
        rawY =
          Math.abs(rawY - snappedY) < snapConfig.tolerance ? snappedY : rawY;
      }

      activeX.value = rawX;
      activeY.value = rawY;
    })
    .onEnd(() => {
      isDragging.value = false;
      if (activeTool === 'PAN_CAMERA' || !activeLayerId) return;
      savedX.value = activeX.value;
      savedY.value = activeY.value;
      finalizeLayerGesture();
    });

  // --- PINCH GESTURE (SCALE/ZOOM) ---
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      if (activeTool === 'PAN_CAMERA' || !activeLayerId) {
        // Zoom Camera
        const newZoom = Math.max(
          0.1,
          Math.min(camSavedZoom.value * e.scale, 5),
        );
        runOnJS(updateViewport)({ zoom: newZoom });
        return;
      }

      if (!activeLayerId || activeLayer?.locked) return;
      activeScale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (activeTool === 'PAN_CAMERA' || !activeLayerId) return;
      savedScale.value = activeScale.value;
      finalizeLayerGesture();
    });

  // --- ROTATION GESTURE (TWIST) ---
  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      if (activeTool === 'PAN_CAMERA' || !activeLayerId || activeLayer?.locked)
        return;

      let rawRot = savedRotation.value + e.rotation;

      // Magnetic Snapping for Rotation (Snaps to 45 degree / PI/4 increments)
      if (snapConfig.enabled) {
        const snapAngle = Math.PI / 4;
        const snappedRot = Math.round(rawRot / snapAngle) * snapAngle;
        if (Math.abs(rawRot - snappedRot) < 0.1) {
          rawRot = snappedRot;
        }
      }

      activeRotation.value = rawRot;
    })
    .onEnd(() => {
      if (activeTool === 'PAN_CAMERA' || !activeLayerId || activeLayer?.locked)
        return;
      savedRotation.value = activeRotation.value;
      finalizeLayerGesture();
    });

  // Compose Gestures to fire simultaneously
  const composedGestures = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    rotationGesture,
  );

  const contextValue = {
    activeX,
    activeY,
    activeScale,
    activeRotation,
    isDragging,
  };

  return (
    <GestureContext.Provider value={contextValue}>
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={composedGestures}>
          <View style={styles.container}>{children}</View>
        </GestureDetector>
      </GestureHandlerRootView>
    </GestureContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, overflow: 'hidden' },
});
