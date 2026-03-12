/**
 * @file components/studio/engine/LayerNode.tsx
 * @description Hardware-Accelerated Skia Node.
 * Handles GPU texture loading and 120fps matrix transformations.
 */

import React from 'react';
import {
  Group,
  Image as SkiaImage,
  useImage,
  Rect,
  DashPathEffect,
  Paint,
} from '@shopify/react-native-skia';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Layer } from '@/store/studio/useLayerStore';
import { NORTH_THEME } from '@/constants/theme';

interface LayerNodeProps {
  layer: Layer;
  isActive: boolean;
  // Live gesture values from the UI thread (120fps)
  activeX: SharedValue<number>;
  activeY: SharedValue<number>;
  activeScale: SharedValue<number>;
  activeRotation: SharedValue<number>;
}

export const LayerNode: React.FC<LayerNodeProps> = ({
  layer,
  isActive,
  activeX,
  activeY,
  activeScale,
  activeRotation,
}) => {
  // 1. Load texture into GPU memory.
  // If no URI is provided (e.g., waiting for AI), we render null safely.
  const image = useImage(
    layer.uri ||
      'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/image.png',
  );

  // We assume a default size for bounding boxes if image is loading
  const imgWidth = image ? image.width() : 200;
  const imgHeight = image ? image.height() : 200;
  const cx = imgWidth / 2;
  const cy = imgHeight / 2;

  // 2. Matrix Math Engine
  // We use useDerivedValue so the transform updates on the native thread without triggering React renders.
  const transform = useDerivedValue(() => {
    // If active, combine the base transform with the live gesture delta
    const currentX = isActive ? activeX.value : layer.transform.x;
    const currentY = isActive ? activeY.value : layer.transform.y;
    const currentScale = isActive ? activeScale.value : layer.transform.scale;
    const currentRot = isActive
      ? activeRotation.value
      : layer.transform.rotation;

    return [
      { translateX: currentX },
      { translateY: currentY },
      // Translate to center, apply scale/rotate, translate back. This ensures scaling/rotating from the center.
      { translateX: cx },
      { scale: currentScale },
      { rotate: currentRot },
      { translateX: -cx },
      { translateY: -cy },
    ];
  }, [isActive, layer.transform, cx, cy]);

  // Map blend mode, filtering out unsupported values like "normal"
  // Convert kebab-case to camelCase for Skia compatibility
  const convertBlendMode = (mode: string | undefined) => {
    if (!mode || mode === 'normal') return undefined;
    return mode.replace(/-([a-z])/g, (_, char) => char.toUpperCase()) as any;
  };
  const validBlendMode = convertBlendMode(layer.blendMode);

  if (!layer.visible) return null;

  return (
<Group transform={transform} blendMode={layer.blendMode as any}>
      {/* The Actual Texture */}
      {image && (
        <SkiaImage
          image={image}
          x={0}
          y={0}
          width={imgWidth}
          height={imgHeight}
          opacity={layer.opacity}
        />
      )}

      {/* Bounding Box / Selection Outline (Only visible when selected) */}
      {isActive && (
        <Group>
          {/* Subtle glow behind the dashed line */}
          <Rect
            x={0}
            y={0}
            width={imgWidth}
            height={imgHeight}
            color="rgba(0, 240, 255, 0.1)"
            style="fill"
          />

          {/* Cyan Dashed Stroke */}
          <Rect
            x={0}
            y={0}
            width={imgWidth}
            height={imgHeight}
            color={NORTH_THEME.colors.accent.cyan}
            style="stroke"
            strokeWidth={2}
          >
            <DashPathEffect intervals={[8, 8]} />
          </Rect>

          {/* Corner Handles for visual feedback */}
          <Rect x={-4} y={-4} width={8} height={8} color="#FFF" />
          <Rect x={imgWidth - 4} y={-4} width={8} height={8} color="#FFF" />
          <Rect x={-4} y={imgHeight - 4} width={8} height={8} color="#FFF" />
          <Rect
            x={imgWidth - 4}
            y={imgHeight - 4}
            width={8}
            height={8}
            color="#FFF"
          />
        </Group>
      )}
    </Group>
  );
};
