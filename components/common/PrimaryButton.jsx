import { ActivityIndicator, Pressable, Text } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { createPrimaryButtonStyles } from "../../styles/common/PrimaryButton.styles";

export default function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
}) {
  const { theme } = useApp();
  const styles = createPrimaryButtonStyles(theme);
  const currentVariant = styles[variant] || styles.primary;

  return (
    <Pressable
      style={[
        styles.pressable,
        styles.button,
        currentVariant,
        disabled || loading ? styles.buttonDisabled : null,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: "transparent" }}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}
