import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import FeedbackThread from "../../components/reports/FeedbackThread";
import PhotoPreview from "../../components/reports/PhotoPreview";
import StatusBadge from "../../components/common/StatusBadge";
import { useApp } from "../../storage/AppProvider";
import { formatDateTime } from "../../utils/dateUtils";

export default function AdminReportDetailsScreen({ route, navigation }) {
  const { reportId } = route.params;
  const { currentUser, reports, addAdminFeedback, editAdminFeedback, updateReportStatus, deleteReport, showAlert, showConfirmation, theme } = useApp();
  const [feedbackText, setFeedbackText] = useState("");
  const report = useMemo(() => reports.find((item) => item.id === reportId), [reportId, reports]);
  const styles = createStyles(theme);

  if (!report) {
    return null;
  }

  const lastFeedback = report.adminFeedback[report.adminFeedback.length - 1];

  const handleFeedback = async () => {
    if (!feedbackText.trim()) {
      return;
    }

    if (lastFeedback) {
      await editAdminFeedback(report.id, lastFeedback.id, feedbackText);
    } else {
      await addAdminFeedback(report.id, currentUser.id, feedbackText);
    }

    setFeedbackText("");
    showAlert("Feedback saved", "The report feedback was updated successfully.", { variant: "success" });
  };

  const statusActions = [];
  if (report.status === "Pending") {
    statusActions.push("Ongoing", "Rejected");
  }
  if (report.status === "Ongoing") {
    statusActions.push("For Confirmation", "Rejected");
  }

  const confirmDelete = () => {
    showConfirmation({
      title: "Delete report?",
      message: "Remove this report from local storage? The resident will also receive a deletion update.",
      confirmText: "Delete",
      onConfirm: async () => {
        await deleteReport(report.id, currentUser.id);
        showAlert("Report deleted", "The report was removed successfully.", {
          variant: "success",
          buttons: [
            {
              text: "OK",
              variant: "primary",
              onPress: () => navigation.goBack(),
            },
          ],
        });
      },
    });
  };

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled">
      <AppHeader title="Report Details" variant="toolbar" />

      <View style={styles.topCard}>
        <StatusBadge status={report.status} />
        <Text style={styles.meta}>{report.purok}</Text>
      </View>

      <PhotoPreview uri={report.photoUri} />

      <View style={styles.card}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{report.description}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{report.location?.address || "No saved address"}</Text>
      </View>

      <FeedbackThread feedback={report.adminFeedback} replies={report.residentReplies} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{lastFeedback ? "Update feedback" : "Add feedback"}</Text>
        <FormField
          label="Feedback"
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholder="Write a clear update for the resident"
          multiline
        />
        <PrimaryButton
          label={lastFeedback ? "Update feedback" : "Add feedback"}
          onPress={handleFeedback}
        />
      </View>

      {statusActions.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update report status</Text>
          <View style={styles.actionRow}>
            {statusActions.map((status) => (
              <Pressable
                key={status}
                style={[styles.statusButton, status === "Rejected" ? styles.rejectButton : null]}
                onPress={() => updateReportStatus(report.id, status, currentUser.id)}
              >
                <Text style={[styles.statusText, status === "Rejected" ? styles.rejectText : null]}>
                  Set {status}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteButtonText}>Delete report</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    topCard: {
      backgroundColor: theme.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
    },
    meta: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 12,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
    },
    label: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    value: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    statusButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    statusText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
    },
    rejectButton: {
      backgroundColor: theme.dangerSoft,
    },
    rejectText: {
      color: theme.danger,
    },
    deleteButton: {
      minHeight: 54,
      borderRadius: 18,
      backgroundColor: theme.dangerSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButtonText: {
      color: theme.danger,
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
