// components/auth/PasswordStrengthIndicator.tsx
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { NORTH_THEME } from "@/constants/theme";

interface Props {
  password?: string;
}

export const PasswordStrengthIndicator = React.memo(
  ({ password = "" }: Props) => {
    const strength = useSharedValue(0);

    useEffect(() => {
      let score = 0;
      if (password.length >= 8) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      strength.value = withSpring(score * 25, NORTH_THEME.animation.spring);
    }, [password]);

    const barStyle = useAnimatedStyle(() => ({
      width: `${strength.value}%`,
      backgroundColor: interpolateColor(
        strength.value,
        [0, 25, 50, 75, 100],
        ["#3F3F46", "#EF4444", "#F59E0B", "#EAB308", "#22C55E"],
      ),
    }));

    return (
      <View className="mt-3">
        <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <Animated.View
            style={[barStyle, { height: "100%", borderRadius: 4 }]}
          />
        </View>
        <Text
          style={{
            color: NORTH_THEME.colors.text.muted,
            fontSize: 11,
            marginTop: 6,
            fontWeight: "500",
          }}
        >
          Requires 8+ chars, uppercase, number & symbol
        </Text>
      </View>
    );
  },
);
