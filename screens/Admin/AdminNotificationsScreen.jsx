import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

export default function AdminNotificationsScreen() {
  const { currentNotifications, markNotificationRead, deleteNotification, theme } = useApp();
  const styles = createStyles(theme);

  return (
    <ScreenContainer>
      <AppHeader title="Notifications" variant="toolbar" />

      {currentNotifications.map((item) => (
        <View key={item.id} style={[styles.card, !item.read ? styles.cardUnread : null]}>
          <View style={styles.cardTop}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
            {!item.read ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryAction} onPress={() => markNotificationRead(item.id)}>
              <Text style={styles.secondaryActionText}>{item.read ? "Marked read" : "Mark as read"}</Text>
            </Pressable>
            <Pressable style={styles.deleteAction} onPress={() => deleteNotification(item.id)}>
              <Text style={styles.deleteActionText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {currentNotifications.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.title}>No notifications yet</Text>
          <Text style={styles.message}>Important admin activity will appear here when it happens.</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 12,
    },
    cardUnread: {
      borderColor: theme.primary,
    },
    cardTop: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    titleBlock: {
      flex: 1,
      gap: 6,
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    message: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    meta: {
      color: theme.textSoft,
      fontSize: 12,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.primary,
      marginTop: 6,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    secondaryAction: {
      flex: 1,
      minHeight: 44,
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryActionText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    deleteAction: {
      flex: 1,
      minHeight: 44,
      borderRadius: 14,
      backgroundColor: theme.dangerSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteActionText: {
      color: theme.danger,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
