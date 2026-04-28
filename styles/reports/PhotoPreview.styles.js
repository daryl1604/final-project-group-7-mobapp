import { StyleSheet } from "react-native";

export function createPhotoPreviewStyles(theme) {
  return StyleSheet.create({
    image: {
      width: "100%",
      height: 220,
      borderRadius: 22,
      backgroundColor: theme.surfaceSoft,
    },
    galleryRow: {
      gap: 10,
    },
    galleryImage: {
      width: 260,
      height: 220,
      borderRadius: 22,
      backgroundColor: theme.surfaceSoft,
      marginRight: 10,
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
