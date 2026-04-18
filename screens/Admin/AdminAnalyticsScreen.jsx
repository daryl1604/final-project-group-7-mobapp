import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";
import { buildAnalytics } from "../../utils/analyticsUtils";

function ChartBlock({ title, data, theme }) {
  const styles = createStyles(theme);
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {data.map((item) => (
        <View key={item.label} style={styles.chartRow}>
          <Text style={styles.chartLabel}>{item.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(item.value / max) * 100}%` }]} />
          </View>
          <Text style={styles.chartValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AdminAnalyticsScreen() {
  const { reports, theme } = useApp();
  const analytics = buildAnalytics(reports);
  const styles = createStyles(theme);

  return (
    <ScreenContainer>
      <AppHeader title="Analytics" variant="toolbar" />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{analytics.weeklyTotal}</Text>
          <Text style={styles.summaryLabel}>Weekly reports</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{analytics.monthlyTotal}</Text>
          <Text style={styles.summaryLabel}>Monthly reports</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{analytics.yearlyTotal}</Text>
          <Text style={styles.summaryLabel}>Yearly reports</Text>
        </View>
      </View>

      <View style={styles.narrativeCard}>
        <Text style={styles.narrativeTitle}>Generated summary</Text>
        <Text style={styles.narrativeText}>
          The app is currently tracking {reports.length} report{reports.length === 1 ? "" : "s"}. This week recorded {analytics.weeklyTotal}, while the current month has {analytics.monthlyTotal}. The yearly total is {analytics.yearlyTotal}, helping admins compare short-term activity against the bigger picture.
        </Text>
      </View>

      <ChartBlock title="Reports by status" data={analytics.statusCounts} theme={theme} />
      <ChartBlock title="Reports by purok" data={analytics.purokCounts} theme={theme} />
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    summaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 6,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
    },
    summaryLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    narrativeCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 8,
    },
    narrativeTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    narrativeText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    chartCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 14,
    },
    chartTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    chartRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    chartLabel: {
      width: 112,
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    chartValue: {
      width: 22,
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "right",
    },
  });
}
