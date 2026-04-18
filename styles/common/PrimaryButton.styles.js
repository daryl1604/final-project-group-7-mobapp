import { StyleSheet } from "react-native";

export function createPrimaryButtonStyles(theme) {
  return StyleSheet.create({
    pressable: {
      width: "100%",
    },
    button: {
      minHeight: 60,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
    label: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.25,
    },
    primary: {
      backgroundColor: theme.primary,
      borderWidth: 1,
      borderColor: theme.primaryPressed,
    },
    secondary: {
      backgroundColor: theme.secondary,
    },
    buttonDisabled: {
      opacity: 0.58,
      backgroundColor: theme.textSoft,
      borderColor: theme.border,
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}
