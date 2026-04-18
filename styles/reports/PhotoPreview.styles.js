import { StyleSheet } from "react-native";

export function createPhotoPreviewStyles(theme) {
  return StyleSheet.create({
    image: {
      width: "100%",
      height: 220,
      borderRadius: 22,
      backgroundColor: theme.surfaceSoft,
    },
    emptyState: {
      height: 120,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
