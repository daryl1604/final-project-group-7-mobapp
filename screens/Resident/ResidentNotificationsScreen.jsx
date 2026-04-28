import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import NotificationSectionList from "../../components/common/NotificationSectionList";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

function formatDeletedMessage(item) {
  const reportTitle = item.details?.reportTitle || "Report";
  const adminMessage = item.details?.message?.trim();
  const deletedAt = item.details?.deletedAt ? new Date(item.details.deletedAt).toLocaleString() : "Not available";

  return `${reportTitle}\n\n${adminMessage ? `Admin message: ${adminMessage}\n\n` : ""}Deleted: ${deletedAt}`;
}

export default function ResidentNotificationsScreen({ navigation }) {
  const { currentNotifications, markNotificationRead, deleteNotification, reports, preferences, showAlert, theme } = useApp();
  const styles = createStyles(theme);

  const handleOpenNotification = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id);
    }

    if (item.title === "Welcome") {
      showAlert(
        "Welcome to BrgyWatch",
        item.details?.fullMessage ||
          "Your resident account has been created successfully.\n\nYou can now submit reports, track updates, and receive alerts from the barangay here.",
        { variant: "info" }
      );
      return;
    }

    if (item.type === "account") {
      showAlert(
        item.title || "Account Update",
        item.details?.fullMessage ||
          item.message ||
          "A barangay admin created your resident account. You can now sign in and manage your reports here.",
        { variant: "info" }
      );
      return;
    }

    if (item.type === "announcement") {
      showAlert(item.title || "Barangay Announcement", item.details?.fullMessage || item.message, { variant: "info" });
      return;
    }

    if (item.type === "deleted_report") {
      showAlert("Report Deleted", formatDeletedMessage(item), { variant: "info" });
      return;
    }

    if (item.reportId) {
      const reportExists = reports.some((report) => report.id === item.reportId);

      if (!reportExists) {
        showAlert("Report unavailable", "This report has been deleted and can no longer be retrieved.", {
          variant: "info",
        });
        return;
      }

      navigation.navigate("ResidentReports", {
        screen: "MyReportsScreen",
        params: {
          selectedReportId: item.reportId,
          selectionKey: `${item.id}_${Date.now()}`,
          scrollTo: item.type === "reply" || item.type === "feedback" ? "feedback" : undefined,
        },
      });
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="Notifications" variant="toolbar" />
      {!preferences.notificationsEnabled ? (
        <View style={styles.blockedState}>
          <View style={styles.blockedIconWrap}>
            <Ionicons name="notifications-off-outline" size={34} color={theme.textSoft} />
          </View>
          <Text style={styles.blockedTitle}>Notifications are turned off</Text>
          <Text style={styles.blockedText}>Turn on notifications in settings to view updates and alerts.</Text>
          <Pressable style={styles.blockedButton} onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.blockedButtonText}>Go to Settings</Text>
          </Pressable>
        </View>
      ) : (
        <NotificationSectionList
          notifications={currentNotifications}
          theme={theme}
          emptyTitle="No alerts yet"
          emptyText="Important resident updates will appear here when they happen."
          onOpenNotification={handleOpenNotification}
          onDeleteNotification={deleteNotification}
        />
      )}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    blockedState: {
      minHeight: 360,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 32,
      gap: 12,
      marginTop: 16,
    },
    blockedIconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    blockedTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
      textAlign: "center",
    },
    blockedText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      maxWidth: 280,
    },
    blockedButton: {
      minHeight: 48,
      marginTop: 4,
      paddingHorizontal: 18,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    blockedButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
    },
  });
}
