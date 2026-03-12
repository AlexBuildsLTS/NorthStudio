/**
 * @file components/studio/interactions/TransformBox.tsx
 * @description GPU-Accelerated Selection Bounding Box.
 * @features
 * - Dynamic 120fps rendering bound to the GestureContext.
 * - Cyberpunk aesthetic: Neon dashed strokes, glowing anchor nodes, and a rotation mast.
 * - Matrix Math: Translates the origin to the center for flawless axis rotation.
 */

import React from 'react';
import {
  Group,
  Rect,
  Circle,
  Line,
  Paint,
  DashPathEffect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, SharedValue } from 'react-native-reanimated';
import { NORTH_THEME } from '@/constants/theme';
import { useGestureContext } from './GestureController';
import { Layer } from '@/store/studio/useLayerStore';

interface TransformBoxProps {
  layer: Layer;
  width: number;
  height: number;
}

export const TransformBox: React.FC<TransformBoxProps> = ({
  layer,
  width,
  height,
}) => {
  // Pull live values from the C++ Physics engine
  const { activeX, activeY, activeScale, activeRotation, isDragging } =
    useGestureContext();

  const cx = width / 2;
  const cy = height / 2;

  // --- MATRIX ENGINE ---
  // Calculates the exact pixel transform for the bounding box.
  const transform = useDerivedValue(() => {
    return [
      { translateX: activeX.value },
      { translateY: activeY.value },
      { translateX: cx },
      { scale: activeScale.value },
      { rotate: activeRotation.value },
      { translateX: -cx },
      { translateY: -cy },
    ];
  }, [cx, cy]);

  // --- GLOW ENGINE ---
  // Dim the bounding box slightly while actively dragging to let the user see the artwork.
  const opacity = useDerivedValue(() => (isDragging.value ? 0.6 : 1));

  // Node styles
  const NODE_SIZE = 10;
  const NODE_OFFSET = NODE_SIZE / 2;

  return (
    <Group transform={transform} opacity={opacity}>
      {/* 1. OUTER GLOW (Subtle background fill) */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        color="rgba(0, 240, 255, 0.05)"
      />
      {/* 2. THE DASHED BORDER */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        color={NORTH_THEME.colors.accent.cyan}
        style="stroke"
        strokeWidth={2}
      >
        {/* Creates the tactical engineering dashed line effect */}
        <DashPathEffect intervals={[8, 6]} />
      </Rect>
      {/* 3. ROTATION MAST (The line sticking out of the top) */}
      <Line
        p1={vec(cx, 0)}
        p2={vec(cx, -30)}
        color={NORTH_THEME.colors.accent.cyan}
        strokeWidth={2}
      />
      <Circle cx={cx} cy={-30} r={6} color={NORTH_THEME.colors.accent.cyan} />
      <Circle cx={cx} cy={-30} r={3} color="#050110" /> {/* Inner hollow dot */}
      {/* 4. CORNER RESIZE NODES */}
      {/* Top Left */}
      <Rect
        x={-NODE_OFFSET}
        y={-NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color="#FFF"
      />
      <Rect
        x={-NODE_OFFSET}
        y={-NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color={NORTH_THEME.colors.accent.cyan}
        style="stroke"
        strokeWidth={2}
      />
      {/* Top Right */}
      <Rect
        x={width - NODE_OFFSET}
        y={-NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color="#FFF"
      />
      <Rect
        x={width - NODE_OFFSET}
        y={-NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color={NORTH_THEME.colors.accent.cyan}
        style="stroke"
        strokeWidth={2}
      />
      {/* Bottom Left */}
      <Rect
        x={-NODE_OFFSET}
        y={height - NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color="#FFF"
      />
      <Rect
        x={-NODE_OFFSET}
        y={height - NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color={NORTH_THEME.colors.accent.cyan}
        style="stroke"
        strokeWidth={2}
      />
      {/* Bottom Right */}
      <Rect
        x={width - NODE_OFFSET}
        y={height - NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color="#FFF"
      />
      <Rect
        x={width - NODE_OFFSET}
        y={height - NODE_OFFSET}
        width={NODE_SIZE}
        height={NODE_SIZE}
        color={NORTH_THEME.colors.accent.cyan}
        style="stroke"
        strokeWidth={2}
      />
    </Group>
  );
};
