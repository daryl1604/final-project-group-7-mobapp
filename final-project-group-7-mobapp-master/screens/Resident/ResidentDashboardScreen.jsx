import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import ReportCard from "../../components/reports/ReportCard";
import { useApp } from "../../storage/AppProvider";

export default function ResidentDashboardScreen({ navigation }) {
  const { currentUser, reports, unreadNotificationsCount, theme } = useApp();
  const residentReports = reports.filter((report) => report.residentId === currentUser.id);
  const styles = createStyles(theme);
  const summary = {
    total: residentReports.length,
    pending: residentReports.filter((report) => report.status === "Pending").length,
    ongoing: residentReports.filter((report) => report.status === "Ongoing").length,
    confirmation: residentReports.filter((report) => report.status === "For Confirmation").length,
  };

  const cards = [
    { label: "Reports", value: summary.total, icon: "document-text-outline" },
    { label: "Pending", value: summary.pending, icon: "time-outline" },
    { label: "Ongoing", value: summary.ongoing, icon: "sync-outline" },
    { label: "Unread", value: unreadNotificationsCount, icon: "notifications-outline" },
  ];

  return (
    <ScreenContainer>
      <AppHeader title="Dashboard" variant="toolbar" />

      <Pressable style={styles.primaryAction} onPress={() => navigation.navigate("SubmitReport")}>
        <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
        <Text style={styles.primaryActionText}>Submit Report</Text>
      </Pressable>

      <View style={styles.summaryGrid}>
        {cards.map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={theme.primary} />
            </View>
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <Pressable onPress={() => navigation.navigate("ResidentReports")}>
          <Text style={styles.link}>View All</Text>
        </Pressable>
      </View>

      {residentReports.slice(0, 3).map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onPress={() => navigation.navigate("ResidentReportDetails", { reportId: report.id })}
        />
      ))}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    primaryAction: {
      minHeight: 52,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryActionText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    summaryCard: {
      width: "47%",
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
    },
    summaryLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "900",
    },
    link: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
  });
}
