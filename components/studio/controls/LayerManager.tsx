import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Layout,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StyledView = styled(View);
const StyledText = styled(Text);





interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  type: 'vector' | 'raster' | 'text';
}
export interface LayerMetadata {
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  rotation: number;
  scale: { x: number; y: number };
  position: { x: number; y: number };
}

interface LayerManagerProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorder: (data: Layer[]) => void;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
}) => {
  const renderLayerItem = useCallback(
    ({ item, index }: { item: Layer; index: number }) => {
      const isActive = item.id === activeLayerId;

      return (
        <Animated.View
          entering={FadeInRight.delay(index * 50)}
          exiting={FadeOutLeft}
          layout={Layout.springify()}
          className={`flex-row items-center p-3 mb-2 rounded-xl ${
            isActive
              ? 'bg-blue-600/20 border border-blue-500/50'
              : 'bg-zinc-900 border border-zinc-800'
          }`}
        >
          <TouchableOpacity
            onPress={() => onSelectLayer(item.id)}
            className="flex-1 flex-row items-center"
          >
            <Ionicons
              name={
                item.type === 'vector'
                  ? 'triangle'
                  : item.type === 'text'
                    ? 'text'
                    : 'image'
              }
              size={18}
              color={isActive ? '#3b82f6' : '#a1a1aa'}
            />
            <StyledText
              className={`ml-3 font-medium ${isActive ? 'text-blue-400' : 'text-zinc-300'}`}
            >
              {item.name}
            </StyledText>
          </TouchableOpacity>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => onToggleLock(item.id)}
              className="p-2"
            >
              <Ionicons
                name={item.isLocked ? 'lock-closed' : 'lock-open-outline'}
                size={18}
                color={item.isLocked ? '#f59e0b' : '#52525b'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onToggleVisibility(item.id)}
              className="p-2"
            >
              <Ionicons
                name={item.isVisible ? 'eye' : 'eye-off'}
                size={18}
                color={item.isVisible ? '#3b82f6' : '#52525b'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [activeLayerId, onSelectLayer, onToggleVisibility, onToggleLock],
  );

  return (
    <StyledView className="flex-1 bg-black p-4">
      <StyledView className="flex-row justify-between items-center mb-4">
        <StyledText className="text-white text-lg font-bold">Layers</StyledText>
        <TouchableOpacity className="bg-zinc-800 p-2 rounded-full">
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </StyledView>

      <FlatList
        data={layers}
        renderItem={renderLayerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        removeClippedSubviews={false} // Ensures smooth reanimated transitions
      />
    </StyledView>
  );
};

/**
 * SQL MIGRATION SCRIPT
 *
 * -- Create layers table for studio state persistence
 * CREATE TABLE IF NOT EXISTS public.studio_layers (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   layer_type TEXT CHECK (layer_type IN ('vector', 'raster', 'text')),
 *   is_visible BOOLEAN DEFAULT true,
 *   is_locked BOOLEAN DEFAULT false,
 *   z_index INTEGER NOT NULL,
 *   metadata JSONB DEFAULT '{}'::jsonb,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Enable RLS
 * ALTER TABLE public.studio_layers ENABLE ROW LEVEL SECURITY;
 *
 * -- RLS Policies
 * CREATE POLICY "Users can manage their own layers"
 *   ON public.studio_layers
 *   FOR ALL
 *   TO authenticated
 *   USING (auth.uid() = user_id)
 *   WITH CHECK (auth.uid() = user_id);
 *
 * -- Index for performance
 * CREATE INDEX idx_layers_project_id ON public.studio_layers(project_id);
 */

/**
 * ARCHITECTURAL DECISION:
 * We use Reanimated v4 Layout Transitions for the Layer Manager to ensure 60fps
 * performance during list reordering and state toggles.
 * NO BlurView is used to maintain APK stability and cross-platform parity.
 * The UI uses a solid zinc-900/black palette with opacity-based borders
 * for a premium "Studio" feel without the performance overhead of Gaussian blurs.
 */

export const LayerEmptyState: React.FC = () => (
  <StyledView className="flex-1 items-center justify-center p-8">
    <StyledView className="w-16 h-16 bg-zinc-900 rounded-full items-center justify-center mb-4 border border-zinc-800">
      <Ionicons name="layers-outline" size={24} color="#52525b" />
    </StyledView>
    <StyledText className="text-zinc-400 text-center">
      No layers yet. Tap the + button to add your first layer and start
      creating!
    </StyledText>
  </StyledView>
);

/**
 * REANIMATED V4 DRAG & DROP LOGIC (CONCEPTUAL)
 * Note: In a production environment, we use Reanimated's shared values
 * to track the active drag position and update the z-index/transform
 * of the layer item for fluid 60fps movement.
 */

export const LayerActionToolbar: React.FC<{
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  activeLayerId: string | null;
}> = ({ onDuplicate, onDelete, activeLayerId }) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withSpring(activeLayerId ? 1 : 0);
  }, [activeLayerId]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withSpring(activeLayerId ? 0 : 20) }],
  }));

  if (!activeLayerId) return null;

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute bottom-6 left-4 right-4 flex-row justify-around bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl"
    >
      <TouchableOpacity
        onPress={() => onDuplicate(activeLayerId)}
        className="items-center"
      >
        <Ionicons name="copy-outline" size={20} color="#a1a1aa" />
        <StyledText className="text-zinc-500 text-xs mt-1">
          Duplicate
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity className="items-center">
        <Ionicons name="color-palette-outline" size={20} color="#a1a1aa" />
        <StyledText className="text-zinc-500 text-xs mt-1">Style</StyledText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDelete(activeLayerId)}
        className="items-center"
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
        <StyledText className="text-red-500 text-xs mt-1">Delete</StyledText>
      </TouchableOpacity>
    </Animated.View>
  );
};
