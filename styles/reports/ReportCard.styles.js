import { StyleSheet } from "react-native";

export function createReportCardStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
      elevation: 4,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    titleGroup: {
      flex: 1,
      gap: 6,
      minWidth: 0,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      lineHeight: 24,
      flexShrink: 1,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "nowrap",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    metaPill: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
      backgroundColor: theme.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      flexShrink: 1,
      maxWidth: "72%",
      overflow: "hidden",
    },
    meta: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      flexShrink: 0,
    },
    description: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 21,
    },
    metaInfoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metaInfoChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    metaInfoText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    location: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    footer: {
      marginTop: 4,
    },
  });
}
