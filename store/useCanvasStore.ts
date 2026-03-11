import { create } from 'zustand';

interface Layer {
  id: string;
  type: 'image' | 'text';
  url?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

interface CanvasState {
  layers: Layer[];
  selectedLayerId: string | null;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  setSelectedLayer: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  layers: [],
  selectedLayerId: null,
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  setSelectedLayer: (id) => set({ selectedLayerId: id }),
}));
