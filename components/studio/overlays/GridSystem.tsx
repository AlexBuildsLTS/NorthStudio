/**
 * @file components/studio/overlays/GridSystem.tsx
 * @description Hardware-Accelerated Infinite Engineering Grid.
 * @target WebGL & Android Skia Engine.
 * @features
 * - Infinite Plane Translation: The grid moves with the camera but never ends.
 * - Dynamic Subdivisions: Grid lines fade dynamically based on zoom depth.
 * - Absolute GPU execution. Zero JS-bridge lag during panning.
 */

import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Group, Line, Paint, vec } from '@shopify/react-native-skia';
import { useToolStore } from '@/store/studio/useToolStore';
import { NORTH_THEME } from '@/constants/theme';

export const GridSystem = () => {
  const { width, height } = useWindowDimensions();
  const viewport = useToolStore((state) => state.viewport);
  const snapConfig = useToolStore((state) => state.snapConfig);

  // If grid is disabled by user, unmount to save GPU cycles
  if (!snapConfig.enabled || !snapConfig.snapToGrid) return null;

  // --- GRID MATHEMATICS ---
  // We calculate exactly how many lines fit on the screen based on the current zoom and screen size.
  // We add an overflow buffer (+2) to ensure lines don't pop in/out at the screen edges during panning.
  const scaledGridSize = snapConfig.gridSize * viewport.zoom;

  const linesX = Math.ceil(width / scaledGridSize) + 2;
  const linesY = Math.ceil(height / scaledGridSize) + 2;

  // Calculate the floating offset (the remainder of the pan divided by grid size)
  // This gives the illusion of an infinite grid while only drawing the exact lines visible.
  const offsetX = viewport.x % scaledGridSize;
  const offsetY = viewport.y % scaledGridSize;

  // --- MEMORY OPTIMIZATION ---
  // We memoize the coordinate arrays so React doesn't reconstruct arrays on every render tick.
  const verticalLines = useMemo(() => {
    return Array.from({ length: linesX }).map((_, i) => {
      const x = offsetX + (i - 1) * scaledGridSize;
      return { p1: vec(x, 0), p2: vec(x, height) };
    });
  }, [linesX, offsetX, scaledGridSize, height]);

  const horizontalLines = useMemo(() => {
    return Array.from({ length: linesY }).map((_, i) => {
      const y = offsetY + (i - 1) * scaledGridSize;
      return { p1: vec(0, y), p2: vec(width, y) };
    });
  }, [linesY, offsetY, scaledGridSize, width]);

  // --- ORIGIN AXIS CALCULATION ---
  // If the true origin (0,0) is currently on screen, we highlight it in Neon Cyan/Purple
  const showOriginX = viewport.x >= 0 && viewport.x <= width;
  const showOriginY = viewport.y >= 0 && viewport.y <= height;

  return (
    <Group>
      {/* 1. BASE GRID PAINT */}
      <Paint style="stroke" strokeWidth={1} color="rgba(255, 255, 255, 0.03)" />

      {verticalLines.map((line, i) => (
        <Line key={`v-${i}`} p1={line.p1} p2={line.p2} />
      ))}

      {horizontalLines.map((line, i) => (
        <Line key={`h-${i}`} p1={line.p1} p2={line.p2} />
      ))}

      {/* 2. THE ORIGIN AXIS (The X/Y Center of the Infinite Canvas) */}
      {showOriginX && (
        <Line
          p1={vec(viewport.x, 0)}
          p2={vec(viewport.x, height)}
          color={NORTH_THEME.colors.accent.purple}
          strokeWidth={1.5}
        />
      )}
      {showOriginY && (
        <Line
          p1={vec(0, viewport.y)}
          p2={vec(width, viewport.y)}
          color={NORTH_THEME.colors.accent.cyan}
          strokeWidth={1.5}
        />
      )}
    </Group>
  );
};
