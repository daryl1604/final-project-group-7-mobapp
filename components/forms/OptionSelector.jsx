import { Pressable, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { createOptionSelectorStyles } from "../../styles/forms/OptionSelector.styles";

export default function OptionSelector({
  label,
  options,
  value,
  onChange,
  onLayout,
  variant = "default",
}) {
  const { theme } = useApp();
  const styles = createOptionSelectorStyles(theme, variant);

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const optionValue = option.value || option;
          const optionLabel = option.label || option;
          const active = optionValue === value;

          return (
            <Pressable
              key={optionValue}
              style={[styles.option, active ? styles.optionActive : null]}
              onPress={() => onChange(optionValue)}
            >
              <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>
                {optionLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
