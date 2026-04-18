import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

export default function ResidentNotificationsScreen() {
  const { currentNotifications, markNotificationRead, deleteNotification, theme } = useApp();
  const styles = createStyles(theme);

  return (
    <ScreenContainer>
      <AppHeader title="Notifications" variant="toolbar" />

      {currentNotifications.map((item) => (
        <View key={item.id} style={[styles.card, !item.read ? styles.unreadCard : null]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
          <View style={styles.row}>
            <Pressable style={styles.readButton} onPress={() => markNotificationRead(item.id)}>
              <Text style={styles.readButtonText}>{item.read ? "Marked read" : "Mark as read"}</Text>
            </Pressable>
            <Pressable style={styles.removeButton} onPress={() => deleteNotification(item.id)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
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
      gap: 10,
    },
    unreadCard: {
      borderColor: theme.primary,
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
    row: {
      flexDirection: "row",
      gap: 10,
    },
    readButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    readButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    removeButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 14,
      backgroundColor: theme.dangerSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    removeButtonText: {
      color: theme.danger,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
