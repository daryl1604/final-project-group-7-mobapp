import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import AdminReportListCard from "../../components/reports/AdminReportListCard";
import { useApp } from "../../storage/AppProvider";
import { formatDate, formatTime } from "../../utils/dateUtils";

const STATUS_KEYS = ["Pending", "Ongoing", "Resolved", "Rejected"];

const STATUS_META = {
  Pending: {
    icon: "time-outline",
    color: "#f59e0b",
    soft: "rgba(245, 158, 11, 0.14)",
  },
  Ongoing: {
    icon: "sync-outline",
    color: "#3b82f6",
    soft: "rgba(59, 130, 246, 0.14)",
  },
  Resolved: {
    icon: "checkmark-circle-outline",
    color: "#22c55e",
    soft: "rgba(34, 197, 94, 0.14)",
  },
  Rejected: {
    icon: "close-circle-outline",
    color: "#ff4d4f",
    soft: "rgba(255, 77, 79, 0.12)",
  },
};

function normalizeResidentStatus(status = "") {
  return status === "For Confirmation" ? "Ongoing" : status;
}

function getPurokLabel(value = "") {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "No purok";
  }

  return /^purok/i.test(trimmed) ? trimmed : `Purok ${trimmed}`;
}

function getRelativeTimeLabel(value) {
  if (!value) {
    return "No updates yet";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "No updates yet";
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  }

  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}h ago`;
  }

  if (diff < day * 7) {
    return `${Math.max(1, Math.floor(diff / day))}d ago`;
  }

  return formatDate(value);
}

function getRecentActivityMeta(item) {
  if (item.type === "feedback" || item.type === "reply") {
    return {
      icon: "chatbubble-ellipses-outline",
      tint: "#8b5cf6",
      soft: "rgba(139, 92, 246, 0.14)",
    };
  }

  if (item.type === "status") {
    return {
      icon: "checkmark-done-circle-outline",
      tint: "#22c55e",
      soft: "rgba(34, 197, 94, 0.14)",
    };
  }

  if (item.type === "deleted_report") {
    return {
      icon: "trash-outline",
      tint: "#ef4444",
      soft: "rgba(239, 68, 68, 0.12)",
    };
  }

  return {
    icon: "notifications-outline",
    tint: "#3b82f6",
    soft: "rgba(59, 130, 246, 0.14)",
  };
}

function buildTimelineData(reports) {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    const value = reports.filter((report) => {
      const reportDate = new Date(report.createdAt);
      return !Number.isNaN(reportDate.getTime()) && reportDate >= start && reportDate <= end;
    }).length;

    return {
      label: date.toLocaleDateString("en-PH", { month: "short" }),
      value,
    };
  });
}

function getMonthCount(reports, offset = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return reports.filter((report) => {
    const reportDate = new Date(report.createdAt);
    return !Number.isNaN(reportDate.getTime()) && reportDate >= start && reportDate <= end;
  }).length;
}

function formatPercentChange(current, previous) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function getMostReportedType(reports) {
  const lookup = reports.reduce((map, report) => {
    const key = report.incidentType || "No reports yet";
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());

  return [...lookup.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || ["No reports yet", 0];
}

function StatusSummaryCard({ item, styles, onPress }) {
  return (
    <Pressable style={styles.statusCard} onPress={onPress}>
      <View style={[styles.statusGlow, { backgroundColor: item.soft }]} />
      <View style={[styles.statusIconWrap, { backgroundColor: item.soft }]}>
        <Ionicons name={item.icon} size={18} color={item.color} />
      </View>
      <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.statusLabel}>{item.label}</Text>
      <View style={[styles.statusAccent, { backgroundColor: item.color }]} />
    </Pressable>
  );
}

function QuickActionCard({ item, styles, theme }) {
  return (
    <Pressable onPress={item.onPress} style={styles.quickActionWrap}>
      <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionCard}>
        <View style={styles.quickActionOrbLarge} />
        <View style={styles.quickActionOrbSmall} />
        <View style={styles.quickActionTopRow}>
          <View style={[styles.quickActionIconWrap, { backgroundColor: item.iconSoft }]}>
            <Ionicons name={item.icon} size={22} color={item.iconColor} />
          </View>
          <View style={styles.quickActionArrow}>
            <Ionicons name="arrow-forward" size={16} color={item.arrowColor} />
          </View>
        </View>

        <View style={styles.quickActionCopy}>
          <Text style={[styles.quickActionTitle, theme.mode === "dark" ? styles.quickActionTitleDark : null]}>{item.title}</Text>
          <Text style={[styles.quickActionSubtitle, theme.mode === "dark" ? styles.quickActionSubtitleDark : null]}>{item.subtitle}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SummaryStatCard({ icon, iconColor, iconSoft, value, label, sublabel, styles, theme }) {
  const isLongValue = typeof value === "string" && value.length > 14;
  const summaryGradientColors = theme.mode === "dark" ? [theme.surface, theme.surfaceSoft] : ["#ffffff", iconSoft];

  return (
    <LinearGradient
      colors={summaryGradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.summaryStatCard}
    >
      <View style={[styles.summaryStatIconWrap, { backgroundColor: iconSoft }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text
        style={[styles.summaryStatValue, isLongValue ? styles.summaryStatValueLong : null, { color: iconColor }]}
        numberOfLines={3}
      >
        {value}
      </Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
      <Text style={styles.summaryStatSubLabel} numberOfLines={2}>
        {sublabel}
      </Text>
    </LinearGradient>
  );
}

function RecentActivityCard({ item, theme, styles, onPress }) {
  const meta = getRecentActivityMeta(item);
  const content = (
    <View style={styles.activityCard}>
      <View style={[styles.activityIconWrap, { backgroundColor: meta.soft }]}>
        <Ionicons name={meta.icon} size={18} color={meta.tint} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.activityMetaRow}>
          <Ionicons name="time-outline" size={12} color={theme.textSoft} />
          <Text style={styles.activityMeta}>{formatTime(item.createdAt)}</Text>
          <Text style={styles.activityMetaDivider}>|</Text>
          <Text style={styles.activityMeta}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textSoft} />
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

function FilterPill({ label, active, onPress, styles }) {
  return (
    <Pressable style={[styles.filterPill, active ? styles.filterPillActive : null]} onPress={onPress}>
      <Text style={[styles.filterPillText, active ? styles.filterPillTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function LineChart({ data, styles, theme }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.lineChartCard}>
      <View style={styles.lineChartGrid}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={styles.lineChartGridLine} />
        ))}
      </View>

      <View style={styles.lineChartBarsRow}>
        {data.map((item) => {
          const barHeight = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 16 : 4)}%`;
          return (
            <View key={item.label} style={styles.lineChartPointCol}>
              <Text style={styles.lineChartPointValue}>{item.value}</Text>
              <View style={styles.lineChartTrack}>
                <LinearGradient
                  colors={[theme.primary, "#9c5cff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.lineChartBar, { height: barHeight }]}
                />
              </View>
              <Text style={styles.lineChartLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DonutChart({ items, total, styles, theme }) {
  const colorPool = items.flatMap((item) =>
    Array.from({ length: Math.round((item.value / Math.max(total, 1)) * 48) }, () => item.color)
  );
  const colors = colorPool.slice(0, 48);

  while (colors.length < 48) {
    colors.push(theme.surfaceSoft);
  }

  return (
    <View style={styles.donutShell}>
      <View style={styles.donutRing}>
        {colors.map((color, index) => {
          const angle = (Math.PI * 2 * index) / 48 - Math.PI / 2;
          const radius = 50;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <View
              key={index}
              style={[
                styles.donutDot,
                {
                  left: 58 + x,
                  top: 58 + y,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
        <View style={styles.donutCenter}>
          <Text style={styles.donutValue}>{total}</Text>
          <Text style={styles.donutLabel}>Reports</Text>
        </View>
      </View>
    </View>
  );
}

function SummaryModal({
  visible,
  onClose,
  timelineData,
  statusItems,
  totalReports,
  monthCount,
  dominantStatus,
  mostReportedType,
  growthText,
  compareText,
  styles,
  theme,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <Pressable style={styles.modalCloseButton} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={20} color={theme.textMuted} />
          </Pressable>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My Report Summary</Text>
            <Text style={styles.modalSubtitle}>Live mini analytics based on your submitted reports.</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Text style={styles.modalCardTitle}>Reports over time</Text>
                <Text style={styles.modalCardHint}>Last 6 months</Text>
              </View>
              <LineChart data={timelineData} styles={styles} theme={theme} />
            </View>

            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Text style={styles.modalCardTitle}>Status distribution</Text>
                <Text style={styles.modalCardHint}>Current live breakdown</Text>
              </View>
              <View style={styles.statusDistributionWrap}>
                <DonutChart items={statusItems} total={totalReports} styles={styles} theme={theme} />
                <View style={styles.statusLegend}>
                  {statusItems.map((item) => (
                    <View key={item.label} style={styles.statusLegendRow}>
                      <View style={[styles.statusLegendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.statusLegendLabel}>{item.label}</Text>
                      <Text style={styles.statusLegendValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Text style={styles.modalCardTitle}>Insights</Text>
                <Text style={styles.modalCardHint}>Auto-generated from live data</Text>
              </View>
              <View style={styles.insightList}>
                <View style={styles.insightRow}>
                  <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                  <Text style={styles.insightText}>
                    You submitted {monthCount} report{monthCount === 1 ? "" : "s"} this month
                  </Text>
                </View>
                <View style={styles.insightRow}>
                  <Ionicons name="time-outline" size={16} color="#f59e0b" />
                  <Text style={styles.insightText}>
                    Most reports are currently {dominantStatus.label}
                  </Text>
                </View>
                <View style={styles.insightRow}>
                  <Ionicons name="documents-outline" size={16} color="#8b5cf6" />
                  <Text style={styles.insightText}>{mostReportedType} is your most reported issue</Text>
                </View>
                <View style={styles.insightRow}>
                  <Ionicons name="trending-up-outline" size={16} color={growthText.includes("increased") ? "#22c55e" : "#3b82f6"} />
                  <Text style={styles.insightText}>
                    Your activity {growthText} compared to the last period ({compareText})
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ResidentDashboardScreen({ navigation }) {
  const { currentUser, reports, currentNotifications, theme } = useApp();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const displayName = currentUser?.fullName?.trim() || "Resident";
  const heroGradientColors = theme.mode === "dark" ? ["#13233d", "#0f1b31"] : ["#f7fbff", "#eef4ff"];
  const impactGradientColors = theme.mode === "dark" ? ["#12251d", "#0d1c17"] : ["#f7fff5", "#eef9ea"];

  const residentReports = useMemo(
    () => reports.filter((report) => report.residentId === currentUser?.id),
    [currentUser?.id, reports]
  );

  const statusCounts = useMemo(() => {
    return STATUS_KEYS.reduce(
      (result, key) => ({
        ...result,
        [key]: residentReports.filter((report) => normalizeResidentStatus(report.status) === key).length,
      }),
      {}
    );
  }, [residentReports]);

  const statusItems = useMemo(
    () =>
      STATUS_KEYS.map((key) => ({
        label: key,
        value: statusCounts[key] || 0,
        ...STATUS_META[key],
      })),
    [statusCounts]
  );

  const mostReportedType = useMemo(() => getMostReportedType(residentReports)[0], [residentReports]);
  const latestUpdatedReport = useMemo(() => {
    return [...residentReports].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    )[0] || null;
  }, [residentReports]);

  const timelineData = useMemo(() => buildTimelineData(residentReports), [residentReports]);
  const monthCount = useMemo(() => getMonthCount(residentReports, 0), [residentReports]);
  const previousMonthCount = useMemo(() => getMonthCount(residentReports, -1), [residentReports]);
  const submittedTrend = useMemo(() => formatPercentChange(monthCount, previousMonthCount), [monthCount, previousMonthCount]);
  const resolvedMonthCount = useMemo(
    () =>
      residentReports.filter((report) => {
        if (normalizeResidentStatus(report.status) !== "Resolved") {
          return false;
        }

        const reportDate = new Date(report.updatedAt || report.createdAt);
        const now = new Date();
        return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
      }).length,
    [residentReports]
  );
  const previousResolvedMonthCount = useMemo(
    () =>
      residentReports.filter((report) => {
        if (normalizeResidentStatus(report.status) !== "Resolved") {
          return false;
        }

        const reportDate = new Date(report.updatedAt || report.createdAt);
        const now = new Date();
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return reportDate.getMonth() === previousMonth.getMonth() && reportDate.getFullYear() === previousMonth.getFullYear();
      }).length,
    [residentReports]
  );
  const resolvedTrend = useMemo(
    () => formatPercentChange(resolvedMonthCount, previousResolvedMonthCount),
    [previousResolvedMonthCount, resolvedMonthCount]
  );
  const dominantStatus = useMemo(() => {
    return statusItems.reduce((best, item) => (item.value > best.value ? item : best), statusItems[0]);
  }, [statusItems]);

  const growthText = useMemo(() => {
    if (monthCount === previousMonthCount) {
      return "stayed steady";
    }

    return monthCount > previousMonthCount ? "increased" : "decreased";
  }, [monthCount, previousMonthCount]);

  const compareText = useMemo(() => {
    if (previousMonthCount === 0 && monthCount > 0) {
      return "new activity this month";
    }

    return `${previousMonthCount} last month`;
  }, [monthCount, previousMonthCount]);

  const recentActivities = useMemo(() => {
    return currentNotifications
      .filter((item) => ["feedback", "reply", "status", "deleted_report"].includes(item.type))
      .slice(0, 4);
  }, [currentNotifications]);

  const recentReports = useMemo(() => {
    return [...residentReports]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 4);
  }, [residentReports]);

  const openReports = (params = {}) => {
    navigation.navigate("ResidentReports", {
      screen: "MyReportsScreen",
      params,
    });
  };

  const openReportDetails = (reportId, extraParams = {}) => {
    navigation.navigate("ResidentReportDetails", { reportId, ...extraParams });
  };

  const quickActions = [
    {
      title: "Create a Report",
      subtitle: "Tell us about an incident in your area",
      icon: "create-outline",
      iconColor: "#7c3aed",
      iconSoft: theme.mode === "dark" ? "rgba(124, 58, 237, 0.14)" : "rgba(255,255,255,0.92)",
      colors: theme.mode === "dark" ? ["#1b1630", "#241a40"] : ["#e8ddff", "#d9c9ff"],
      arrowColor: "#7c3aed",
      onPress: () => navigation.navigate("SubmitReport"),
    },
    {
      title: "My Reports Hub",
      subtitle: "Open your report history and track status updates",
      icon: "folder-open-outline",
      iconColor: "#2563eb",
      iconSoft: theme.mode === "dark" ? "rgba(37, 99, 235, 0.14)" : "rgba(255,255,255,0.92)",
      colors: theme.mode === "dark" ? ["#141f35", "#182846"] : ["#dcecff", "#cfe2ff"],
      arrowColor: "#2563eb",
      onPress: () => openReports(),
    },
  ];

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <AppHeader title="Dashboard" variant="toolbar" />

      <View style={styles.heroRow}>
        <LinearGradient colors={heroGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />
          <View style={styles.heroCornerRing} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroEyebrowPill}>
              <Ionicons name="home-outline" size={12} color={theme.primary} />
              <Text style={styles.heroEyebrowText}>Residential Account</Text>
            </View>
          </View>
          <View style={styles.heroBodyRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{`Hi, ${displayName} \u{1F44B}`}</Text>
              <Text style={styles.heroSubtitle}>Here&apos;s a quick overview of your barangay activity.</Text>
              <View style={styles.heroFooterPill}>
                <Ionicons name="location" size={14} color={theme.primary} />
                <Text style={styles.purokPillText}>{getPurokLabel(currentUser?.purok)}</Text>
              </View>
            </View>
            <View style={styles.heroArt}>
              <View style={styles.cloudLarge} />
              <View style={styles.cloudSmall} />
              <View style={styles.illustrationGround} />
              <View style={styles.treeLeft} />
              <View style={styles.treeRight} />
              <View style={styles.houseBody}>
                <View style={styles.houseRoof} />
                <View style={styles.houseDoor} />
                <View style={styles.houseWindowLeft} />
                <View style={styles.houseWindowRight} />
              </View>
              <View style={styles.streetPole} />
            </View>
          </View>
        </LinearGradient>

        <LinearGradient colors={impactGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.impactCard}>
          <View style={styles.impactGlowTop} />
          <View style={styles.impactGlowBottom} />
          <View style={styles.impactHeaderRow}>
            <View style={styles.impactBadge}>
              <Ionicons name="leaf-outline" size={18} color="#22c55e" />
            </View>
            <View style={styles.impactHeaderCopy}>
              <Text style={styles.impactTitle}>{"Your reports create impact \u{1F33F}"}</Text>
              <Text style={styles.impactLeadText}>Thank you for helping make our community a better place to live.</Text>
            </View>
          </View>
          <View style={styles.impactStatsPanel}>
            <View style={styles.impactStatCol}>
              <View style={[styles.impactStatIconWrap, styles.impactStatGreen]}>
                <Ionicons name="document-text-outline" size={18} color="#22c55e" />
              </View>
              <Text style={[styles.impactValue, styles.impactValueGreen]}>{residentReports.length}</Text>
              <Text style={styles.impactMetricText}>Reports submitted</Text>
              <Text style={[styles.impactTrendText, styles.impactTrendGreen]}>{`${submittedTrend >= 0 ? "\u2191" : "\u2193"} ${Math.abs(submittedTrend)}% this month`}</Text>
            </View>
            <View style={styles.impactStatDivider} />
            <View style={styles.impactStatCol}>
              <View style={[styles.impactStatIconWrap, styles.impactStatBlue]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#3b82f6" />
              </View>
              <Text style={[styles.impactValue, styles.impactValueBlue]}>{statusCounts.Resolved}</Text>
              <Text style={styles.impactMetricText}>Issues resolved</Text>
              <Text style={[styles.impactTrendText, styles.impactTrendBlue]}>{`${resolvedTrend >= 0 ? "\u2191" : "\u2193"} ${Math.abs(resolvedTrend)}% this month`}</Text>
            </View>
          </View>
          <View style={styles.impactFooterBanner}>
            <View style={styles.impactFooterIcon}>
              <Ionicons name="star" size={14} color="#22c55e" />
            </View>
            <Text style={styles.impactFooterText}>Keep it up! Your reports help build a safer and stronger community.</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.statusRow}>
        {statusItems.map((item) => (
          <StatusSummaryCard
            key={item.label}
            item={item}
            styles={styles}
            onPress={() => openReports({ statusFilter: item.label })}
          />
        ))}
      </View>

        <View style={styles.quickActionRow}>
          {quickActions.map((item) => (
          <QuickActionCard key={item.title} item={item} styles={styles} theme={theme} />
          ))}
        </View>

      <View style={styles.flatSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Report Summary</Text>
          <Pressable style={styles.sectionLink} onPress={() => setSummaryModalOpen(true)}>
            <Text style={styles.sectionLinkText}>View Summary</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.summaryPanel}>
          <SummaryStatCard
            icon="document-text-outline"
            iconColor="#8b5cf6"
            iconSoft="rgba(139, 92, 246, 0.12)"
            value={residentReports.length}
            label="Total Reports"
            sublabel="All time"
            styles={styles}
            theme={theme}
          />
          <SummaryStatCard
            icon="folder-open-outline"
            iconColor="#f59e0b"
            iconSoft="rgba(245, 158, 11, 0.12)"
            value={mostReportedType}
            label="Most Reported"
            sublabel="Based on your reports"
            styles={styles}
            theme={theme}
          />
          <SummaryStatCard
            icon="time-outline"
            iconColor="#10b981"
            iconSoft="rgba(16, 185, 129, 0.12)"
            value={getRelativeTimeLabel(latestUpdatedReport?.updatedAt || latestUpdatedReport?.createdAt)}
            label="Last Updated"
            sublabel={latestUpdatedReport ? formatDate(latestUpdatedReport.updatedAt || latestUpdatedReport.createdAt) : "No updates yet"}
            styles={styles}
            theme={theme}
          />
        </View>
      </View>

      <View style={styles.flatSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable style={styles.sectionLink} onPress={() => navigation.navigate("ResidentNotifications")}>
            <Text style={styles.sectionLinkText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.activityList}>
          {recentActivities.length ? (
            recentActivities.map((item) => (
              <RecentActivityCard
                key={item.id}
                item={item}
                theme={theme}
                styles={styles}
                onPress={item.reportId ? () => openReportDetails(item.reportId, item.type === "feedback" || item.type === "reply" ? { scrollTo: "feedback" } : {}) : null}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No recent activity yet</Text>
              <Text style={styles.emptyText}>Status updates and admin replies will appear here automatically.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.flatSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <Pressable style={styles.sectionLink} onPress={() => openReports()}>
            <Text style={styles.sectionLinkText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.reportList}>
          {recentReports.length ? (
            recentReports.map((report) => (
              <AdminReportListCard
                key={report.id}
                report={report}
                navigation={navigation}
                showResidentProfileLink={false}
                showResidentName={false}
                footerLabel="Open Report"
                onPress={() => openReportDetails(report.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>Your latest submitted reports will appear here.</Text>
            </View>
          )}
        </View>
      </View>

      <SummaryModal
        visible={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        timelineData={timelineData}
        statusItems={statusItems}
        totalReports={residentReports.length}
        monthCount={monthCount}
        dominantStatus={dominantStatus}
        mostReportedType={mostReportedType}
        growthText={growthText}
        compareText={compareText}
        styles={styles}
        theme={theme}
      />
    </ScreenContainer>
  );
}

function createStyles(theme, compact) {
  return StyleSheet.create({
    screenContent: {
      gap: 22,
      paddingBottom: 144,
    },
    heroRow: {
      gap: 14,
      alignItems: "stretch",
    },
    heroCard: {
      width: "100%",
      minHeight: compact ? 176 : 196,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.22)" : "rgba(191, 211, 255, 0.88)",
      paddingHorizontal: compact ? 14 : 18,
      paddingVertical: compact ? 14 : 18,
      gap: compact ? 10 : 12,
      overflow: "hidden",
      position: "relative",
      shadowColor: theme.mode === "dark" ? "rgba(0, 0, 0, 0.34)" : "rgba(84, 129, 255, 0.22)",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 4,
    },
    heroGlowPrimary: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 999,
      top: -82,
      left: -48,
      backgroundColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.12)" : "rgba(255,255,255,0.7)",
    },
    heroGlowSecondary: {
      position: "absolute",
      width: 118,
      height: 118,
      borderRadius: 999,
      right: -36,
      bottom: -36,
      backgroundColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.18)" : "rgba(139, 174, 255, 0.16)",
    },
    heroCornerRing: {
      position: "absolute",
      right: -14,
      top: 40,
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 7,
      borderColor: theme.mode === "dark" ? "rgba(167, 191, 255, 0.12)" : "rgba(255,255,255,0.62)",
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    heroEyebrowPill: {
      minHeight: compact ? 26 : 30,
      alignSelf: "flex-start",
      maxWidth: compact ? 170 : 200,
      paddingHorizontal: compact ? 10 : 12,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.12)" : "rgba(238, 244, 255, 0.96)",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.24)" : "rgba(79, 131, 255, 0.14)",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    heroBodyRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: compact ? 10 : 14,
      minHeight: compact ? 118 : 130,
    },
    heroCopy: {
      flex: 1,
      gap: compact ? 8 : 10,
      minWidth: 0,
      justifyContent: "space-between",
      paddingTop: compact ? 2 : 4,
      paddingBottom: compact ? 2 : 4,
    },
    heroEyebrowText: {
      color: theme.primary,
      fontSize: compact ? 10 : 11,
      fontWeight: "800",
      letterSpacing: 0.2,
      flexShrink: 1,
    },
    heroTitle: {
      color: theme.text,
      fontSize: compact ? 22 : 28,
      fontWeight: "900",
      lineHeight: compact ? 28 : 34,
      minWidth: 0,
    },
    heroSubtitle: {
      color: theme.mode === "dark" ? theme.textMuted : "#5a6b86",
      fontSize: compact ? 12 : 14,
      lineHeight: compact ? 18 : 21,
      minWidth: 0,
      flexShrink: 1,
      maxWidth: compact ? "95%" : "90%",
    },
    heroFooterPill: {
      alignSelf: "flex-start",
      minHeight: compact ? 32 : 36,
      paddingHorizontal: compact ? 12 : 14,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(16, 27, 46, 0.92)" : "#ffffff",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.24)" : "rgba(79, 131, 255, 0.16)",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      shadowColor: theme.mode === "dark" ? "rgba(0, 0, 0, 0.24)" : "rgba(84, 129, 255, 0.12)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 2,
    },
    purokPillText: {
      color: theme.mode === "dark" ? theme.text : "#2d3d5c",
      fontSize: compact ? 10 : 12,
      fontWeight: "800",
    },
    heroArt: {
      width: compact ? 124 : 170,
      minHeight: compact ? 110 : 132,
      position: "relative",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: compact ? 4 : 8,
      flexShrink: 0,
    },
    cloudLarge: {
      position: "absolute",
      top: 8,
      right: 10,
      width: compact ? 34 : 44,
      height: compact ? 10 : 14,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.72)",
    },
    cloudSmall: {
      position: "absolute",
      top: 24,
      left: 8,
      width: compact ? 24 : 30,
      height: compact ? 8 : 10,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.64)",
    },
    illustrationGround: {
      position: "absolute",
      bottom: 6,
      width: compact ? 126 : 152,
      height: compact ? 18 : 22,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.16)" : "rgba(174, 212, 255, 0.28)",
    },
    treeLeft: {
      position: "absolute",
      left: 6,
      bottom: compact ? 20 : 30,
      width: compact ? 18 : 24,
      height: compact ? 34 : 48,
      borderRadius: 14,
      backgroundColor: "#41c36f",
    },
    treeRight: {
      position: "absolute",
      right: 18,
      bottom: compact ? 20 : 30,
      width: compact ? 20 : 26,
      height: compact ? 38 : 54,
      borderRadius: 14,
      backgroundColor: "#25a77d",
    },
    houseBody: {
      width: compact ? 76 : 96,
      height: compact ? 58 : 70,
      backgroundColor: theme.mode === "dark" ? "#dce7ff" : "#ffffff",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.28)" : "rgba(79, 131, 255, 0.22)",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: compact ? 5 : 8,
      position: "relative",
      overflow: "visible",
      marginBottom: compact ? 4 : 10,
    },
    houseRoof: {
      position: "absolute",
      top: compact ? -18 : -22,
      width: 0,
      height: 0,
      borderLeftWidth: compact ? 40 : 48,
      borderRightWidth: compact ? 40 : 48,
      borderBottomWidth: compact ? 28 : 34,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: "#ff7a59",
    },
    houseDoor: {
      width: compact ? 16 : 18,
      height: compact ? 24 : 28,
      borderRadius: 6,
      backgroundColor: "#5b77ff",
    },
    houseWindowLeft: {
      position: "absolute",
      left: compact ? 12 : 18,
      top: compact ? 14 : 18,
      width: compact ? 10 : 12,
      height: compact ? 9 : 10,
      borderRadius: 3,
      backgroundColor: "#9dc0ff",
    },
    houseWindowRight: {
      position: "absolute",
      right: compact ? 12 : 18,
      top: compact ? 14 : 18,
      width: compact ? 10 : 12,
      height: compact ? 9 : 10,
      borderRadius: 3,
      backgroundColor: "#9dc0ff",
    },
    streetPole: {
      position: "absolute",
      right: 0,
      bottom: compact ? 10 : 20,
      width: 4,
      height: compact ? 44 : 54,
      borderRadius: 999,
      backgroundColor: "#2c3d63",
    },
    impactCard: {
      width: "100%",
      minHeight: compact ? 212 : 224,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.2)" : "rgba(191, 230, 188, 0.7)",
      paddingHorizontal: compact ? 14 : 18,
      paddingVertical: compact ? 14 : 18,
      gap: compact ? 12 : 14,
      shadowColor: theme.mode === "dark" ? "rgba(0, 0, 0, 0.34)" : "rgba(52, 211, 153, 0.18)",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 4,
      justifyContent: "space-between",
      overflow: "hidden",
      position: "relative",
    },
    impactGlowTop: {
      position: "absolute",
      top: -30,
      right: -24,
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.08)" : "rgba(255,255,255,0.54)",
    },
    impactGlowBottom: {
      position: "absolute",
      left: -22,
      bottom: -30,
      width: 108,
      height: 108,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.12)" : "rgba(163, 230, 165, 0.16)",
    },
    impactHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: compact ? 10 : 12,
      position: "relative",
      zIndex: 1,
    },
    impactHeaderCopy: {
      flex: 1,
      gap: compact ? 4 : 6,
      minWidth: 0,
      paddingTop: 2,
    },
    impactBadge: {
      width: compact ? 42 : 48,
      height: compact ? 42 : 48,
      borderRadius: compact ? 21 : 24,
      backgroundColor: theme.mode === "dark" ? "rgba(16, 27, 46, 0.9)" : "rgba(255,255,255,0.94)",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.16)" : "transparent",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "rgba(34, 197, 94, 0.16)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 2,
    },
    impactTitle: {
      color: theme.text,
      fontSize: compact ? 20 : 22,
      fontWeight: "900",
      lineHeight: compact ? 24 : 28,
    },
    impactLeadText: {
      color: theme.mode === "dark" ? theme.textMuted : "#637085",
      fontSize: compact ? 11 : 13,
      lineHeight: compact ? 16 : 19,
    },
    impactStatsPanel: {
      flexDirection: "row",
      backgroundColor: theme.mode === "dark" ? "rgba(16, 27, 46, 0.88)" : "rgba(255,255,255,0.92)",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(79, 131, 255, 0.16)" : "rgba(191, 211, 255, 0.24)",
      paddingHorizontal: compact ? 10 : 12,
      paddingVertical: compact ? 10 : 12,
      gap: 12,
      position: "relative",
      zIndex: 1,
    },
    impactStatCol: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    impactStatIconWrap: {
      width: compact ? 34 : 38,
      height: compact ? 34 : 38,
      borderRadius: compact ? 17 : 19,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    impactStatGreen: {
      backgroundColor: "rgba(34, 197, 94, 0.12)",
    },
    impactStatBlue: {
      backgroundColor: "rgba(59, 130, 246, 0.12)",
    },
    impactStatDivider: {
      width: 1,
      backgroundColor: theme.mode === "dark" ? "rgba(142, 160, 186, 0.3)" : "rgba(203, 213, 225, 0.9)",
      marginVertical: 4,
    },
    impactValue: {
      fontSize: compact ? 26 : 30,
      fontWeight: "900",
      lineHeight: compact ? 28 : 32,
    },
    impactValueGreen: {
      color: "#22c55e",
    },
    impactValueBlue: {
      color: "#3b82f6",
    },
    impactMetricText: {
      color: theme.mode === "dark" ? theme.textMuted : "#5d6778",
      fontSize: compact ? 10 : 11,
      fontWeight: "700",
      lineHeight: compact ? 13 : 15,
      maxWidth: "100%",
    },
    impactTrendText: {
      fontSize: compact ? 10 : 10,
      fontWeight: "800",
      lineHeight: compact ? 13 : 14,
      marginTop: 2,
    },
    impactTrendGreen: {
      color: "#16a34a",
    },
    impactTrendBlue: {
      color: "#2563eb",
    },
    impactFooterBanner: {
      minHeight: compact ? 46 : 52,
      borderRadius: 16,
      backgroundColor: theme.mode === "dark" ? "rgba(34, 197, 94, 0.14)" : "rgba(34, 197, 94, 0.12)",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(74, 222, 128, 0.22)" : "rgba(134, 239, 172, 0.4)",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: compact ? 10 : 12,
      position: "relative",
      zIndex: 1,
    },
    impactFooterIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#22c55e",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    impactFooterText: {
      flex: 1,
      color: theme.mode === "dark" ? "#86efac" : "#16803d",
      fontSize: compact ? 10 : 11,
      fontWeight: "700",
      lineHeight: compact ? 14 : 16,
    },
    statusRow: {
      flexDirection: "row",
      gap: 10,
    },
    statusCard: {
      flex: 1,
      minHeight: 82,
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(203, 213, 225, 0.72)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingTop: 10,
      paddingBottom: 12,
      position: "relative",
      overflow: "hidden",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    statusGlow: {
      position: "absolute",
      top: -22,
      right: -8,
      width: 64,
      height: 64,
      borderRadius: 999,
      opacity: 0.55,
    },
    statusIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.72)",
    },
    statusValue: {
      fontSize: compact ? 22 : 23,
      fontWeight: "900",
      lineHeight: compact ? 24 : 26,
    },
    statusLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 3,
      textAlign: "center",
    },
    statusAccent: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 8,
      height: 3,
      borderRadius: 999,
    },
    quickActionRow: {
      flexDirection: "row",
      gap: 12,
    },
    quickActionWrap: {
      flex: 1,
      borderRadius: 22,
      overflow: "hidden",
    },
    quickActionCard: {
      minHeight: 98,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.24)" : "rgba(255,255,255,0.4)",
      padding: 14,
      justifyContent: "space-between",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
      overflow: "hidden",
      position: "relative",
    },
    quickActionOrbLarge: {
      position: "absolute",
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.18)",
      top: -28,
      right: -18,
    },
    quickActionOrbSmall: {
      position: "absolute",
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.16)",
      bottom: -12,
      left: -10,
    },
    quickActionTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    quickActionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(255,255,255,0.55)",
    },
    quickActionArrow: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.75)",
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionCopy: {
      gap: 6,
    },
    quickActionTitle: {
      color: "#20304d",
      fontSize: compact ? 16 : 18,
      fontWeight: "900",
      paddingRight: 8,
      lineHeight: compact ? 20 : 22,
    },
    quickActionTitleDark: {
      color: theme.text,
    },
    quickActionSubtitle: {
      color: "#4c5f7d",
      fontSize: compact ? 11 : 12,
      lineHeight: compact ? 15 : 17,
      maxWidth: compact ? 136 : 220,
    },
    quickActionSubtitleDark: {
      color: theme.textMuted,
    },
    flatSection: {
      gap: 12,
      paddingHorizontal: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    sectionLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    sectionLinkText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    summaryPanel: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 10,
    },
    summaryStatCard: {
      flex: 1,
      minWidth: 0,
      minHeight: compact ? 140 : 132,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.72)",
      paddingHorizontal: compact ? 12 : 14,
      paddingVertical: 14,
      justifyContent: "flex-start",
      alignSelf: "stretch",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    summaryStatIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    summaryStatValue: {
      fontSize: compact ? 20 : 21,
      fontWeight: "900",
      lineHeight: compact ? 24 : 24,
      flexShrink: 1,
      minHeight: compact ? 46 : 48,
    },
    summaryStatValueLong: {
      fontSize: compact ? 13 : 15,
      lineHeight: compact ? 16 : 19,
    },
    summaryStatLabel: {
      color: theme.text,
      fontSize: compact ? 12 : 12,
      fontWeight: "800",
      marginTop: 6,
    },
    summaryStatSubLabel: {
      color: theme.textSoft,
      fontSize: compact ? 10 : 11,
      fontWeight: "700",
      marginTop: 2,
      lineHeight: compact ? 13 : 15,
    },
    activityList: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    activityCard: {
      minHeight: 72,
      backgroundColor: theme.surface,
      paddingVertical: 14,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    activityIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    activityCopy: {
      flex: 1,
      gap: 7,
      minWidth: 0,
      paddingTop: 1,
    },
    activityMessage: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
      lineHeight: 18,
    },
    activityMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap",
    },
    activityMeta: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
    },
    activityMetaDivider: {
      color: theme.textSoft,
      fontSize: 10,
      fontWeight: "700",
    },
    reportList: {
      gap: 12,
    },
    emptyState: {
      minHeight: 104,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 16,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.48)",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    modalSheet: {
      width: "100%",
      maxWidth: 430,
      maxHeight: "86%",
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
      position: "relative",
    },
    modalCloseButton: {
      position: "absolute",
      top: 14,
      right: 14,
      zIndex: 2,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modalHeader: {
      gap: 4,
      paddingTop: 4,
      paddingRight: 44,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "900",
    },
    modalSubtitle: {
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 19,
    },
    modalScrollContent: {
      gap: 12,
      paddingBottom: 4,
    },
    modalCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      padding: 14,
      gap: 12,
    },
    modalCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    modalCardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "900",
    },
    modalCardHint: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
    },
    lineChartCard: {
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      gap: 8,
      position: "relative",
    },
    lineChartGrid: {
      ...StyleSheet.absoluteFillObject,
      top: 12,
      bottom: 28,
      justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    lineChartGridLine: {
      borderTopWidth: 1,
      borderColor: theme.border,
      opacity: 0.7,
    },
    lineChartBarsRow: {
      height: 180,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 8,
    },
    lineChartPointCol: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
    },
    lineChartPointValue: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "800",
    },
    lineChartTrack: {
      flex: 1,
      width: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    lineChartBar: {
      width: 18,
      minHeight: 4,
      borderRadius: 999,
    },
    lineChartLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
    },
    statusDistributionWrap: {
      flexDirection: compact ? "column" : "row",
      alignItems: "center",
      gap: 14,
    },
    donutShell: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 132,
    },
    donutRing: {
      width: 116,
      height: 116,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    donutDot: {
      position: "absolute",
      width: 10,
      height: 10,
      borderRadius: 999,
      marginLeft: -5,
      marginTop: -5,
    },
    donutCenter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    donutValue: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 24,
    },
    donutLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
    },
    statusLegend: {
      flex: 1,
      width: "100%",
      gap: 10,
    },
    statusLegendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    statusLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    statusLegendLabel: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    statusLegendValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "900",
    },
    insightList: {
      gap: 12,
    },
    insightRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    insightText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
  });
}
