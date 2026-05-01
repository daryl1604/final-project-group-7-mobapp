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
      onPress: () => navigation.navigate("AddResidentAccountScreen"),
    },
    {
      label: "Manage Accounts",
      onPress: () => navigation.navigate("ManageAccountsScreen"),
    },
  ];

  return (
    <ScreenContainer>
      <AppHeader title="Manage" variant="toolbar" />

      <View style={styles.actionGrid}>
        {actionCards.map((item) => (
          <Pressable key={item.label} style={styles.actionCard} onPress={item.onPress}>
            <Text style={styles.actionTitle}>{item.label}</Text>
          </Pressable>
        ))}
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    actionCard: {
      flex: 1,
      minHeight: 28,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      position: "relative",
    },
    actionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center",
    },
  });
}
