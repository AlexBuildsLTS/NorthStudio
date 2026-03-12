/**
 * @file store/studio/useLayerStore.ts
 * @description The Master State Machine for the North Studio Canvas.
 * Features:
 * - Time-Travel Undo/Redo Engine (History Stack)
 * - Layer Matrix Management (X, Y, Scale, Rotation, Blend Modes)
 * - Zero-latency UI thread synchronization preparation.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid'; // Ensure you have 'uuid' installed via npm

// ============================================================================
// 1. STRICT TYPE DEFINITIONS
// ============================================================================

export type LayerType = 'IMAGE' | 'TEXT' | 'BASE_PRODUCT' | 'AI_MASK';
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn';

export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number; // in radians for Skia
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  uri?: string; // URL for images/masks
  text?: string; // Content for text layers
  transform: Transform;
  opacity: number;
  blendMode: BlendMode;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface CanvasState {
  layers: Layer[];
  selectedLayerIds: string[];
}

// ============================================================================
// 2. ZUSTAND STORE INTERFACE
// ============================================================================

interface LayerStore {
  // State
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];

  // Computed
  selectedLayers: () => Layer[];

  // Actions (Mutations)
  addLayer: (layer: Omit<Layer, 'id' | 'zIndex'>) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  reorderLayer: (
    id: string,
    direction: 'UP' | 'DOWN' | 'TOP' | 'BOTTOM',
  ) => void;

  // Time Travel
  undo: () => void;
  redo: () => void;
  commit: () => void; // Call this when a gesture ends to save state to history
}

const INITIAL_STATE: CanvasState = {
  layers: [],
  selectedLayerIds: [],
};

// ============================================================================
// 3. MASTER STORE IMPLEMENTATION
// ============================================================================

export const useLayerStore = create<LayerStore>((set, get) => ({
  past: [],
  present: INITIAL_STATE,
  future: [],

  // --- HELPERS ---
  selectedLayers: () => {
    const { present } = get();
    return present.layers.filter((l) =>
      present.selectedLayerIds.includes(l.id),
    );
  },

  // --- MUTATIONS ---
  addLayer: (layerData) => {
    const newLayer: Layer = {
      ...layerData,
      id: uuidv4(),
      zIndex: get().present.layers.length,
    };

    set((state) => ({
      past: [...state.past, state.present], // Save history
      present: {
        ...state.present,
        layers: [...state.present.layers, newLayer],
        selectedLayerIds: [newLayer.id], // Auto-select new layer
      },
      future: [], // Clear future on new action
    }));
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      present: {
        ...state.present,
        layers: state.present.layers.map((layer) =>
          layer.id === id ? { ...layer, ...updates } : layer,
        ),
      },
    }));
  },

  removeLayer: (id) => {
    set((state) => ({
      past: [...state.past, state.present],
      present: {
        ...state.present,
        layers: state.present.layers.filter((l) => l.id !== id),
        selectedLayerIds: state.present.selectedLayerIds.filter(
          (selId) => selId !== id,
        ),
      },
      future: [],
    }));
  },

  selectLayer: (id, multi = false) => {
    set((state) => {
      const { selectedLayerIds } = state.present;
      let newSelection = [id];

      if (multi) {
        if (selectedLayerIds.includes(id)) {
          newSelection = selectedLayerIds.filter((selId) => selId !== id);
        } else {
          newSelection = [...selectedLayerIds, id];
        }
      }

      return {
        present: {
          ...state.present,
          selectedLayerIds: newSelection,
        },
      };
    });
  },

  clearSelection: () => {
    set((state) => ({
      present: {
        ...state.present,
        selectedLayerIds: [],
      },
    }));
  },

  reorderLayer: (id, direction) => {
    set((state) => {
      const layers = [...state.present.layers].sort(
        (a, b) => a.zIndex - b.zIndex,
      );
      const index = layers.findIndex((l) => l.id === id);
      if (index === -1) return state;

      if (direction === 'UP' && index < layers.length - 1) {
        const temp = layers[index + 1].zIndex;
        layers[index + 1].zIndex = layers[index].zIndex;
        layers[index].zIndex = temp;
      } else if (direction === 'DOWN' && index > 0) {
        const temp = layers[index - 1].zIndex;
        layers[index - 1].zIndex = layers[index].zIndex;
        layers[index].zIndex = temp;
      } else if (direction === 'TOP') {
        layers[index].zIndex = layers[layers.length - 1].zIndex + 1;
      } else if (direction === 'BOTTOM') {
        layers[index].zIndex = layers[0].zIndex - 1;
      }

      // Re-normalize zIndexes to prevent massive gaps
      const normalizedLayers = layers
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((l, i) => ({ ...l, zIndex: i }));

      return {
        past: [...state.past, state.present],
        present: { ...state.present, layers: normalizedLayers },
        future: [],
      };
    });
  },

  // --- TIME TRAVEL (UNDO/REDO) ---
  commit: () => {
    // Call this specifically when a drag/scale gesture finishes
    set((state) => ({
      past: [...state.past, state.present],
      future: [],
    }));
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    });
  },
}));
