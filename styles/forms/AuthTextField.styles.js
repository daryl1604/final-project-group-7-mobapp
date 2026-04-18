import { StyleSheet } from "react-native";

export function createAuthTextFieldStyles() {
  return StyleSheet.create({
    wrapper: {
      gap: 7,
    },
    label: {
      color: "rgba(241, 245, 249, 0.92)",
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.15,
    },
    inputShell: {
      minHeight: 58,
      borderRadius: 18,
      borderWidth: 1.25,
      borderColor: "rgba(255, 255, 255, 0.14)",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      paddingLeft: 16,
      paddingRight: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    inputShellError: {
      borderColor: "rgba(248, 113, 113, 0.9)",
      backgroundColor: "rgba(127, 29, 29, 0.2)",
    },
    input: {
      flex: 1,
      color: "#f8fafc",
      fontSize: 15,
      paddingVertical: 14,
    },
    toggle: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
    },
    errorText: {
      color: "#fecaca",
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
    },
    errorWrap: {
      minHeight: 18,
      justifyContent: "center",
    },
    errorCard: {
      backgroundColor: "rgba(127, 29, 29, 0.28)",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.32)",
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
  });
}
