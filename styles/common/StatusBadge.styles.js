import { StyleSheet } from "react-native";

export function createStatusBadgeStyles(theme) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 86,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
  });
}
