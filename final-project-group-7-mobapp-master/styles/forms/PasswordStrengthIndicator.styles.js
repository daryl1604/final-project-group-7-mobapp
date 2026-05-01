import { StyleSheet } from "react-native";

export function createPasswordStrengthIndicatorStyles() {
  return StyleSheet.create({
    wrapper: {
      gap: 8,
      marginTop: -2,
      marginBottom: 2,
      paddingHorizontal: 4,
      backgroundColor: "rgba(15, 23, 42, 0.24)",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(148, 163, 184, 0.14)",
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    barRow: {
      flexDirection: "row",
      gap: 8,
    },
    bar: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor: "rgba(148, 163, 184, 0.2)",
    },
    barWeak: {
      backgroundColor: "#f87171",
    },
    barMedium: {
      backgroundColor: "#fbbf24",
    },
    barStrong: {
      backgroundColor: "#34d399",
    },
    label: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
      color: "rgba(226, 232, 240, 0.72)",
    },
    labelWeak: {
      color: "#fca5a5",
    },
    labelMedium: {
      color: "#fcd34d",
    },
    labelStrong: {
      color: "#86efac",
    },
  });
}
