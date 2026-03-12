/**
 * @file store/studio/useToolStore.ts
 * @description AAA+ Master Canvas Environment & Tool State Machine.
 * @features
 * - Strict Mode Management: Ensures touch events route to the correct engine (Camera vs Object).
 * - Magnetic Snapping Config: Granular control over mathematical snapping thresholds.
 * - Global Viewport Tracking: Syncs the camera coordinates across the React and C++ boundaries.
 */

import { create } from 'zustand';

// --- STRICT TYPING ---
export type StudioTool = 'SELECT' | 'PAN_CAMERA' | 'AI_BRUSH' | 'ERASER';

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface SnapSettings {
  enabled: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  gridSize: number;
  tolerance: number; // Pixel distance before magnetic snap engages
}

interface ToolState {
  activeTool: StudioTool;
  viewport: ViewportTransform;
  snapConfig: SnapSettings;

  // Actions
  setTool: (tool: StudioTool) => void;
  updateViewport: (transform: Partial<ViewportTransform>) => void;
  updateSnapConfig: (config: Partial<SnapSettings>) => void;
  resetViewport: () => void;
}

const INITIAL_VIEWPORT: ViewportTransform = { x: 0, y: 0, zoom: 1 };
const INITIAL_SNAP: SnapSettings = {
  enabled: true,
  snapToGrid: true,
  snapToObjects: true,
  gridSize: 20, // 20px physical grid
  tolerance: 8, // 8px magnetic pull radius
};

// --- STORE IMPLEMENTATION ---
export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'SELECT',
  viewport: INITIAL_VIEWPORT,
  snapConfig: INITIAL_SNAP,

  setTool: (tool) => set({ activeTool: tool }),

  updateViewport: (transform) =>
    set((state) => ({
      viewport: { ...state.viewport, ...transform },
    })),

  updateSnapConfig: (config) =>
    set((state) => ({
      snapConfig: { ...state.snapConfig, ...config },
    })),

  resetViewport: () => set({ viewport: INITIAL_VIEWPORT }),
}));
