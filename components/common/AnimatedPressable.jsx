import { Pressable, View } from "react-native";

export default function AnimatedPressable({
  children,
  style,
  contentStyle,
  onPress,
  disabled = false,
  onPressIn,
  onPressOut,
  ...rest
}) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      android_ripple={null}
      style={style}
    >
      <View style={contentStyle}>
        {children}
      </View>
    </Pressable>
  );
}
