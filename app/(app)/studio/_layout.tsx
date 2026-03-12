/**
 * @file components/studio/engine/SkiaCanvas.tsx
 * @description The Master 120fps GPU Rendering Surface.
 * @features
 * - Infinite Viewport Camera (Pan & Zoom the entire scene).
 * - Layer Rendering Loop (Mounts Skia textures).
 * - Neon Transform HUD (Renders strictly over the active object).
 */

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Fill, Group } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

// --- STORES & CONTEXTS ---
import { useLayerStore } from '@/store/studio/useLayerStore';
import { useToolStore } from '@/store/studio/useToolStore';
import { useGestureContext } from '@/components/studio/interactions/GestureController';

// --- RENDER NODES ---
import { LayerNode } from '@/components/studio/engine/LayerNode';
import { TransformBox } from '@/components/studio/interactions/TransformBox';
import { GridSystem } from '@/components/studio/overlays/GridSystem';

/**
 * @file components/studio/engine/SkiaCanvas.tsx
 * @description The Master 120fps GPU Rendering Surface.
 */

export const SkiaCanvas = () => {
  const { width, height } = useWindowDimensions();

  // 1. ZUSTAND STATE
  const layers = useLayerStore((state) => state.present.layers);
  const selectedLayerIds = useLayerStore(
    (state) => state.present.selectedLayerIds,
  );
  const viewport = useToolStore((state) => state.viewport);

  // Determine Active Target
  const activeLayerId =
    selectedLayerIds.length === 1 ? selectedLayerIds[0] : null;
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // 2. GESTURE ENGINE CONTEXT (120fps C++ Values)
  const gestureContext = useGestureContext();

  // 3. CAMERA VIEWPORT MATH
  // This transform applies to the entire group, allowing infinite panning and zooming
  const cameraTransform = useDerivedValue(() => {
    return [
      { translateX: viewport.x },
      { translateY: viewport.y },
      { scale: viewport.zoom },
    ];
  }, [viewport]);

  return (
    <Canvas style={styles.canvas}>
      {/* BASE LAYER: Deep Space Void */}
      <Fill color="#05030A" />

      {/* CAMERA GROUP: 
        Everything inside this Group moves when the user pans or zooms the camera. 
      */}
      <Group transform={cameraTransform}>
        {/* 1. THE INFINITE GRID */}
        <GridSystem />

        {/* 2. THE RENDER LOOP (Back to Front) */}
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <LayerNode
              key={layer.id}
              layer={layer}
              isActive={isActive}
              activeX={gestureContext.activeX}
              activeY={gestureContext.activeY}
              activeScale={gestureContext.activeScale}
              activeRotation={gestureContext.activeRotation}
            />
          );
        })}

        {/* 3. THE TRANSFORM HUD (Always on top) */}
        {activeLayer && (
          <TransformBox
            layer={activeLayer}
            // We pass arbitrary default dimensions for the box.
            // In a fully dynamic system, this would read the SkiaImage bounds.
            width={200}
            height={200}
          />
        )}
      </Group>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
