import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import ReportCard from "../../components/reports/ReportCard";
import { useApp } from "../../storage/AppProvider";

export default function ManageReportsScreen({ navigation }) {
  const { reports, theme } = useApp();
  const actionableReports = reports.filter((report) => ["Pending", "Ongoing", "For Confirmation"].includes(report.status));
  const styles = createStyles(theme);

  const actionCards = [
    {
      label: "Add Resident",
      text: "Create a resident account with validation and cleaner account details.",
      icon: "person-add-outline",
      onPress: () => navigation.navigate("AddResidentAccountScreen"),
    },
    {
      label: "Manage Accounts",
      text: "Review registry records and remove residents only after confirmation.",
      icon: "people-outline",
      onPress: () => navigation.navigate("ManageAccountsScreen"),
    },
    {
      label: "Analytics",
      text: "See chart summaries for status and purok activity.",
      icon: "bar-chart-outline",
      onPress: () => navigation.navigate("AdminAnalytics"),
    },
  ];

  return (
    <ScreenContainer>
      <AppHeader title="Manage" variant="toolbar" />

      <View style={styles.actionGrid}>
        {actionCards.map((item) => (
          <Pressable key={item.label} style={styles.actionCard} onPress={item.onPress}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={theme.primary} />
            </View>
            <Text style={styles.actionTitle}>{item.label}</Text>
            <Text style={styles.actionText}>{item.text}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cases that need action</Text>
        <Text style={styles.sectionText}>{actionableReports.length} report{actionableReports.length === 1 ? "" : "s"} waiting for admin attention</Text>
      </View>

      {actionableReports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onPress={() => navigation.navigate("AdminReportDetails", { reportId: report.id })}
        />
      ))}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    actionGrid: {
      gap: 12,
    },
    actionCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 10,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 16,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    actionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
    },
    actionText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    sectionHeader: {
      gap: 4,
      marginTop: 4,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: "800",
    },
    sectionText: {
      color: theme.textMuted,
      fontSize: 13,
    },
  });
}
