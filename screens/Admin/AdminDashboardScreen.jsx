import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";
import { buildAnalytics } from "../../utils/analyticsUtils";
import { formatDate, formatTime } from "../../utils/dateUtils";

const INCIDENT_OPTIONS = [
  { value: "noise complaint", icon: "volume-high-outline" },
  { value: "public disturbance", icon: "volume-high-outline" },
  { value: "trash / garbage issue", icon: "trash-outline" },
  { value: "trash complaint", icon: "trash-outline" },
  { value: "flooding", icon: "water-outline" },
  { value: "road damage", icon: "construct-outline" },
  { value: "broken streetlight", icon: "bulb-outline" },
  { value: "drainage problem", icon: "git-network-outline" },
  { value: "drainage concern", icon: "git-network-outline" },
  { value: "illegal parking", icon: "car-outline" },
  { value: "vandalism", icon: "color-wand-outline" },
  { value: "stray animals", icon: "paw-outline" },
  { value: "other", icon: "apps-outline" },
  { value: "others", icon: "apps-outline" },
  { value: "water leak", icon: "apps-outline" },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning, Admin";
  }

  if (hour < 18) {
    return "Good afternoon, Admin";
  }

  return "Good evening, Admin";
}

function getDashboardDateTime() {
  const now = new Date();

  return {
    date: now.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: now.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function getStatusTone(status) {
  if (status === "Resolved") {
    return { accent: "#8b5cf6", chipBg: "rgba(139, 92, 246, 0.18)", chipText: "#c4b5fd" };
  }

  if (status === "Ongoing") {
    return { accent: "#14b8a6", chipBg: "rgba(20, 184, 166, 0.18)", chipText: "#5eead4" };
  }

  if (status === "Rejected") {
    return { accent: "#ef4444", chipBg: "rgba(239, 68, 68, 0.18)", chipText: "#fca5a5" };
  }

  return { accent: "#3b82f6", chipBg: "rgba(59, 130, 246, 0.18)", chipText: "#93c5fd" };
}

function countReportsByStatus(reports, status) {
  return reports.filter((report) => report.status === status).length;
}

function getStatusPillTone(status, theme) {
  if (status === "Resolved") {
    return { text: theme.success, bg: "rgba(52, 211, 153, 0.16)", border: "rgba(52, 211, 153, 0.28)" };
  }

  if (status === "Rejected") {
    return { text: theme.danger, bg: theme.dangerSoft, border: "rgba(248, 113, 113, 0.26)" };
  }

  if (status === "For Confirmation") {
    return { text: "#b56eff", bg: "rgba(181, 110, 255, 0.14)", border: "rgba(181, 110, 255, 0.26)" };
  }

  if (status === "Ongoing") {
    return { text: theme.primary, bg: theme.primarySoft, border: "rgba(79, 131, 255, 0.28)" };
  }

  return { text: "#ffbf5a", bg: "rgba(255, 191, 90, 0.14)", border: "rgba(255, 191, 90, 0.24)" };
}

function getIncidentIcon(incidentType = "") {
  const normalized = incidentType.trim().toLowerCase();
  return INCIDENT_OPTIONS.find((item) => item.value === normalized)?.icon || "document-text-outline";
}

function getCardAccent(status, theme) {
  return getStatusPillTone(status, theme).text;
}

function DashboardReportListCard({ report, navigation, styles, theme }) {
  const statusTone = getStatusPillTone(report.status, theme);
  const accentColor = getCardAccent(report.status, theme);

  return (
    <View style={styles.reportCardShell}>
      <View style={[styles.reportAccent, { backgroundColor: accentColor }]} />
      <View style={styles.reportCard}>
        <View style={styles.reportTopRow}>
          <View style={styles.reportHeading}>
            <View style={[styles.incidentIconWrap, { backgroundColor: `${accentColor}20` }]}>
              <Ionicons name={getIncidentIcon(report.incidentType)} size={26} color={accentColor} />
            </View>
            <View style={styles.reportHeadingText}>
              <Text style={styles.reportTitle}>{report.incidentType}</Text>
              <View style={styles.identityRow}>
                {report.residentName ? (
                  <Pressable
                    style={styles.namePill}
                    onPress={() =>
                      navigation.navigate("ResidentProfileView", {
                        userId: report.residentId,
                        isReadOnly: true,
                      })
                    }
                    disabled={!report.residentId}
                  >
                    <Text style={styles.namePillText}>{report.residentName}</Text>
                  </Pressable>
                ) : null}
                {report.purok ? <Text style={styles.purokText}>{report.purok}</Text> : null}
              </View>
            </View>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusTone.bg, borderColor: statusTone.border }]}>
            <Text style={[styles.statusPillText, { color: statusTone.text }]}>{report.status}</Text>
          </View>
        </View>

        <View style={styles.metaChipRow}>
          <View style={styles.metaInlineItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSoft} />
            <Text style={styles.metaInlineText}>{formatDate(report.createdAt)}</Text>
          </View>
          <View style={styles.metaInlineItem}>
            <Ionicons name="time-outline" size={16} color={theme.textSoft} />
            <Text style={styles.metaInlineText}>{formatTime(report.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.locationInlineRow}>
          <Ionicons name="location-outline" size={18} color={theme.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {report.location?.address || "Location unavailable"}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Pressable
            style={styles.viewReportButton}
            onPress={() => navigation.navigate("AdminReportDetails", { reportId: report.id })}
          >
            <Text style={styles.viewReportButtonText}>View Report</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { reports, unreadNotificationsCount, theme } = useApp();
  const { width } = useWindowDimensions();
  const analytics = buildAnalytics(reports);
  const styles = createStyles(theme, width);
  const greeting = getGreeting();
  const nowInfo = getDashboardDateTime();
  const compact = width < 380;
  const liveDashboardStats = useMemo(
    () => ({
      latestReports: reports.slice(0, 3),
      pendingCount: countReportsByStatus(reports, "Pending"),
      ongoingCount: countReportsByStatus(reports, "Ongoing"),
      resolvedCount: countReportsByStatus(reports, "Resolved"),
    }),
    [reports]
  );

  const statusSummary = [
    {
      label: "Pending",
      value: liveDashboardStats.pendingCount,
      icon: "time-outline",
      tone: {
        bg: theme.mode === "dark" ? "rgba(59, 130, 246, 0.14)" : "rgba(59, 130, 246, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(59, 130, 246, 0.18)" : "rgba(59, 130, 246, 0.12)",
        icon: "#60a5fa",
      },
    },
    {
      label: "Ongoing",
      value: liveDashboardStats.ongoingCount,
      icon: "play-outline",
      tone: {
        bg: theme.mode === "dark" ? "rgba(20, 184, 166, 0.14)" : "rgba(20, 184, 166, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(20, 184, 166, 0.18)" : "rgba(20, 184, 166, 0.12)",
        icon: "#2dd4bf",
      },
    },
    {
      label: "Resolved",
      value: liveDashboardStats.resolvedCount,
      icon: "checkmark-outline",
      tone: {
        bg: theme.mode === "dark" ? "rgba(139, 92, 246, 0.14)" : "rgba(139, 92, 246, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(139, 92, 246, 0.18)" : "rgba(139, 92, 246, 0.12)",
        icon: "#a78bfa",
      },
    },
  ];

  const quickActions = [
    {
      label: "Add Resident",
      subtitle: "Register a new resident",
      icon: "person-add-outline",
      onPress: () => navigation.navigate("AdminManage", { screen: "AddResidentAccountScreen" }),
      tone: {
        bg: theme.mode === "dark" ? "rgba(37, 99, 235, 0.18)" : "rgba(37, 99, 235, 0.1)",
        iconBg: theme.mode === "dark" ? "rgba(59, 130, 246, 0.22)" : "rgba(59, 130, 246, 0.16)",
        icon: "#60a5fa",
      },
    },
    {
      label: "Reports",
      subtitle: "View and manage reports",
      icon: "document-text-outline",
      onPress: () => navigation.navigate("AdminReports"),
      tone: {
        bg: theme.mode === "dark" ? "rgba(139, 92, 246, 0.18)" : "rgba(139, 92, 246, 0.1)",
        iconBg: theme.mode === "dark" ? "rgba(168, 85, 247, 0.22)" : "rgba(168, 85, 247, 0.16)",
        icon: "#c084fc",
      },
    },
  ];

  const metrics = [
    {
      label: "Weekly Reports",
      value: analytics.weeklyTotal,
      helper: "This week",
      icon: "calendar-outline",
      tone: {
        edge: "#3b82f6",
        bg: theme.mode === "dark" ? "rgba(59, 130, 246, 0.14)" : "rgba(59, 130, 246, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.12)",
        icon: "#60a5fa",
      },
    },
    {
      label: "Monthly Reports",
      value: analytics.monthlyTotal,
      helper: "This month",
      icon: "stats-chart-outline",
      tone: {
        edge: "#a855f7",
        bg: theme.mode === "dark" ? "rgba(168, 85, 247, 0.14)" : "rgba(168, 85, 247, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.12)",
        icon: "#c084fc",
      },
    },
    {
      label: "Yearly Reports",
      value: analytics.yearlyTotal,
      helper: "This year",
      icon: "bar-chart-outline",
      tone: {
        edge: "#14b8a6",
        bg: theme.mode === "dark" ? "rgba(20, 184, 166, 0.14)" : "rgba(20, 184, 166, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(20, 184, 166, 0.2)" : "rgba(20, 184, 166, 0.12)",
        icon: "#2dd4bf",
      },
    },
    {
      label: "Unread Notifications",
      value: unreadNotificationsCount,
      helper: unreadNotificationsCount > 0 ? "Needs review" : "All caught up",
      icon: "notifications-outline",
      tone: {
        edge: "#f59e0b",
        bg: theme.mode === "dark" ? "rgba(245, 158, 11, 0.14)" : "rgba(245, 158, 11, 0.08)",
        iconBg: theme.mode === "dark" ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)",
        icon: "#fbbf24",
      },
    },
  ];

  return (
    <ScreenContainer>
      <AppHeader title="Dashboard" variant="toolbar" />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>{greeting} {String.fromCodePoint(0x1F44B)}</Text>
          <Text style={styles.heroSubtitle}>Manage residents, reports and track community activities.</Text>
        </View>

        <View style={styles.datePanel}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            <Text style={styles.dateValue}>{nowInfo.date}</Text>
          </View>
          <Text style={styles.timeValue}>{nowInfo.time}</Text>
        </View>
      </View>

      <View style={styles.controlCard}>
        <View style={styles.controlHeader}>
          <View style={styles.controlTitleRow}>
            <View style={styles.controlIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
            </View>
            <View style={styles.controlTextBlock}>
              <Text style={styles.controlTitle}>Control Center</Text>
              <Text style={styles.controlSubtitle}>Monitor requests and manage operations</Text>
            </View>
          </View>

          <Pressable style={styles.activityButton} onPress={() => navigation.navigate("AdminReports")}>
            <Text style={styles.activityButtonText}>View Activity</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          {statusSummary.map((item) => (
            <View key={item.label} style={[styles.summaryMiniCard, { backgroundColor: item.tone.bg }]}>
              <View style={[styles.summaryMiniIcon, { backgroundColor: item.tone.iconBg }]}>
                <Ionicons name={item.icon} size={18} color={item.tone.icon} />
              </View>
              <Text style={styles.summaryMiniValue}>{item.value}</Text>
              <Text style={styles.summaryMiniLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickRow}>
          {quickActions.map((item) => (
            <Pressable
              key={item.label}
              style={[styles.quickCard, { backgroundColor: item.tone.bg }]}
              onPress={item.onPress}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: item.tone.iconBg }]}>
                <Ionicons name={item.icon} size={24} color={item.tone.icon} />
              </View>

              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>{item.label}</Text>
                <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.quickArrowWrap}>
                <Ionicons name="arrow-forward-outline" size={16} color={theme.primary} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.metricsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.filterPill}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSoft} />
            <Text style={styles.filterText}>This Month</Text>
            <Ionicons name="chevron-down-outline" size={14} color={theme.textSoft} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((item) => (
            <View
              key={item.label}
              style={[
                styles.metricCard,
                compact ? styles.metricCardCompact : null,
                { backgroundColor: item.tone.bg, borderLeftColor: item.tone.edge },
              ]}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: item.tone.iconBg }]}>
                <Ionicons name={item.icon} size={22} color={item.tone.icon} />
              </View>

              <View style={styles.metricTextBlock}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricHelper}>{item.helper}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.reportsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Reports</Text>
          <Pressable style={styles.viewAllButton} onPress={() => navigation.navigate("AdminReports")}>
            <Text style={styles.viewAllText}>View All Reports</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={theme.primary} />
          </Pressable>
        </View>

        {liveDashboardStats.latestReports.length > 0 ? (
          liveDashboardStats.latestReports.map((report) => (
            <DashboardReportListCard
              key={report.id}
              report={report}
              navigation={navigation}
              styles={styles}
              theme={theme}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No reports yet</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme, width) {
  const compact = width < 390;

  return StyleSheet.create({
    heroCard: {
      backgroundColor: theme.mode === "dark" ? "#102447" : theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#1b3564" : theme.border,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.14,
      shadowRadius: 22,
      elevation: 5,
    },
    heroTextBlock: {
      flex: 1,
      gap: 6,
    },
    heroTitle: {
      color: theme.text,
      fontSize: compact ? 17 : 19,
      fontWeight: "900",
      lineHeight: compact ? 24 : 26,
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
      maxWidth: 220,
    },
    datePanel: {
      minWidth: compact ? 112 : 126,
      borderRadius: 22,
      backgroundColor: theme.mode === "dark" ? "#0d1d3b" : theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "#1a315c" : theme.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dateValue: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700",
    },
    timeValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      paddingLeft: 24,
    },
    controlCard: {
      backgroundColor: theme.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 5,
    },
    controlHeader: {
      flexDirection: compact ? "column" : "row",
      alignItems: compact ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 14,
    },
    controlTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    controlIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: theme.mode === "dark" ? "rgba(59,130,246,0.18)" : theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    controlTextBlock: {
      flex: 1,
      gap: 4,
    },
    controlTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.3,
    },
    controlSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    activityButton: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 18,
      backgroundColor: theme.mode === "dark" ? "#1b2650" : theme.primarySoft,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    activityButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    summaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    summaryMiniCard: {
      flex: 1,
      borderRadius: 22,
      padding: 14,
      gap: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.04)",
    },
    summaryMiniIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryMiniValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    summaryMiniLabel: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    quickRow: {
      flexDirection: compact ? "column" : "row",
      gap: 12,
    },
    quickCard: {
      flex: 1,
      minHeight: 106,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.04)",
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    quickActionIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionText: {
      flex: 1,
      gap: 4,
    },
    quickActionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "900",
    },
    quickActionSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    quickArrowWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.mode === "dark" ? "rgba(37,99,235,0.18)" : theme.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    metricsCard: {
      backgroundColor: theme.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.1,
      shadowRadius: 22,
      elevation: 4,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: -0.3,
      flex: 1,
    },
    filterPill: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.mode === "dark" ? "#131f3c" : theme.surfaceSoft,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    filterText: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "700",
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    metricCard: {
      width: compact ? "100%" : "47.7%",
      minHeight: 118,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.04)",
      borderLeftWidth: 4,
      padding: 14,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    metricCardCompact: {
      width: "100%",
    },
    metricIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    metricTextBlock: {
      flex: 1,
      gap: 4,
    },
    metricLabel: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 20,
    },
    metricValue: {
      color: theme.text,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    metricHelper: {
      color: theme.mode === "dark" ? "#86efac" : theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    reportsCard: {
      backgroundColor: theme.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 14,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.1,
      shadowRadius: 22,
      elevation: 4,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    viewAllText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    reportCardShell: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 0,
    },
    reportAccent: {
      width: 4,
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 24,
    },
    reportCard: {
      flex: 1,
      backgroundColor: theme.mode === "dark" ? "#131f35" : theme.surfaceSoft,
      borderTopRightRadius: 24,
      borderBottomRightRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
    },
    reportTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    reportHeading: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    incidentIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    reportHeadingText: {
      flex: 1,
      gap: 8,
    },
    reportTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "900",
      letterSpacing: -0.3,
    },
    identityRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    namePill: {
      backgroundColor: theme.mode === "dark" ? "rgba(59,130,246,0.18)" : theme.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    namePillText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    purokText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    statusPill: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    statusPillText: {
      fontSize: 12,
      fontWeight: "800",
    },
    metaChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metaInlineItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.mode === "dark" ? "#0f1a2f" : theme.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    metaInlineText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    locationInlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    locationText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    cardFooter: {
      alignItems: "flex-start",
    },
    viewReportButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    viewReportButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    emptyState: {
      backgroundColor: theme.mode === "dark" ? "#131f35" : theme.surfaceSoft,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
  });
}
