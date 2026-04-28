import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";
import { formatDate } from "../../utils/dateUtils";

const STATUS_ORDER = ["Pending", "Ongoing", "Resolved", "Rejected"];
const STATUS_COLORS = {
  Pending: "#f59e0b",
  Ongoing: "#2563eb",
  Resolved: "#16a34a",
  Rejected: "#ef4444",
};
const ANALYTICS_COLORS = ["#4f83ff", "#8b5cf6", "#34d399", "#f59e0b", "#ef4444"];

function getTimestamp(value) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeStatus(status = "") {
  return status === "For Confirmation" ? "Ongoing" : status;
}

function getStatusSoft(status) {
  const color = STATUS_COLORS[status] || "#94a3b8";

  if (color === "#f59e0b") {
    return "rgba(245, 158, 11, 0.14)";
  }

  if (color === "#2563eb") {
    return "rgba(37, 99, 235, 0.14)";
  }

  if (color === "#16a34a") {
    return "rgba(22, 163, 74, 0.14)";
  }

  return "rgba(239, 68, 68, 0.14)";
}

function getTrend(current, previous) {
  if (previous === 0 && current === 0) {
    return { icon: "remove-outline", color: "#94a3b8", text: "0% vs yesterday" };
  }

  if (previous === 0 && current > 0) {
    return { icon: "arrow-up-outline", color: "#16a34a", text: "100% vs yesterday" };
  }

  const delta = current - previous;
  const percent = Math.round((Math.abs(delta) / Math.max(previous, 1)) * 100);

  if (delta > 0) {
    return { icon: "arrow-up-outline", color: "#16a34a", text: `${percent}% vs yesterday` };
  }

  if (delta < 0) {
    return { icon: "arrow-down-outline", color: "#ef4444", text: `${percent}% vs yesterday` };
  }

  return { icon: "remove-outline", color: "#94a3b8", text: "0% vs yesterday" };
}

function getRelativeTimeLabel(value) {
  const diff = Math.max(Date.now() - getTimestamp(value), 0);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function getReportTitle(report) {
  return String(report?.incidentType || report?.title || "Untitled report");
}

function getFeedbackTimestamp(report) {
  const thread = [...(report?.adminFeedback || []), ...(report?.residentReplies || [])];
  return thread.reduce((latest, item) => Math.max(latest, getTimestamp(item.createdAt)), 0);
}

function getDayRange(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start: date, end };
}

function countReportsByStatusInRange(reports, status, start, end) {
  return reports.filter((report) => {
    const timestamp = getTimestamp(report.createdAt);
    return normalizeStatus(report.status) === status && timestamp >= start.getTime() && timestamp <= end.getTime();
  }).length;
}

function buildTypeItems(reports) {
  const map = reports.reduce((acc, report) => {
    const key = getReportTitle(report);
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());

  const items = [...map.entries()]
    .map(([label, value], index) => ({
      label,
      value,
      color: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length],
    }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  if (items.length <= 4) {
    return items;
  }

  const top = items.slice(0, 3);
  const remaining = items.slice(3).reduce((sum, item) => sum + item.value, 0);
  return [...top, { label: "Others", value: remaining, color: ANALYTICS_COLORS[4] }];
}

function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getMonthlyTrend(current, previous) {
  if (previous === 0 && current === 0) {
    return { icon: "remove-outline", color: "#94a3b8", text: "No movement yet" };
  }

  if (previous === 0 && current > 0) {
    return { icon: "arrow-up-outline", color: "#16a34a", text: "New activity this month" };
  }

  if (current > previous) {
    return { icon: "arrow-up-outline", color: "#16a34a", text: `${current - previous} more than last month` };
  }

  if (current < previous) {
    return { icon: "arrow-down-outline", color: "#ef4444", text: `${previous - current} fewer than last month` };
  }

  return { icon: "remove-outline", color: "#94a3b8", text: "Same as last month" };
}

function isMeaningfulAnnouncement(value) {
  const trimmed = String(value || "").trim();
  return trimmed.length >= 10 && /[A-Za-z0-9]/.test(trimmed);
}

function countReportsInRange(reports, start, end) {
  return reports.filter((report) => {
    const timestamp = getTimestamp(report.createdAt);
    return timestamp >= start.getTime() && timestamp <= end.getTime();
  }).length;
}

function SummaryStatusCard({ item, styles }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryGlow, { backgroundColor: item.soft }]} />
      <View style={[styles.summaryAccent, { backgroundColor: item.color }]} />
      <View style={[styles.summaryIconWrap, { backgroundColor: item.soft }]}>
        <Ionicons name={item.icon} size={16} color={item.color} />
      </View>
      <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.summaryLabel}>{item.label}</Text>
      <View style={styles.summaryTrendRow}>
        <Ionicons name={item.trend.icon} size={12} color={item.trend.color} />
        <Text style={[styles.summaryTrendText, { color: item.trend.color }]} numberOfLines={1}>
          {item.trend.text}
        </Text>
      </View>
    </View>
  );
}

function QuickActionCard({ item, styles }) {
  return (
    <Pressable style={styles.actionCard} onPress={item.onPress}>
      <View style={styles.actionGlowLarge} />
      <View style={styles.actionGlowSmall} />
      <View style={[styles.actionIconWrap, { backgroundColor: item.iconSoft }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <View style={styles.actionArrowWrap}>
        <Ionicons name="arrow-forward" size={14} color={item.iconColor} />
      </View>
      <Text style={styles.actionTitle}>{item.title}</Text>
      <Text style={styles.actionSubtitle} numberOfLines={2}>
        {item.subtitle}
      </Text>
    </Pressable>
  );
}

function TypeDonut({ items, total, styles, theme, compact }) {
  const dotCount = 40;
  const ringSize = compact ? 68 : 80;
  const centerOffset = ringSize / 2;
  const radius = Math.max(ringSize / 2 - 6, 0);
  const palette = items.flatMap((item) =>
    Array.from({ length: Math.round((item.value / Math.max(total, 1)) * dotCount) }, () => item.color)
  );
  const colors = palette.slice(0, dotCount);

  while (colors.length < dotCount) {
    colors.push(theme.surfaceSoft);
  }

  return (
    <View style={styles.analyticsDonutWrap}>
      <View style={styles.analyticsDonutRing}>
        {colors.map((color, index) => {
          const angle = (Math.PI * 2 * index) / dotCount - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <View
              key={`${color}-${index}`}
              style={[
                styles.analyticsDonutDot,
                {
                  left: centerOffset + x,
                  top: centerOffset + y,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
        <View style={styles.analyticsDonutCenter}>
          <Text style={styles.analyticsDonutValue}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

function AnalyticsCard({ title, subtitle, onPress, children, styles }) {
  return (
    <Pressable style={styles.analyticsCard} onPress={onPress}>
      <View style={styles.analyticsGlowTop} />
      <View style={styles.analyticsGlowBottom} />
      <View style={styles.analyticsHeader}>
        <Text style={styles.analyticsTitle}>{title}</Text>
        <View style={styles.analyticsLinkPill}>
          <Text style={styles.analyticsLink}>View Analytics</Text>
        </View>
      </View>
      <Text style={styles.analyticsSubtitle}>{subtitle}</Text>
      <View style={styles.analyticsBody}>{children}</View>
    </Pressable>
  );
}

function AnnouncementModal({ visible, value, error, onChange, onClose, onSubmit, submitting, styles, theme }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => null}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Announce to Residents</Text>
            <Pressable style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.modalSubtitle}>
            Send one live announcement to all residents using the current notification system.
          </Text>

          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Type your announcement here..."
            placeholderTextColor={theme.placeholder}
            style={styles.modalInput}
            multiline
            textAlignVertical="top"
            maxLength={300}
          />

          {error ? <Text style={styles.modalError}>{error}</Text> : null}

          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondaryButton} onPress={onClose}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalPrimaryButton} onPress={onSubmit} disabled={submitting}>
              <Text style={styles.modalPrimaryText}>{submitting ? "Sending..." : "Send Announcement"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { reports, accounts, currentUser, sendAnnouncement, showAlert, theme } = useApp();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementError, setAnnouncementError] = useState("");
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);

  const residents = useMemo(() => accounts.filter((account) => account.role === "resident"), [accounts]);
  const todayRange = useMemo(() => getDayRange(0), []);
  const yesterdayRange = useMemo(() => getDayRange(-1), []);

  const statusCounts = useMemo(
    () =>
      STATUS_ORDER.reduce(
        (result, status) => ({
          ...result,
          [status]: reports.filter((report) => normalizeStatus(report.status) === status).length,
        }),
        {}
      ),
    [reports]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Pending",
        value: statusCounts.Pending || 0,
        icon: "time-outline",
        color: STATUS_COLORS.Pending,
        soft: getStatusSoft("Pending"),
        trend: getTrend(
          countReportsByStatusInRange(reports, "Pending", todayRange.start, todayRange.end),
          countReportsByStatusInRange(reports, "Pending", yesterdayRange.start, yesterdayRange.end)
        ),
      },
      {
        label: "Ongoing",
        value: statusCounts.Ongoing || 0,
        icon: "sync-outline",
        color: STATUS_COLORS.Ongoing,
        soft: getStatusSoft("Ongoing"),
        trend: getTrend(
          countReportsByStatusInRange(reports, "Ongoing", todayRange.start, todayRange.end),
          countReportsByStatusInRange(reports, "Ongoing", yesterdayRange.start, yesterdayRange.end)
        ),
      },
      {
        label: "Resolved",
        value: statusCounts.Resolved || 0,
        icon: "checkmark-circle-outline",
        color: STATUS_COLORS.Resolved,
        soft: getStatusSoft("Resolved"),
        trend: getTrend(
          countReportsByStatusInRange(reports, "Resolved", todayRange.start, todayRange.end),
          countReportsByStatusInRange(reports, "Resolved", yesterdayRange.start, yesterdayRange.end)
        ),
      },
      {
        label: "Rejected",
        value: statusCounts.Rejected || 0,
        icon: "close-circle-outline",
        color: STATUS_COLORS.Rejected,
        soft: getStatusSoft("Rejected"),
        trend: getTrend(
          countReportsByStatusInRange(reports, "Rejected", todayRange.start, todayRange.end),
          countReportsByStatusInRange(reports, "Rejected", yesterdayRange.start, yesterdayRange.end)
        ),
      },
    ],
    [reports, statusCounts, todayRange.end, todayRange.start, yesterdayRange.end, yesterdayRange.start]
  );

  const quickActions = useMemo(
    () => [
      {
        title: "Resident Accounts",
        subtitle: "Manage and view resident accounts",
        icon: "people-outline",
        iconColor: "#7c3aed",
        iconSoft: "rgba(124, 58, 237, 0.12)",
        onPress: () => navigation.navigate("ManageAccountsScreen"),
      },
      {
        title: "Manage Reports",
        subtitle: "Review, update and monitor reports",
        icon: "document-text-outline",
        iconColor: "#16a34a",
        iconSoft: "rgba(22, 163, 74, 0.12)",
        onPress: () => navigation.navigate("AdminReports", { screen: "AllReportsScreen" }),
      },
      {
        title: "Announce to Residents",
        subtitle: "Send announcements and updates",
        icon: "megaphone-outline",
        iconColor: "#f97316",
        iconSoft: "rgba(249, 115, 22, 0.12)",
        onPress: () => setAnnouncementModalOpen(true),
      },
    ],
    [navigation]
  );

  const latestFeedbackReports = useMemo(
    () =>
      reports
        .map((report) => ({ report, latestFeedbackAt: getFeedbackTimestamp(report) }))
        .filter((item) => item.latestFeedbackAt > 0)
        .sort((left, right) => right.latestFeedbackAt - left.latestFeedbackAt)
        .slice(0, 3),
    [reports]
  );

  const recentReports = useMemo(
    () => [...reports].sort((left, right) => getTimestamp(right.createdAt) - getTimestamp(left.createdAt)).slice(0, 5),
    [reports]
  );

  const typeItems = useMemo(() => buildTypeItems(reports), [reports]);
  const currentMonthReports = useMemo(() => {
    const range = getMonthRange(0);
    return countReportsInRange(reports, range.start, range.end);
  }, [reports]);
  const previousMonthReports = useMemo(() => {
    const range = getMonthRange(-1);
    return countReportsInRange(reports, range.start, range.end);
  }, [reports]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(currentMonthReports, previousMonthReports), [currentMonthReports, previousMonthReports]);

  const handleAnnouncementSubmit = async () => {
    if (!isMeaningfulAnnouncement(announcementText)) {
      setAnnouncementError("Message must contain meaningful text (min 10 characters)");
      return;
    }

    try {
      setSubmittingAnnouncement(true);
      setAnnouncementError("");
      await sendAnnouncement(currentUser?.id, announcementText);
      setAnnouncementText("");
      setAnnouncementModalOpen(false);
      showAlert("Announcement Sent", `Your message was sent to ${residents.length} resident${residents.length === 1 ? "" : "s"}.`, {
        variant: "success",
      });
    } catch (error) {
      setAnnouncementError(error.message || "Message must contain meaningful text (min 10 characters)");
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const openAnalytics = () => navigation.navigate("AdminAnalytics");

  return (
    <ScreenContainer contentStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      <AppHeader title="Dashboard" variant="toolbar" />

      <View style={styles.overviewBanner}>
        <View style={styles.overviewCopy}>
          <Text style={styles.overviewEyebrow}>Overview</Text>
          <Text style={styles.overviewTitle}>Manage. Serve. Improve.</Text>
          <Text style={styles.overviewSubtitle}>
            Stay on top of reports and keep your barangay running smoothly.
          </Text>

          <View style={styles.overviewPillsRow}>
            <View style={styles.infoPill}>
              <Ionicons name="calendar-outline" size={14} color={theme.primary} />
              <View>
                <Text style={styles.infoPillLabel}>{formatDate(new Date().toISOString())}</Text>
                <Text style={styles.infoPillHint}>Current Date</Text>
              </View>
            </View>

            <View style={styles.infoPill}>
              <Ionicons name="location-outline" size={14} color={theme.primary} />
              <View style={styles.infoPillCopy}>
                <Text style={styles.infoPillLabel}>All Puroks</Text>
                <Text style={styles.infoPillHint}>Coverage Area</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bannerIllustration}>
          <View style={styles.bannerSun} />
          <View style={styles.bannerCloudLeft} />
          <View style={styles.bannerCloudRight} />
          <View style={styles.bannerGround} />
          <View style={styles.bannerTreeLeft} />
          <View style={styles.bannerTreeRight} />
          <View style={styles.bannerBuilding}>
            <View style={styles.bannerRoof} />
            <View style={styles.bannerFlagPole} />
            <View style={styles.bannerFlag} />
            <View style={styles.bannerColumnsRow}>
              <View style={styles.bannerColumn} />
              <View style={styles.bannerColumn} />
              <View style={styles.bannerColumn} />
            </View>
            <View style={styles.bannerDoor} />
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        {summaryCards.map((item) => (
          <SummaryStatusCard key={item.label} item={item} styles={styles} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          {quickActions.map((item) => (
            <QuickActionCard key={item.title} item={item} styles={styles} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest Feedback</Text>
        <View style={styles.sectionCard}>
          <View style={styles.panelGlowTop} />
          <View style={styles.panelGlowBottom} />
          {latestFeedbackReports.length ? (
            latestFeedbackReports.map((item, index) => (
              <Pressable
                key={item.report.id}
                style={[styles.feedbackRow, index === latestFeedbackReports.length - 1 ? styles.feedbackRowLast : null]}
                onPress={() => navigation.navigate("AdminReportDetails", { reportId: item.report.id })}
              >
                <View style={styles.feedbackIconWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#8b5cf6" />
                </View>
                <View style={styles.feedbackCopy}>
                  <Text style={styles.feedbackTitle} numberOfLines={1}>
                    {getReportTitle(item.report)}
                  </Text>
                  <Text style={styles.feedbackMeta}>
                    {`${item.report.purok || "No purok"} \u2022 ${getRelativeTimeLabel(item.latestFeedbackAt)}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSoft} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent feedback activity yet.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <Pressable style={styles.sectionLink} onPress={() => navigation.navigate("AdminReports", { screen: "AllReportsScreen" })}>
            <Text style={styles.sectionLinkText}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.panelGlowTop} />
          <View style={styles.panelGlowBottom} />
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.colTitle]}>Report Title</Text>
            <Text style={[styles.tableHeaderText, styles.colPurok]}>Purok</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeaderText, styles.colDate]}>Submitted Date</Text>
          </View>

          {recentReports.length ? (
            recentReports.map((report, index) => (
              <Pressable
                key={report.id}
                style={[styles.tableRow, index === recentReports.length - 1 ? styles.tableRowLast : null]}
                onPress={() => navigation.navigate("AdminReportDetails", { reportId: report.id })}
              >
                <Text style={[styles.tableCellText, styles.colTitle]} numberOfLines={1}>
                  {getReportTitle(report)}
                </Text>
                <Text style={[styles.tableCellMuted, styles.colPurok]} numberOfLines={1}>
                  {report.purok || "-"}
                </Text>
                <Text
                  style={[
                    styles.tableCellStatus,
                    styles.colStatus,
                    { color: STATUS_COLORS[normalizeStatus(report.status)] || theme.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {normalizeStatus(report.status)}
                </Text>
                <Text style={[styles.tableCellMuted, styles.colDate]} numberOfLines={1}>
                  {formatDate(report.createdAt)}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No reports available.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        <View style={styles.analyticsRow}>
          <AnalyticsCard title="Reports by Type" subtitle="Live incident mix" onPress={openAnalytics} styles={styles}>
            {reports.length ? (
              <>
                <TypeDonut items={typeItems} total={reports.length} styles={styles} theme={theme} compact={compact} />
                <View style={styles.analyticsLegend}>
                  {typeItems.slice(0, 2).map((item) => (
                    <View key={item.label} style={styles.analyticsLegendRow}>
                      <View style={[styles.analyticsLegendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.analyticsLegendText} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.analyticsEmptyText}>No data</Text>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Trends" subtitle="This month vs last month" onPress={openAnalytics} styles={styles}>
            <View style={styles.avgCardBody}>
              <View style={styles.trendTopRow}>
                <View style={styles.avgTimeIconWrap}>
                  <Ionicons name="trending-up-outline" size={22} color={theme.primary} />
                </View>
                <View style={[styles.trendPill, { backgroundColor: `${monthlyTrend.color}18` }]}>
                  <Ionicons name={monthlyTrend.icon} size={11} color={monthlyTrend.color} />
                  <Text style={[styles.trendPillText, { color: monthlyTrend.color }]} numberOfLines={1}>
                    Live
                  </Text>
                </View>
              </View>
              <View style={styles.trendValueBlock}>
                <Text style={styles.avgTimeValue}>{currentMonthReports}</Text>
                <Text style={styles.avgTimeCaption}>Reports this month</Text>
              </View>
              <View style={styles.avgTimeTrendRow}>
                <Ionicons name={monthlyTrend.icon} size={12} color={monthlyTrend.color} />
                <Text style={[styles.avgTimeTrendText, { color: monthlyTrend.color }]} numberOfLines={2}>
                  {monthlyTrend.text}
                </Text>
              </View>
              <View style={styles.trendCompareRow}>
                <View style={styles.trendCompareCol}>
                  <Text style={styles.trendCompareLabel}>This month</Text>
                  <Text style={styles.trendCompareValue}>{currentMonthReports}</Text>
                </View>
                <View style={styles.trendCompareDivider} />
                <View style={styles.trendCompareCol}>
                  <Text style={styles.trendCompareLabel}>Last month</Text>
                  <Text style={styles.trendCompareValue}>{previousMonthReports}</Text>
                </View>
              </View>
            </View>
          </AnalyticsCard>
        </View>
      </View>

      <AnnouncementModal
        visible={announcementModalOpen}
        value={announcementText}
        error={announcementError}
        onChange={(value) => {
          setAnnouncementText(value);
          if (announcementError) {
            setAnnouncementError("");
          }
        }}
        onClose={() => {
          setAnnouncementModalOpen(false);
          setAnnouncementError("");
        }}
        onSubmit={handleAnnouncementSubmit}
        submitting={submittingAnnouncement}
        styles={styles}
        theme={theme}
      />

    </ScreenContainer>
  );
}

function createStyles(theme, compact) {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    screenContent: {
      gap: compact ? 16 : 18,
      paddingBottom: 132,
    },
    overviewBanner: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: compact ? 12 : 16,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
      overflow: "hidden",
    },
    overviewCopy: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    overviewEyebrow: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    overviewTitle: {
      color: theme.text,
      fontSize: compact ? 24 : 28,
      fontWeight: "900",
      lineHeight: compact ? 30 : 34,
    },
    overviewSubtitle: {
      color: theme.textMuted,
      fontSize: compact ? 12 : 13,
      lineHeight: compact ? 18 : 19,
      maxWidth: compact ? "100%" : "92%",
    },
    overviewPillsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    infoPill: {
      flex: 1,
      minHeight: compact ? 50 : 54,
      borderRadius: compact ? 14 : 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: compact ? 10 : 12,
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 6 : 8,
      minWidth: 0,
    },
    infoPillCopy: {
      flex: 1,
      minWidth: 0,
    },
    infoPillLabel: {
      color: theme.text,
      fontSize: compact ? 11 : 12,
      fontWeight: "800",
    },
    infoPillHint: {
      color: theme.textSoft,
      fontSize: compact ? 9 : 10,
      fontWeight: "700",
      marginTop: 2,
    },
    bannerIllustration: {
      width: compact ? 96 : 136,
      height: compact ? 82 : 104,
      position: "relative",
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    bannerSun: {
      position: "absolute",
      top: 6,
      left: 16,
      width: 20,
      height: 20,
      borderRadius: 999,
      backgroundColor: "rgba(139, 92, 246, 0.18)",
    },
    bannerCloudLeft: {
      position: "absolute",
      top: 12,
      right: 24,
      width: 28,
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
    },
    bannerCloudRight: {
      position: "absolute",
      top: 24,
      right: 8,
      width: 18,
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
    },
    bannerGround: {
      position: "absolute",
      bottom: 10,
      width: compact ? 88 : 118,
      height: compact ? 14 : 18,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(79, 131, 255, 0.16)" : "rgba(79, 131, 255, 0.12)",
    },
    bannerTreeLeft: {
      position: "absolute",
      left: compact ? 12 : 18,
      bottom: compact ? 16 : 20,
      width: compact ? 12 : 16,
      height: compact ? 24 : 32,
      borderRadius: 10,
      backgroundColor: "#34d399",
    },
    bannerTreeRight: {
      position: "absolute",
      right: compact ? 12 : 16,
      bottom: compact ? 16 : 20,
      width: compact ? 12 : 16,
      height: compact ? 24 : 32,
      borderRadius: 10,
      backgroundColor: "#34d399",
    },
    bannerBuilding: {
      width: compact ? 62 : 82,
      height: compact ? 50 : 66,
      borderRadius: compact ? 12 : 16,
      backgroundColor: isDark ? "#f8fbff" : "#ffffff",
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.18)",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: compact ? 6 : 8,
      position: "relative",
    },
    bannerRoof: {
      position: "absolute",
      top: compact ? -10 : -14,
      width: 0,
      height: 0,
      borderLeftWidth: compact ? 32 : 44,
      borderRightWidth: compact ? 32 : 44,
      borderBottomWidth: compact ? 16 : 22,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: "#8b5cf6",
    },
    bannerFlagPole: {
      position: "absolute",
      top: compact ? -20 : -28,
      width: 2,
      height: compact ? 12 : 16,
      backgroundColor: "#7c3aed",
    },
    bannerFlag: {
      position: "absolute",
      top: compact ? -20 : -28,
      left: compact ? 31 : 42,
      width: compact ? 12 : 16,
      height: compact ? 8 : 10,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
      backgroundColor: "#8b5cf6",
    },
    bannerColumnsRow: {
      flexDirection: "row",
      gap: compact ? 6 : 8,
      marginBottom: compact ? 6 : 8,
    },
    bannerColumn: {
      width: compact ? 6 : 8,
      height: compact ? 18 : 24,
      borderRadius: 4,
      backgroundColor: "#dbe6ff",
    },
    bannerDoor: {
      width: compact ? 12 : 16,
      height: compact ? 14 : 18,
      borderRadius: 6,
      backgroundColor: "#4f83ff",
      position: "absolute",
      bottom: 8,
    },
    summaryRow: {
      flexDirection: "row",
      gap: compact ? 8 : 10,
      alignItems: "stretch",
    },
    summaryCard: {
      flex: 1,
      minWidth: 0,
      minHeight: compact ? 102 : 118,
      borderRadius: compact ? 16 : 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      padding: compact ? 10 : 14,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      overflow: "hidden",
      position: "relative",
    },
    summaryGlow: {
      position: "absolute",
      width: compact ? 44 : 56,
      height: compact ? 44 : 56,
      borderRadius: 999,
      top: -12,
      right: -10,
      opacity: isDark ? 0.28 : 0.8,
    },
    summaryAccent: {
      position: "absolute",
      left: 10,
      right: 10,
      bottom: 8,
      height: 3,
      borderRadius: 999,
    },
    summaryIconWrap: {
      width: compact ? 28 : 34,
      height: compact ? 28 : 34,
      borderRadius: compact ? 10 : 12,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryValue: {
      fontSize: compact ? 18 : 24,
      fontWeight: "900",
      lineHeight: compact ? 22 : 28,
      marginTop: compact ? 8 : 12,
    },
    summaryLabel: {
      color: theme.text,
      fontSize: compact ? 10 : 12,
      fontWeight: "800",
      marginTop: 3,
      lineHeight: compact ? 13 : 16,
    },
    summaryTrendRow: {
      marginTop: "auto",
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingTop: compact ? 6 : 10,
      minWidth: 0,
    },
    summaryTrendText: {
      flex: 1,
      fontSize: compact ? 8 : 10,
      fontWeight: "800",
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "900",
    },
    sectionLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sectionLinkText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    actionRow: {
      flexDirection: "row",
      gap: compact ? 8 : 10,
    },
    actionCard: {
      flex: 1,
      minWidth: 0,
      minHeight: compact ? 116 : 126,
      borderRadius: compact ? 16 : 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      padding: compact ? 12 : 16,
      gap: compact ? 8 : 10,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      overflow: "hidden",
      position: "relative",
    },
    actionGlowLarge: {
      position: "absolute",
      width: compact ? 60 : 78,
      height: compact ? 60 : 78,
      borderRadius: 999,
      top: compact ? -18 : -24,
      right: compact ? -12 : -18,
      backgroundColor: isDark ? "rgba(79, 131, 255, 0.12)" : "rgba(79, 131, 255, 0.08)",
    },
    actionGlowSmall: {
      position: "absolute",
      width: compact ? 32 : 42,
      height: compact ? 32 : 42,
      borderRadius: 999,
      bottom: compact ? -12 : -14,
      left: compact ? -12 : -10,
      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.58)",
    },
    actionIconWrap: {
      width: compact ? 34 : 40,
      height: compact ? 34 : 40,
      borderRadius: compact ? 12 : 14,
      alignItems: "center",
      justifyContent: "center",
    },
    actionArrowWrap: {
      position: "absolute",
      top: compact ? 10 : 12,
      right: compact ? 10 : 12,
      width: compact ? 24 : 28,
      height: compact ? 24 : 28,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.76)",
      alignItems: "center",
      justifyContent: "center",
    },
    actionTitle: {
      color: theme.text,
      fontSize: compact ? 12 : 14,
      fontWeight: "900",
      lineHeight: compact ? 16 : 18,
    },
    actionSubtitle: {
      color: theme.textMuted,
      fontSize: compact ? 9 : 11,
      lineHeight: compact ? 13 : 16,
    },
    sectionCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 4,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      position: "relative",
      overflow: "hidden",
    },
    panelGlowTop: {
      position: "absolute",
      width: compact ? 86 : 108,
      height: compact ? 86 : 108,
      borderRadius: 999,
      top: -34,
      right: -26,
      backgroundColor: isDark ? "rgba(79, 131, 255, 0.08)" : "rgba(79, 131, 255, 0.06)",
    },
    panelGlowBottom: {
      position: "absolute",
      width: compact ? 64 : 84,
      height: compact ? 64 : 84,
      borderRadius: 999,
      bottom: -26,
      left: -24,
      backgroundColor: isDark ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.05)",
    },
    feedbackRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    feedbackRowLast: {
      borderBottomWidth: 0,
    },
    feedbackIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(139, 92, 246, 0.18)" : "rgba(139, 92, 246, 0.12)",
    },
    feedbackCopy: {
      flex: 1,
      minWidth: 0,
    },
    feedbackTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
    },
    feedbackMeta: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 4,
    },
    tableCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      overflow: "hidden",
      position: "relative",
    },
    tableHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tableHeaderText: {
      color: theme.textSoft,
      fontSize: compact ? 8 : 10,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    colTitle: {
      flex: compact ? 2.8 : 3.3,
      paddingRight: 8,
    },
    colPurok: {
      flex: compact ? 1.1 : 1.6,
      paddingRight: 8,
    },
    colStatus: {
      flex: compact ? 1.35 : 1.8,
      paddingRight: 8,
    },
    colDate: {
      flex: compact ? 1.75 : 2,
    },
    tableCellText: {
      color: theme.text,
      fontSize: compact ? 10 : 12,
      fontWeight: "800",
    },
    tableCellMuted: {
      color: theme.textMuted,
      fontSize: compact ? 9 : 11,
      fontWeight: "700",
    },
    tableCellStatus: {
      fontSize: compact ? 9 : 11,
      fontWeight: "900",
    },
    analyticsRow: {
      flexDirection: "row",
      gap: compact ? 8 : 10,
      alignItems: "stretch",
    },
    analyticsCard: {
      flex: 1,
      minWidth: 0,
      minHeight: compact ? 176 : 190,
      borderRadius: compact ? 16 : 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      padding: compact ? 10 : 14,
      gap: compact ? 6 : 8,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      overflow: "hidden",
      position: "relative",
    },
    analyticsGlowTop: {
      position: "absolute",
      width: compact ? 74 : 92,
      height: compact ? 74 : 92,
      borderRadius: 999,
      top: -28,
      right: -18,
      backgroundColor: isDark ? "rgba(79, 131, 255, 0.12)" : "rgba(79, 131, 255, 0.08)",
    },
    analyticsGlowBottom: {
      position: "absolute",
      width: compact ? 54 : 70,
      height: compact ? 54 : 70,
      borderRadius: 999,
      bottom: -20,
      left: -14,
      backgroundColor: isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.08)",
    },
    analyticsHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    analyticsTitle: {
      flex: 1,
      color: theme.text,
      fontSize: compact ? 14 : 13,
      fontWeight: "900",
      lineHeight: compact ? 19 : 17,
    },
    analyticsLink: {
      color: theme.primary,
      fontSize: compact ? 8 : 10,
      fontWeight: "800",
    },
    analyticsLinkPill: {
      minHeight: compact ? 22 : 24,
      paddingHorizontal: compact ? 8 : 10,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(79, 131, 255, 0.14)" : theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.16)",
    },
    analyticsSubtitle: {
      color: theme.textMuted,
      fontSize: compact ? 9 : 10,
      lineHeight: compact ? 12 : 14,
      minHeight: compact ? 24 : 28,
    },
    analyticsBody: {
      flex: 1,
      justifyContent: "space-between",
      minWidth: 0,
    },
    analyticsDonutWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 2,
    },
    analyticsDonutRing: {
      width: compact ? 68 : 80,
      height: compact ? 68 : 80,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    analyticsDonutDot: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 999,
      marginLeft: -4,
      marginTop: -4,
    },
    analyticsDonutCenter: {
      width: compact ? 42 : 48,
      height: compact ? 42 : 48,
      borderRadius: compact ? 21 : 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? theme.cardMuted : theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    analyticsDonutValue: {
      color: theme.text,
      fontSize: compact ? 14 : 16,
      fontWeight: "900",
    },
    analyticsLegend: {
      gap: 6,
      marginTop: 8,
    },
    analyticsLegendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    analyticsLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      flexShrink: 0,
    },
    analyticsLegendText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: compact ? 8 : 10,
      fontWeight: "700",
    },
    avgCardBody: {
      flex: 1,
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: compact ? 8 : 10,
    },
    trendTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    avgTimeIconWrap: {
      width: compact ? 34 : 42,
      height: compact ? 34 : 42,
      borderRadius: compact ? 12 : 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primarySoft,
    },
    trendPill: {
      minHeight: compact ? 24 : 26,
      paddingHorizontal: compact ? 8 : 10,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.32)",
    },
    trendPillText: {
      fontSize: compact ? 8 : 9,
      fontWeight: "900",
    },
    trendValueBlock: {
      paddingVertical: compact ? 2 : 4,
    },
    avgTimeValue: {
      color: theme.text,
      fontSize: compact ? 22 : 28,
      fontWeight: "900",
      lineHeight: compact ? 26 : 32,
    },
    avgTimeCaption: {
      color: theme.textMuted,
      fontSize: compact ? 9 : 11,
      fontWeight: "700",
      lineHeight: compact ? 12 : 15,
      marginTop: 2,
    },
    avgTimeTrendRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      minWidth: 0,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: compact ? 8 : 10,
      paddingVertical: compact ? 7 : 8,
    },
    avgTimeTrendText: {
      flex: 1,
      fontSize: compact ? 8 : 10,
      fontWeight: "800",
      lineHeight: compact ? 11 : 14,
    },
    trendCompareRow: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(79, 131, 255, 0.08)" : "rgba(79, 131, 255, 0.06)",
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    trendCompareCol: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: compact ? 8 : 10,
      paddingHorizontal: 6,
      gap: 2,
    },
    trendCompareDivider: {
      width: 1,
      backgroundColor: theme.border,
    },
    trendCompareLabel: {
      color: theme.textSoft,
      fontSize: compact ? 8 : 9,
      fontWeight: "700",
    },
    trendCompareValue: {
      color: theme.text,
      fontSize: compact ? 13 : 15,
      fontWeight: "900",
    },
    analyticsEmptyText: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      paddingVertical: 18,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.5)",
      justifyContent: "center",
      padding: 20,
    },
    modalSheet: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      padding: 16,
      gap: 12,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.inputBackground,
    },
    modalSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    modalInput: {
      minHeight: 140,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      color: theme.inputText,
      fontSize: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    modalError: {
      color: theme.danger,
      fontSize: 12,
      fontWeight: "700",
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
    },
    modalSecondaryButton: {
      minHeight: 46,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    modalSecondaryText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "800",
    },
    modalPrimaryButton: {
      minHeight: 46,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    modalPrimaryText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
