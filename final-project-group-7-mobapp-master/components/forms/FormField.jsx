import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { createFormFieldStyles } from "../../styles/forms/FormField.styles";

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  secureTextEntry = false,
  keyboardType = "default",
  error = "",
  onBlur,
  onFocus,
  inputRef,
  returnKeyType = "done",
  autoCapitalize = "sentences",
  autoCorrect = false,
  editable = true,
  onSubmitEditing,
  onLayout,
}) {
  const { theme } = useApp();
  const styles = createFormFieldStyles(theme);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        onSubmitEditing={onSubmitEditing}
      />
      {error ? (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
