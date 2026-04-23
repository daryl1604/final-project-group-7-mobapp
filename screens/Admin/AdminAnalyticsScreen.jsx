import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { INCIDENT_TYPES, PUROK_OPTIONS, REPORT_STATUSES } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import { formatDate, formatTime } from "../../utils/dateUtils";

const STATUS_COLORS = {
  Pending: "#f5c24b",
  Ongoing: "#4f83ff",
  "For Confirmation": "#9c5cff",
  Resolved: "#34d399",
  Rejected: "#f87171",
};

const PERIOD_FILTERS = [
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "This year", value: "year" },
];

const SUMMARY_CARDS = [
  { key: "week", title: "Weekly reports", icon: "calendar-outline", color: "#4f83ff", compareLabel: "last week" },
  { key: "month", title: "Monthly reports", icon: "stats-chart-outline", color: "#9c5cff", compareLabel: "last month" },
  { key: "year", title: "Yearly reports", icon: "trending-up-outline", color: "#34d399", compareLabel: "last year" },
];

function getSafeDate(value) {
  const nextDate = new Date(value);
  return Number.isNaN(nextDate.getTime()) ? null : nextDate;
}

function startOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function startOfWeek(date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  return nextDate;
}

function endOfWeek(date) {
  const nextDate = startOfWeek(date);
  nextDate.setDate(nextDate.getDate() + 6);
  return endOfDay(nextDate);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date) {
  return endOfDay(new Date(date.getFullYear(), 11, 31));
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function addMonths(date, amount) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + amount);
  return nextDate;
}

function addYears(date, amount) {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + amount);
  return nextDate;
}

function isBetween(date, start, end) {
  return date >= start && date <= end;
}

function countReportsInRange(reports, start, end) {
  return reports.reduce((count, report) => {
    const date = getSafeDate(report.createdAt);
    return date && isBetween(date, start, end) ? count + 1 : count;
  }, 0);
}

function formatTrend(current, previous) {
  const delta = current - previous;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const percentage = previous <= 0 ? (current > 0 ? 100 : 0) : Math.round((Math.abs(delta) / previous) * 100);

  if (direction === "flat") {
    return {
      text: "0%",
      color: "#94a3b8",
      icon: "remove-outline",
    };
  }

  return {
    text: `${direction === "up" ? "+" : "-"}${percentage}%`,
    color: direction === "up" ? "#34d399" : "#f87171",
    icon: direction === "up" ? "arrow-up-outline" : "arrow-down-outline",
  };
}

function getPeriodComparisons(reports) {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const currentWeekEnd = endOfWeek(now);
  const previousWeekStart = addDays(currentWeekStart, -7);
  const previousWeekEnd = endOfDay(addDays(currentWeekStart, -1));

  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthDate = addMonths(currentMonthStart, -1);
  const previousMonthStart = startOfMonth(previousMonthDate);
  const previousMonthEnd = endOfMonth(previousMonthDate);

  const currentYearStart = startOfYear(now);
  const currentYearEnd = endOfYear(now);
  const previousYearDate = addYears(currentYearStart, -1);
  const previousYearStart = startOfYear(previousYearDate);
  const previousYearEnd = endOfYear(previousYearDate);

  return {
    week: {
      current: countReportsInRange(reports, currentWeekStart, currentWeekEnd),
      previous: countReportsInRange(reports, previousWeekStart, previousWeekEnd),
    },
    month: {
      current: countReportsInRange(reports, currentMonthStart, currentMonthEnd),
      previous: countReportsInRange(reports, previousMonthStart, previousMonthEnd),
    },
    year: {
      current: countReportsInRange(reports, currentYearStart, currentYearEnd),
      previous: countReportsInRange(reports, previousYearStart, previousYearEnd),
    },
  };
}

function buildTimelineData(reports, filter) {
  const now = new Date();

  if (filter === "week") {
    const start = startOfWeek(now);
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return labels.map((label, index) => {
      const date = addDays(start, index);
      return {
        label,
        shortLabel: label,
        value: countReportsInRange(reports, startOfDay(date), endOfDay(date)),
      };
    });
  }

  if (filter === "month") {
    const start = startOfMonth(now);
    const totalDays = endOfMonth(now).getDate();
    const bucketSize = totalDays > 21 ? 5 : 3;
    const buckets = [];

    for (let day = 1; day <= totalDays; day += bucketSize) {
      const bucketStart = new Date(start.getFullYear(), start.getMonth(), day);
      const bucketEnd = new Date(start.getFullYear(), start.getMonth(), Math.min(day + bucketSize - 1, totalDays));
      buckets.push({
        label: `${day}-${Math.min(day + bucketSize - 1, totalDays)}`,
        shortLabel: `${day}`,
        value: countReportsInRange(reports, startOfDay(bucketStart), endOfDay(bucketEnd)),
      });
    }

    return buckets;
  }

  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), index, 1);
    return {
      label: monthDate.toLocaleDateString("en-PH", { month: "short" }),
      shortLabel: monthDate.toLocaleDateString("en-PH", { month: "short" }),
      value: countReportsInRange(reports, startOfMonth(monthDate), endOfMonth(monthDate)),
    };
  });
}

function buildStatusCounts(reports) {
  return REPORT_STATUSES.map((status) => ({
    label: status,
    value: reports.filter((report) => report.status === status).length,
    color: STATUS_COLORS[status],
  }));
}

function buildPurokCounts(reports) {
  return PUROK_OPTIONS.map((purok) => ({
    label: purok,
    value: reports.filter((report) => report.purok === purok).length,
  }));
}

function buildIncidentCounts(reports) {
  const lookup = new Map();

  INCIDENT_TYPES.forEach((type) => lookup.set(type, 0));
  reports.forEach((report) => {
    const key = report.incidentType || "Other";
    lookup.set(key, (lookup.get(key) || 0) + 1);
  });

  return [...lookup.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function getIncidentIcon(label) {
  const value = String(label || "").toLowerCase();

  if (value.includes("streetlight")) {
    return { name: "bulb-outline", color: "#9c5cff" };
  }

  if (value.includes("noise") || value.includes("disturbance")) {
    return { name: "volume-high-outline", color: "#4f83ff" };
  }

  if (value.includes("trash") || value.includes("garbage")) {
    return { name: "trash-outline", color: "#34d399" };
  }

  if (value.includes("road")) {
    return { name: "construct-outline", color: "#f59e0b" };
  }

  return { name: "warning-outline", color: "#4f83ff" };
}

function StatCard({ item, styles }) {
  const trend = formatTrend(item.current, item.previous);

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${item.color}20` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={styles.statValue}>{item.current}</Text>
      <Text style={styles.statTitle}>{item.title}</Text>
      <View style={styles.statTrendRow}>
        <Ionicons name={trend.icon} size={14} color={trend.color} />
        <Text style={[styles.statTrendText, { color: trend.color }]}>{trend.text}</Text>
        <Text style={styles.statTrendMuted}>vs {item.compareLabel}</Text>
      </View>
    </View>
  );
}

function SummaryVisual({ values, styles, compact }) {
  const maxValue = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const colors = ["#4f83ff", "#9c5cff", "#34d399"];

  return (
    <View style={[styles.summaryVisual, compact ? styles.summaryVisualCompact : null]}>
      <View style={styles.summaryBars}>
        {values.map((value, index) => (
          <View key={`${index}-${value}`} style={styles.summaryBarColumn}>
            <View style={styles.summaryBarTrack}>
              <View
                style={[
                  styles.summaryBarFill,
                  {
                    height: `${Math.max((value / maxValue) * 100, value > 0 ? 18 : 8)}%`,
                    backgroundColor: colors[index],
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.summaryTotalBadge}>
        <Text style={styles.summaryTotalValue}>{total}</Text>
        <Text style={styles.summaryTotalLabel}>Total</Text>
      </View>
    </View>
  );
}

function FilterDropdown({ value, onChange, styles, theme }) {
  const [open, setOpen] = useState(false);
  const selected = PERIOD_FILTERS.find((item) => item.value === value);

  return (
    <>
      <Pressable style={styles.filterButton} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
        <Text style={styles.filterButtonText}>{selected?.label || "Select period"}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => null}>
            <Text style={styles.modalTitle}>Reports over time</Text>
            {PERIOD_FILTERS.map((item) => {
              const active = item.value === value;
              return (
                <Pressable
                  key={item.value}
                  style={[styles.modalOption, active ? styles.modalOptionActive : null]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, active ? styles.modalOptionTextActive : null]}>{item.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function LineChart({ data, styles }) {
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 172;
  const chartPadding = 14;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const usableHeight = chartHeight - chartPadding * 2;
  const usableWidth = Math.max(chartWidth - chartPadding * 2, 0);
  const stepX = data.length > 1 ? usableWidth / (data.length - 1) : 0;
  const tickValues = [maxValue, Math.max(Math.ceil(maxValue / 2), 1), 0];

  const points = data.map((item, index) => {
    const x = chartPadding + stepX * index;
    const y = chartPadding + usableHeight - (item.value / maxValue) * usableHeight;
    return { ...item, x, y };
  });

  return (
    <View style={styles.lineChartBlock}>
      <View style={styles.lineScaleColumn}>
        {tickValues.map((tick, index) => (
          <Text key={`${tick}-${index}`} style={styles.scaleText}>
            {tick}
          </Text>
        ))}
      </View>

      <View style={styles.lineChartMain}>
        <View style={styles.lineChartShell}>
          <View style={styles.lineChartGrid}>
            {[0, 1, 2, 3].map((item) => (
              <View key={item} style={styles.lineChartGridLine} />
            ))}
          </View>

          <View
            style={styles.lineChartCanvas}
            onLayout={(event) => {
              setChartWidth(event.nativeEvent.layout.width);
            }}
          >
            {points.map((point, index) => {
              if (index === 0) {
                return null;
              }

              const previous = points[index - 1];
              const dx = point.x - previous.x;
              const dy = point.y - previous.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = `${Math.atan2(dy, dx)}rad`;

              return (
                <View
                  key={`segment-${point.label}-${index}`}
                  style={[
                    styles.lineSegment,
                    {
                      width: length,
                      left: previous.x + dx / 2 - length / 2,
                      top: previous.y + dy / 2 - 1.5,
                      transform: [{ rotate: angle }],
                    },
                  ]}
                />
              );
            })}

            {points.map((point, index) => (
              <View key={`point-${point.label}-${index}`}>
                <View style={[styles.linePointGlow, { left: point.x - 7, top: point.y - 7 }]} />
                <View style={[styles.linePoint, { left: point.x - 4, top: point.y - 4 }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.lineChartLabels}>
          {data.map((item, index) => {
            const step = data.length <= 7 ? 1 : Math.ceil(data.length / 5);
            const shouldShow = index === 0 || index === data.length - 1 || index % step === 0;
            return (
              <Text key={`${item.label}-${index}`} style={styles.lineChartLabel}>
                {shouldShow ? item.shortLabel : " "}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function StatusDonut({ items, total, styles, theme }) {
  const ringDots = 56;
  const palette = items.flatMap((item) => Array.from({ length: Math.round((item.value / Math.max(total, 1)) * ringDots) }, () => item.color));
  const colors = palette.length ? palette.slice(0, ringDots) : [];

  while (colors.length < ringDots) {
    colors.push(theme.surfaceSoft);
  }

  return (
    <View style={styles.donutWrap}>
      <View style={styles.donutRing}>
        {colors.map((color, index) => {
          const angle = (Math.PI * 2 * index) / ringDots - Math.PI / 2;
          const radius = 56;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <View
              key={index}
              style={[
                styles.donutDot,
                {
                  left: 66 + x,
                  top: 66 + y,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
        <View style={styles.donutCenter}>
          <Text style={styles.donutValue}>{total}</Text>
          <Text style={styles.donutLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
}

function ReportDetailsModal({ visible, title, subtitle, reports, theme, styles, onClose, onOpenAll }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheetLarge} onPress={() => null}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.detailSubtitle}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailList}>
            {reports.length ? (
              reports.map((report) => (
                <View key={report.id} style={styles.detailCard}>
                  <View style={styles.detailCardHeader}>
                    <Text style={styles.detailCardTitle}>{report.incidentType}</Text>
                    <Text style={[styles.detailCardStatus, { color: STATUS_COLORS[report.status] || theme.textMuted }]}>{report.status}</Text>
                  </View>
                  <Text style={styles.detailCardMeta}>
                    {report.residentName || "Unknown resident"} • {report.purok}
                  </Text>
                  <Text style={styles.detailCardMeta}>
                    {formatDate(report.createdAt)} • {formatTime(report.createdAt)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={28} color={theme.textSoft} />
                <Text style={styles.emptyStateText}>No matching reports found.</Text>
              </View>
            )}
          </ScrollView>

          <Pressable style={styles.secondaryAction} onPress={onOpenAll}>
            <Text style={styles.secondaryActionText}>Open All Reports</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function IncidentRankingsModal({ visible, items, totalReports, styles, theme, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheetLarge} onPress={() => null}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderCopy}>
              <Text style={styles.modalTitle}>Incident rankings</Text>
              <Text style={styles.detailSubtitle}>Full ranked list of incident types from live report data</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.incidentList}>
            {items.map((item) => {
              const percentage = totalReports > 0 ? Math.round((item.value / totalReports) * 100) : 0;
              const icon = getIncidentIcon(item.label);

              return (
                <View key={item.label} style={styles.incidentRow}>
                  <View style={[styles.incidentIconWrap, { backgroundColor: `${icon.color}18` }]}>
                    <Ionicons name={icon.name} size={22} color={icon.color} />
                  </View>
                  <View style={styles.incidentCopy}>
                    <View style={styles.incidentMetaRow}>
                      <Text style={styles.incidentLabel}>{item.label}</Text>
                      <Text style={styles.incidentValue}>
                        {item.value} ({percentage}%)
                      </Text>
                    </View>
                    <View style={styles.incidentTrack}>
                      <View style={[styles.incidentFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AdminAnalyticsScreen({ navigation }) {
  const { reports, theme } = useApp();
  const { width } = useWindowDimensions();
  const [timeFilter, setTimeFilter] = useState("month");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPurok, setSelectedPurok] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [purokModalOpen, setPurokModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const styles = createStyles(theme);
  const compact = width < 390;

  const periodComparisons = useMemo(() => getPeriodComparisons(reports), [reports]);
  const summaryCards = useMemo(
    () =>
      SUMMARY_CARDS.map((item) => ({
        ...item,
        current: periodComparisons[item.key].current,
        previous: periodComparisons[item.key].previous,
      })),
    [periodComparisons]
  );
  const timelineData = useMemo(() => buildTimelineData(reports, timeFilter), [reports, timeFilter]);
  const statusCounts = useMemo(() => buildStatusCounts(reports), [reports]);
  const purokCounts = useMemo(() => buildPurokCounts(reports), [reports]);
  const incidentCounts = useMemo(() => buildIncidentCounts(reports), [reports]);
  const totalReports = reports.length;
  const maxStatus = Math.max(...statusCounts.map((item) => item.value), 1);
  const maxPurok = Math.max(...purokCounts.map((item) => item.value), 1);
  const dominantStatus = statusCounts.reduce((best, item) => (item.value > best.value ? item : best), statusCounts[0]);
  const dominantPurok = purokCounts.reduce((best, item) => (item.value > best.value ? item : best), purokCounts[0]);
  const topIncidents = incidentCounts.slice(0, 5);
  const summaryValues = summaryCards.map((item) => item.current);

  const activeStatus = selectedStatus || (dominantStatus?.value > 0 ? dominantStatus.label : REPORT_STATUSES[0]);
  const activePurok = selectedPurok || (dominantPurok?.value > 0 ? dominantPurok.label : PUROK_OPTIONS[0]);

  const filteredStatusReports = useMemo(
    () => reports.filter((report) => report.status === activeStatus),
    [activeStatus, reports]
  );
  const filteredPurokReports = useMemo(
    () => reports.filter((report) => report.purok === activePurok),
    [activePurok, reports]
  );

  const openAllReports = () => {
    navigation.navigate("AdminReports");
  };

  return (
    <ScreenContainer>
      <AppHeader title="Analytics" variant="toolbar" />

      <View style={styles.screen}>
        <View style={styles.statsGrid}>
          {summaryCards.map((item) => (
            <View key={item.key} style={styles.statCardWrap}>
              <StatCard item={item} styles={styles} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Generated summary</Text>
          <Text style={styles.summaryText}>
            The app is currently tracking {totalReports} report{totalReports === 1 ? "" : "s"}. This week recorded {periodComparisons.week.current}, while
            the current month has {periodComparisons.month.current}. The yearly total is {periodComparisons.year.current}, helping admins compare short-term
            activity against the bigger picture.
          </Text>

          <View style={styles.summaryHighlightRow}>
            <View style={styles.summaryHighlight}>
              <Text style={styles.summaryHighlightLabel}>Highest status volume</Text>
              <Text style={styles.summaryHighlightValue}>
                {dominantStatus.label}: {dominantStatus.value}
              </Text>
            </View>
            <View style={styles.summaryHighlight}>
              <Text style={styles.summaryHighlightLabel}>Most active purok</Text>
              <Text style={styles.summaryHighlightValue}>
                {dominantPurok.label}: {dominantPurok.value}
              </Text>
            </View>
          </View>

          <SummaryVisual values={summaryValues} styles={styles} compact={compact} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.sectionTitle}>Reports over time</Text>
              <Text style={styles.sectionCaption}>Live counts grouped by the selected reporting period</Text>
            </View>
            <FilterDropdown value={timeFilter} onChange={setTimeFilter} styles={styles} theme={theme} />
          </View>
          <LineChart data={timelineData} styles={styles} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.sectionTitle}>Reports by status</Text>
              <Text style={styles.sectionCaption}>Current report distribution by workflow stage</Text>
            </View>
            <Pressable
              style={styles.detailAction}
              onPress={() => {
                setSelectedStatus(activeStatus);
                setStatusModalOpen(true);
              }}
            >
              <Text style={styles.detailActionText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </Pressable>
          </View>

          <View style={[styles.statusContent, !compact ? styles.statusContentWide : null]}>
            <StatusDonut items={statusCounts} total={totalReports} styles={styles} theme={theme} />

            <View style={styles.statusList}>
              {statusCounts.map((item) => {
                const active = item.label === activeStatus;

                return (
                  <Pressable key={item.label} style={[styles.statusRow, active ? styles.activeRow : null]} onPress={() => setSelectedStatus(item.label)}>
                    <View style={styles.statusLabelWrap}>
                      <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                      <Text style={styles.statusLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.statusBarTrack}>
                      <View style={[styles.statusBarFill, { width: `${(item.value / maxStatus) * 100}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={styles.statusValue}>{item.value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.sectionTitle}>Reports by purok</Text>
              <Text style={styles.sectionCaption}>Area activity broken down across all barangay puroks</Text>
            </View>
            <Pressable
              style={styles.detailAction}
              onPress={() => {
                setSelectedPurok(activePurok);
                setPurokModalOpen(true);
              }}
            >
              <Text style={styles.detailActionText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </Pressable>
          </View>

          <View style={styles.purokGrid}>
            {purokCounts.map((item) => {
              const active = item.label === activePurok;

              return (
                <Pressable key={item.label} style={[styles.purokCard, active ? styles.activePurokCard : null]} onPress={() => setSelectedPurok(item.label)}>
                  <View style={styles.purokRow}>
                    <Text style={styles.purokLabel}>{item.label}</Text>
                    <Text style={styles.purokValue}>{item.value}</Text>
                  </View>
                  <View style={styles.purokTrack}>
                    <View style={[styles.purokFill, { width: `${(item.value / maxPurok) * 100}%` }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.sectionTitle}>Top incident types</Text>
              <Text style={styles.sectionCaption}>Most common incident categories based on submitted reports</Text>
            </View>
            <Pressable style={styles.detailAction} onPress={() => setIncidentModalOpen(true)}>
              <Text style={styles.detailActionText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </Pressable>
          </View>

          {topIncidents.length ? (
            <View style={styles.incidentList}>
              {topIncidents.map((item) => {
                const percentage = totalReports > 0 ? Math.round((item.value / totalReports) * 100) : 0;
                const icon = getIncidentIcon(item.label);

                return (
                  <View key={item.label} style={styles.incidentRow}>
                    <View style={[styles.incidentIconWrap, { backgroundColor: `${icon.color}18` }]}>
                      <Ionicons name={icon.name} size={22} color={icon.color} />
                    </View>
                    <View style={styles.incidentCopy}>
                      <View style={styles.incidentMetaRow}>
                        <Text style={styles.incidentLabel}>{item.label}</Text>
                        <Text style={styles.incidentValue}>
                          {item.value} ({percentage}%)
                        </Text>
                      </View>
                      <View style={styles.incidentTrack}>
                        <View style={[styles.incidentFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={28} color={theme.textSoft} />
              <Text style={styles.emptyStateText}>No report data available yet.</Text>
            </View>
          )}
        </View>
      </View>

      <ReportDetailsModal
        visible={statusModalOpen}
        title={`Status: ${activeStatus}`}
        subtitle="Live filtered list based on the selected status"
        reports={filteredStatusReports}
        theme={theme}
        styles={styles}
        onClose={() => setStatusModalOpen(false)}
        onOpenAll={openAllReports}
      />

      <ReportDetailsModal
        visible={purokModalOpen}
        title={activePurok}
        subtitle="Live filtered list based on the selected purok"
        reports={filteredPurokReports}
        theme={theme}
        styles={styles}
        onClose={() => setPurokModalOpen(false)}
        onOpenAll={openAllReports}
      />

      <IncidentRankingsModal
        visible={incidentModalOpen}
        items={incidentCounts}
        totalReports={totalReports}
        styles={styles}
        theme={theme}
        onClose={() => setIncidentModalOpen(false)}
      />
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    screen: {
      gap: 16,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 10,
    },
    statCardWrap: {
      flex: 1,
    },
    statCard: {
      backgroundColor: theme.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 8,
      minHeight: 156,
      justifyContent: "space-between",
    },
    statIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: {
      color: theme.text,
      fontSize: 28,
      fontWeight: "900",
      lineHeight: 32,
    },
    statTitle: {
      color: theme.text,
      opacity: 0.86,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 18,
    },
    statTrendRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 4,
    },
    statTrendText: {
      fontSize: 13,
      fontWeight: "800",
    },
    statTrendMuted: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "900",
      lineHeight: 22,
    },
    sectionCaption: {
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    cardHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },
    summaryText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    summaryHighlightRow: {
      flexDirection: "row",
      gap: 10,
    },
    summaryHighlight: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      gap: 4,
    },
    summaryHighlightLabel: {
      color: theme.textSoft,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      lineHeight: 13,
    },
    summaryHighlightValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 18,
    },
    summaryVisual: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 14,
      minHeight: 136,
    },
    summaryVisualCompact: {
      alignItems: "center",
    },
    summaryBars: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      minHeight: 120,
    },
    summaryBarColumn: {
      flex: 1,
    },
    summaryBarTrack: {
      height: 112,
      borderRadius: 18,
      backgroundColor: theme.surfaceSoft,
      overflow: "hidden",
      justifyContent: "flex-end",
    },
    summaryBarFill: {
      width: "100%",
      minHeight: 8,
      borderRadius: 18,
    },
    summaryTotalBadge: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 2,
      borderColor: "#9c5cff",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
    },
    summaryTotalValue: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 24,
    },
    summaryTotalLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
    },
    filterButton: {
      minHeight: 38,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
    },
    filterButtonText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
    },
    lineChartBlock: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 10,
    },
    lineScaleColumn: {
      width: 18,
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    scaleText: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    lineChartMain: {
      flex: 1,
      gap: 8,
    },
    lineChartShell: {
      height: 172,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 8,
    },
    lineChartGrid: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    lineChartGridLine: {
      borderTopWidth: 1,
      borderColor: theme.border,
      opacity: 0.75,
    },
    lineChartCanvas: {
      flex: 1,
      position: "relative",
    },
    lineSegment: {
      position: "absolute",
      height: 3,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    linePointGlow: {
      position: "absolute",
      width: 14,
      height: 14,
      borderRadius: 999,
      backgroundColor: "rgba(79, 131, 255, 0.16)",
    },
    linePoint: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.primary,
      borderWidth: 2,
      borderColor: theme.surface,
    },
    lineChartLabels: {
      flexDirection: "row",
      gap: 2,
    },
    lineChartLabel: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    detailAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingTop: 2,
    },
    detailActionText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    statusContent: {
      gap: 16,
    },
    statusContentWide: {
      flexDirection: "row",
      alignItems: "center",
    },
    donutWrap: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 144,
    },
    donutRing: {
      width: 132,
      height: 132,
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
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    donutValue: {
      color: theme.text,
      fontSize: 26,
      fontWeight: "900",
      lineHeight: 28,
    },
    donutLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
    },
    statusList: {
      flex: 1,
      gap: 10,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 34,
      borderRadius: 14,
      paddingHorizontal: 6,
    },
    activeRow: {
      backgroundColor: theme.inputBackground,
    },
    statusLabelWrap: {
      width: 126,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 999,
    },
    statusLabel: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
      flexShrink: 1,
    },
    statusBarTrack: {
      flex: 1,
      height: 12,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      overflow: "hidden",
    },
    statusBarFill: {
      height: "100%",
      borderRadius: 999,
    },
    statusValue: {
      width: 18,
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
      textAlign: "right",
    },
    purokGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
    },
    purokCard: {
      width: "48.4%",
      borderRadius: 16,
      padding: 10,
      gap: 8,
    },
    activePurokCard: {
      backgroundColor: theme.inputBackground,
    },
    purokRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    purokLabel: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
      flex: 1,
    },
    purokValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    purokTrack: {
      height: 12,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      overflow: "hidden",
    },
    purokFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    incidentList: {
      gap: 14,
    },
    incidentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    incidentIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    incidentCopy: {
      flex: 1,
      gap: 8,
    },
    incidentMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    incidentLabel: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
      flex: 1,
      lineHeight: 20,
    },
    incidentValue: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
    },
    incidentTrack: {
      height: 12,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      overflow: "hidden",
    },
    incidentFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
      width: "100%",
      maxWidth: 420,
    },
    modalSheetLarge: {
      maxHeight: "82%",
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
      lineHeight: 20,
    },
    modalOption: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalOptionActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primarySoft,
    },
    modalOptionText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    modalOptionTextActive: {
      color: theme.primary,
    },
    detailHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-start",
    },
    detailHeaderCopy: {
      flex: 1,
      gap: 4,
    },
    detailSubtitle: {
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18,
    },
    detailList: {
      gap: 10,
    },
    detailCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      padding: 14,
      gap: 6,
    },
    detailCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    detailCardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
      flex: 1,
      lineHeight: 20,
    },
    detailCardStatus: {
      fontSize: 13,
      fontWeight: "800",
    },
    detailCardMeta: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    secondaryAction: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryActionText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    emptyState: {
      minHeight: 120,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 16,
    },
    emptyStateText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
    },
  });
}
