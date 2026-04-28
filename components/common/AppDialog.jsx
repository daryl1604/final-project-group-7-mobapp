import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";

function getToneStyles(theme, variant) {
  if (variant === "success") {
    return {
      iconBackground: theme.mode === "dark" ? "rgba(52, 211, 153, 0.16)" : "rgba(5, 150, 105, 0.1)",
      iconColor: theme.success,
      borderColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.18)" : "rgba(5, 150, 105, 0.14)",
    };
  }

  if (variant === "danger") {
    return {
      iconBackground: theme.mode === "dark" ? "rgba(248, 113, 113, 0.16)" : "rgba(220, 38, 38, 0.1)",
      iconColor: theme.danger,
      borderColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.2)" : "rgba(220, 38, 38, 0.16)",
    };
  }

  return {
    iconBackground: theme.primarySoft,
    iconColor: theme.primary,
    borderColor: theme.border,
  };
}

export default function AppDialog() {
  const { dialogConfig, hideDialog, pressDialogButton, theme } = useApp();

  if (!dialogConfig) {
    return null;
  }

  const tone = getToneStyles(theme, dialogConfig.variant);
  const styles = createStyles(theme, tone);

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={() => {
        if (dialogConfig.dismissible !== false) {
          hideDialog();
        }
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (dialogConfig.dismissible !== false) {
              hideDialog();
            }
          }}
        />
        <View style={styles.card}>
          {dialogConfig.dismissible !== false ? (
            <Pressable style={styles.closeButton} onPress={hideDialog} hitSlop={10}>
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          ) : null}
          <View style={styles.iconWrap}>
            <View style={styles.iconDot} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{dialogConfig.title}</Text>
            {dialogConfig.message ? <Text style={styles.message}>{dialogConfig.message}</Text> : null}
          </View>
          <View style={styles.actionRow}>
            {dialogConfig.buttons?.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                style={[
                  styles.actionButton,
                  button.variant === "danger"
                    ? styles.actionButtonDanger
                    : button.variant === "secondary"
                      ? styles.actionButtonSecondary
                      : styles.actionButtonPrimary,
                ]}
                onPress={() => pressDialogButton(button)}
              >
                <Text
                  style={[
                    styles.actionText,
                    button.variant === "danger"
                      ? styles.actionTextDanger
                      : button.variant === "secondary"
                        ? styles.actionTextSecondary
                        : styles.actionTextPrimary,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme, tone) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    card: {
      position: "relative",
      width: "100%",
      maxWidth: 380,
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: tone.borderColor,
      padding: 22,
      gap: 18,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 10,
    },
    closeButton: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 2,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: tone.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    iconDot: {
      width: 12,
      height: 12,
      borderRadius: 999,
      backgroundColor: tone.iconColor,
    },
    textBlock: {
      gap: 10,
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    message: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 23,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    actionButton: {
      minHeight: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: 110,
    },
    actionButtonPrimary: {
      backgroundColor: theme.primary,
      borderColor: theme.primaryPressed,
    },
    actionButtonSecondary: {
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.border,
    },
    actionButtonDanger: {
      backgroundColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.1)" : "rgba(220, 38, 38, 0.08)",
      borderColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.22)" : "rgba(220, 38, 38, 0.18)",
    },
    actionText: {
      fontSize: 14,
      fontWeight: "800",
      textAlign: "center",
    },
    actionTextPrimary: {
      color: "#ffffff",
    },
    actionTextSecondary: {
      color: theme.text,
    },
    actionTextDanger: {
      color: theme.danger,
    },
  });
}
