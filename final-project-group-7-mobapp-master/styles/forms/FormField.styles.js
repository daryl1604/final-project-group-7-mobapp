import { StyleSheet } from "react-native";

export function createFormFieldStyles(theme) {
  return StyleSheet.create({
    wrapper: {
      gap: 8,
    },
    label: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
    },
    input: {
      backgroundColor: theme.inputBackground,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: theme.inputText,
      fontSize: 15,
    },
    inputFocused: {
      borderColor: theme.primary,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 4,
    },
    inputError: {
      borderColor: theme.danger,
    },
    inputMultiline: {
      minHeight: 110,
    },
    messageBox: {
      backgroundColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.12)" : "#fef2f2",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(252, 165, 165, 0.22)" : "#fecaca",
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginTop: 2,
    },
    errorText: {
      color: theme.danger,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
    },
  });
}
