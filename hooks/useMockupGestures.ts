/**
 * @file hooks/useMockupGestures.ts
 * @description AAA+ Gesture Controller for the Skia Engine.
 */

import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

export const useMockupGestures = () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Offset values to prevent "jumping" when starting a new gesture
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const offsetScale = useSharedValue(1);
  const offsetRotate = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + offsetX.value;
      translateY.value = event.translationY + offsetY.value;
    })
    .onEnd(() => {
      translateX.value = withSpring(translateX.value, { damping: 20 });
      translateY.value = withSpring(translateY.value, { damping: 20 });
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      offsetScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = event.scale * offsetScale.value;
    });

  const rotateGesture = Gesture.Rotation()
    .onBegin(() => {
      offsetRotate.value = rotate.value;
    })
    .onUpdate((event) => {
      rotate.value = event.rotation + offsetRotate.value;
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotateGesture),
  );

  return {
    composed,
    transform: {
      translateX,
      translateY,
      scale,
      rotate,
    },
  };
};
