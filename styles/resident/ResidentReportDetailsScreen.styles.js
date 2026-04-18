import { StyleSheet } from "react-native";

export function createResidentReportDetailsStyles(theme) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 16,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 18,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    value: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 15,
    },
    secondaryButton: {
      backgroundColor: theme.primarySoft,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: theme.primary,
      fontWeight: "700",
      fontSize: 15,
    },
    confirmationRow: {
      gap: 10,
    },
    confirmButton: {
      backgroundColor: theme.success,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    disputeButton: {
      backgroundColor: theme.danger,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    actionButtonText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 15,
    },
  });
}
