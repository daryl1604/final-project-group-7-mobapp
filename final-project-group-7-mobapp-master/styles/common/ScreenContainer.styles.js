import { StyleSheet } from "react-native";

export function createScreenContainerStyles(theme, insets) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    wrapper: {
      flex: 1,
    },
    headerSlot: {
      zIndex: 1,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 108 + insets.bottom,
      gap: 16,
    },
  });
}
