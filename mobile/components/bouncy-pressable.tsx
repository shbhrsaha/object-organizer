import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export const BouncyPressable = ({
  children,
  onPress,
  onLongPress,
  delayLongPress,
  onPressIn,
  onPressOut,
  style,
  disabled,
}: Props) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.96, { damping: 12, stiffness: 220 });
        onPressIn?.();
      }}
      onPressOut={() => {
        if (disabled) return;
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        onPressOut?.();
      }}
      disabled={disabled}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};
