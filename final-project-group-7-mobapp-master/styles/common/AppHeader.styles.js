import { StyleSheet } from "react-native";

export function createAppHeaderStyles(theme) {
  return StyleSheet.create({
    header: {
      paddingTop: 0,
    },
    toolbarHeader: {
      backgroundColor: theme.background,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    toolbarRow: {
      justifyContent: "flex-start",
      gap: 12,
      minHeight: 38,
    },
    textBlock: {
      flex: 1,
    },
    title: {
      color: theme.text,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.4,
    },
    toolbarTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "500",
      letterSpacing: 0,
    },
    menuButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      borderWidth: 1,
    },
    toolbarIconButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 0,
    },
  });
}
