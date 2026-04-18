import { StyleSheet } from "react-native";

export function createFeedbackThreadStyles(theme) {
  return StyleSheet.create({
    wrapper: {
      gap: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    emptyState: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 14,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    cardText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 21,
    },
    cardMeta: {
      color: theme.textSoft,
      fontSize: 12,
    },
  });
}
