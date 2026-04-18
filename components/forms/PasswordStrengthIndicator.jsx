import { Text, View } from "react-native";
import { createPasswordStrengthIndicatorStyles } from "../../styles/forms/PasswordStrengthIndicator.styles";

export default function PasswordStrengthIndicator({ strength }) {
  const styles = createPasswordStrengthIndicatorStyles();

  if (!strength) {
    return null;
  }

  const activeBars = strength.tone === "weak" ? 1 : strength.tone === "medium" ? 2 : 3;

  return (
    <View style={styles.wrapper}>
      <View style={styles.barRow}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.bar,
              index < activeBars ? styles[`bar${strength.tone[0].toUpperCase()}${strength.tone.slice(1)}`] : null,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, styles[`label${strength.tone[0].toUpperCase()}${strength.tone.slice(1)}`]]}>
        Password strength: {strength.label}
      </Text>
    </View>
  );
}
