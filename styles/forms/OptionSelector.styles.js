import { StyleSheet } from "react-native";

export function createOptionSelectorStyles(theme, variant = "default") {
  const isAuth = variant === "auth";
  const isChips = variant === "chips";
  const isProfileGrid = variant === "profileGrid";
  const authShellBackground = "rgba(255, 255, 255, 0.08)";
  const authShellBorder = "rgba(255, 255, 255, 0.14)";
  const authOptionBackground = "rgba(15, 23, 42, 0.58)";
  const authOptionBorder = "rgba(255, 255, 255, 0.08)";

  return StyleSheet.create({
    wrapper: {
      gap: 8,
    },
    label: {
      color: isAuth ? "rgba(241, 245, 249, 0.92)" : theme.textMuted,
      fontSize: isAuth ? 13 : 14,
      fontWeight: "700",
      letterSpacing: 0.15,
    },
    options: {
      backgroundColor: isAuth || isChips ? "transparent" : theme.inputBackground,
      borderRadius: 18,
      borderWidth: isAuth || isChips ? 0 : 1,
      borderColor: isAuth || isChips ? "transparent" : theme.border,
      padding: isAuth || isChips ? 0 : 10,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: isProfileGrid ? "center" : "flex-start",
    },
    option: {
      minHeight: isAuth ? 46 : 44,
      backgroundColor: isAuth ? authOptionBackground : isChips ? "transparent" : theme.surfaceSoft,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isAuth ? authOptionBorder : isChips ? theme.border : theme.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      minWidth: isAuth ? 0 : isChips ? 0 : isProfileGrid ? 0 : 96,
      flexBasis: isAuth ? "31%" : isProfileGrid ? "47.8%" : undefined,
      flexGrow: isAuth || isProfileGrid ? 1 : 0,
    },
    optionActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primaryPressed,
      ...(isChips
        ? {}
        : {
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 3,
          }),
    },
    optionText: {
      color: isAuth ? "rgba(241, 245, 249, 0.92)" : theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    optionTextActive: {
      color: "#ffffff",
    },
  });
}
