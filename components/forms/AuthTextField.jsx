import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { createAuthTextFieldStyles } from "../../styles/forms/AuthTextField.styles";

export default function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  showSecureToggle = false,
  isPasswordVisible = false,
  onToggleSecureEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete = "off",
  returnKeyType = "done",
  onBlur,
  onFocus,
  maxLength,
  onLayout,
  inputRef,
}) {
  const styles = createAuthTextFieldStyles();

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(226, 232, 240, 0.62)"
          style={styles.input}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          selectionColor="rgba(255, 255, 255, 0.35)"
          cursorColor="#e2e8f0"
          onBlur={onBlur}
          onFocus={onFocus}
        />
        {showSecureToggle ? (
          <Pressable onPress={onToggleSecureEntry} style={styles.toggle}>
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6a7c97"
            />
          </Pressable>
        ) : null}
      </View>
      <View pointerEvents="none" style={styles.errorWrap}>
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
