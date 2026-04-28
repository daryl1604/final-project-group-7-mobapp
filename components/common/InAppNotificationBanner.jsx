import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../storage/AppProvider";

function getNotificationTone(type, theme) {
  if (type === "account") {
    return { icon: "person-add-outline", color: theme.primary, bg: theme.primarySoft };
  }

  if (type === "deleted_account") {
    return { icon: "person-remove-outline", color: theme.danger, bg: theme.dangerSoft };
  }

  if (type === "reply" || type === "feedback") {
    return { icon: "chatbubble-ellipses-outline", color: "#a855f7", bg: "rgba(168, 85, 247, 0.14)" };
  }

  if (type === "announcement") {
    return { icon: "megaphone-outline", color: "#f97316", bg: "rgba(249, 115, 22, 0.14)" };
  }

  if (type === "deleted_report") {
    return { icon: "trash-outline", color: theme.danger, bg: theme.dangerSoft };
  }

  if (type === "status") {
    return { icon: "document-text-outline", color: theme.success, bg: "rgba(5, 150, 105, 0.14)" };
  }

  return { icon: "notifications-outline", color: "#f7b234", bg: "rgba(247, 178, 52, 0.14)" };
}

export default function InAppNotificationBanner() {
  const { inAppNotification, hideInAppNotification, theme } = useApp();
  const insets = useSafeAreaInsets();

  if (!inAppNotification) {
    return null;
  }

  const tone = getNotificationTone(inAppNotification.type, theme);
  const styles = createStyles(theme, tone, insets.top);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={hideInAppNotification}>
      <View pointerEvents="box-none" style={styles.portal}>
        <Pressable style={styles.card} onPress={hideInAppNotification}>
          <View style={styles.glow} />
          <View style={styles.iconWrap}>
            <Ionicons name={tone.icon} size={20} color={tone.color} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {inAppNotification.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {inAppNotification.message}
            </Text>
          </View>
          <Pressable onPress={hideInAppNotification} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={16} color={theme.textSoft} />
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

function createStyles(theme, tone, topInset) {
  return StyleSheet.create({
    portal: {
      flex: 1,
      paddingTop: Math.max(topInset, 10) + 6,
      paddingHorizontal: 14,
    },
    card: {
      minHeight: 76,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      overflow: "hidden",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 14,
    },
    glow: {
      position: "absolute",
      width: 110,
      height: 110,
      borderRadius: 999,
      top: -42,
      right: -28,
      backgroundColor: tone.bg,
      opacity: theme.mode === "dark" ? 0.38 : 0.8,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: tone.bg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    title: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    message: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      flexShrink: 0,
    },
  });
}
