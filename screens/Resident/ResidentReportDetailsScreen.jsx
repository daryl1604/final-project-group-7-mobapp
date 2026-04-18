import { Pressable, Text, View } from "react-native";
import { useMemo, useState } from "react";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import FeedbackThread from "../../components/reports/FeedbackThread";
import PhotoPreview from "../../components/reports/PhotoPreview";
import StatusBadge from "../../components/common/StatusBadge";
import { useApp } from "../../storage/AppProvider";
import { formatDateTime } from "../../utils/dateUtils";
import { createResidentReportDetailsStyles } from "../../styles/resident/ResidentReportDetailsScreen.styles";

export default function ResidentReportDetailsScreen({ route, navigation }) {
  const { reportId } = route.params;
  const { currentUser, reports, addResidentReply, updateReportStatus, showAlert, theme } = useApp();
  const [replyText, setReplyText] = useState("");
  const report = useMemo(() => reports.find((item) => item.id === reportId), [reportId, reports]);
  const residentReportDetailsStyles = createResidentReportDetailsStyles(theme);

  if (!report) {
    return (
      <ScreenContainer scroll={false} contentStyle={residentReportDetailsStyles.center}>
        <Text style={residentReportDetailsStyles.emptyText}>Report not found.</Text>
      </ScreenContainer>
    );
  }

  const canEdit = report.status === "Pending" || report.status === "Rejected";

  const handleReply = async () => {
    if (!replyText.trim()) {
      return;
    }

    await addResidentReply(report.id, currentUser.id, replyText);
    setReplyText("");
  };

  const handleConfirm = async () => {
    await updateReportStatus(report.id, "Resolved", currentUser.id);
    showAlert("Resolved", "You confirmed that the issue has been resolved.", { variant: "success" });
  };

  const handleDispute = async () => {
    await updateReportStatus(report.id, "Ongoing", currentUser.id);
    showAlert("Sent Back", "The report was returned to Ongoing for further action.", { variant: "info" });
  };

  return (
    <ScreenContainer>
      <AppHeader title="Report Details" variant="toolbar" />
      <StatusBadge status={report.status} />
      <PhotoPreview uri={report.photoUri} />
      <View style={residentReportDetailsStyles.card}>
        <Text style={residentReportDetailsStyles.label}>Description</Text>
        <Text style={residentReportDetailsStyles.value}>{report.description}</Text>
        <Text style={residentReportDetailsStyles.label}>Purok</Text>
        <Text style={residentReportDetailsStyles.value}>{report.purok}</Text>
        <Text style={residentReportDetailsStyles.label}>Location</Text>
        <Text style={residentReportDetailsStyles.value}>{report.location?.address || "No saved address"}</Text>
      </View>
      <FeedbackThread feedback={report.adminFeedback} replies={report.residentReplies} />
      <View style={residentReportDetailsStyles.card}>
        <FormField label="Reply to Admin Feedback" value={replyText} onChangeText={setReplyText} placeholder="Type your reply here" multiline />
        <Pressable style={residentReportDetailsStyles.primaryButton} onPress={handleReply}>
          <Text style={residentReportDetailsStyles.primaryButtonText}>Send Reply</Text>
        </Pressable>
      </View>
      {report.status === "For Confirmation" ? (
        <View style={residentReportDetailsStyles.confirmationRow}>
          <Pressable style={residentReportDetailsStyles.confirmButton} onPress={handleConfirm}>
            <Text style={residentReportDetailsStyles.actionButtonText}>Confirm Resolved</Text>
          </Pressable>
          <Pressable style={residentReportDetailsStyles.disputeButton} onPress={handleDispute}>
            <Text style={residentReportDetailsStyles.actionButtonText}>Not Yet Resolved</Text>
          </Pressable>
        </View>
      ) : null}
      {canEdit ? (
        <Pressable style={residentReportDetailsStyles.secondaryButton} onPress={() => navigation.navigate("EditReport", { reportId: report.id })}>
          <Text style={residentReportDetailsStyles.secondaryButtonText}>Edit Report</Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}
