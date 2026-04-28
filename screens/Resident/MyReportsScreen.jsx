import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import AdminReportListCard from "../../components/reports/AdminReportListCard";
import { REPORT_STATUSES } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";

const SORT_OPTIONS = [
  { label: "A to Z", value: "type", icon: "text-outline", tint: "#57b4ff" },
  { label: "Newest to Oldest", value: "newest", icon: "calendar-outline", tint: "#57b4ff" },
  { label: "Oldest to Newest", value: "oldest", icon: "time-outline", tint: "#55d88c" },
];

const INCIDENT_TYPE_GROUPS = [
  {
    options: [
      { label: "Noise Complaint", value: "noise-complaint", aliases: ["Noise Complaint", "Public Disturbance"], icon: "volume-high-outline", tint: "#55d88c" },
      { label: "Trash / Garbage Issue", value: "trash-garbage-issue", aliases: ["Trash / Garbage Issue", "Trash Complaint"], icon: "trash-outline", tint: "#55d88c" },
      { label: "Flooding", value: "flooding", aliases: ["Flooding"], icon: "water-outline", tint: "#55d88c" },
      { label: "Road Damage", value: "road-damage", aliases: ["Road Damage"], icon: "construct-outline", tint: "#55d88c" },
      { label: "Broken Streetlight", value: "broken-streetlight", aliases: ["Broken Streetlight"], icon: "bulb-outline", tint: "#55d88c" },
      { label: "Drainage Problem", value: "drainage-problem", aliases: ["Drainage Problem", "Drainage Concern"], icon: "git-network-outline", tint: "#55d88c" },
      { label: "Illegal Parking", value: "illegal-parking", aliases: ["Illegal Parking"], icon: "car-outline", tint: "#55d88c" },
      { label: "Vandalism", value: "vandalism", aliases: ["Vandalism"], icon: "color-wand-outline", tint: "#55d88c" },
      { label: "Stray Animals", value: "stray-animals", aliases: ["Stray Animals"], icon: "paw-outline", tint: "#55d88c" },
      { label: "Others", value: "other", aliases: ["Other", "Others", "Water Leak"], icon: "apps-outline", tint: "#55d88c" },
    ],
  },
];

const INCIDENT_FILTER_OPTIONS = [
  { label: "All Incidents", value: "", icon: "warning-outline", tint: "#55d88c" },
  ...INCIDENT_TYPE_GROUPS.flatMap((group) => group.options),
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "", icon: "filter-outline", tint: "#b56eff" },
  ...REPORT_STATUSES.map((status) => {
    if (status === "Pending") {
      return { label: status, value: status, icon: "time-outline", tint: "#ffbf5a" };
    }

    if (status === "Ongoing") {
      return { label: status, value: status, icon: "sync-outline", tint: "#4f83ff" };
    }

    if (status === "For Confirmation") {
      return { label: status, value: status, icon: "checkmark-done-circle-outline", tint: "#b56eff" };
    }

    if (status === "Resolved") {
      return { label: status, value: status, icon: "checkmark-circle-outline", tint: "#34d399" };
    }

    return { label: status, value: status, icon: "close-circle-outline", tint: "#f87171" };
  }),
];

function normalizeText(value = "") {
  return value.trim().toLowerCase();
}

function getNormalizedIncidentType(incidentType = "") {
  const normalized = normalizeText(incidentType);

  for (const group of INCIDENT_TYPE_GROUPS) {
    for (const option of group.options) {
      if (option.aliases.some((alias) => normalizeText(alias) === normalized)) {
        return option.value;
      }
    }
  }

  return normalized;
}

function getNormalizedResidentReportStatus(status = "") {
  return status === "For Confirmation" ? "Ongoing" : status;
}

function DropdownField({ label, value, options, onChange, placeholder, styles, theme, compact = false }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <>
      <View style={compact ? styles.quickDropdownField : styles.dropdownField}>
        <Text style={compact ? styles.quickDropdownLabel : styles.dropdownLabel}>{label}</Text>
        <Pressable style={compact ? styles.quickDropdownTrigger : styles.dropdownTrigger} onPress={() => setOpen(true)}>
          {selectedOption?.icon ? (
            <View style={[styles.dropdownIconShell, { backgroundColor: `${selectedOption.tint || theme.primary}20` }]}>
              <Ionicons name={selectedOption.icon} size={18} color={selectedOption.tint || theme.primary} />
            </View>
          ) : null}
          <Text
            style={[
              compact ? styles.quickDropdownValue : styles.dropdownValue,
              !selectedOption ? { color: theme.placeholder } : null,
            ]}
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => null}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalOptions} contentContainerStyle={styles.modalOptionsContent} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <Pressable
                    key={`${label}-${option.value || "all"}`}
                    style={[styles.modalOption, active ? styles.modalOptionActive : null]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <View style={[styles.modalOptionIcon, { backgroundColor: `${option.tint || theme.primary}20` }]}>
                      <Ionicons name={option.icon || "chevron-forward"} size={16} color={option.tint || theme.primary} />
                    </View>
                    <Text style={[styles.modalOptionText, active ? styles.modalOptionTextActive : null]}>{option.label}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function MyReportsScreen({ navigation, route }) {
  const { currentUser, reports, currentNotifications, showAlert, theme } = useApp();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [incidentFilter, setIncidentFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const styles = createStyles(theme);
  const handledSelectionRef = useRef(null);
  const REPORTS_PER_PAGE = 5;
  const unreadReportIds = useMemo(
    () =>
      new Set(
        currentNotifications
          .filter((item) => !item.read && item.reportId && (item.type === "feedback" || item.type === "status"))
          .map((item) => item.reportId)
      ),
    [currentNotifications]
  );

  const hasActiveFilters = Boolean(search.trim() || sortBy !== "newest" || statusFilter || incidentFilter || unreadOnly);

  const applyRouteFilters = useCallback(() => {
    setSearch("");
    setSortBy("newest");
    setStatusFilter(route?.params?.statusFilter || "");
    setIncidentFilter("");
    setUnreadOnly(Boolean(route?.params?.unreadOnly));
  }, [route?.params?.statusFilter, route?.params?.unreadOnly]);

  const resetFilters = () => {
    setSearch("");
    setSortBy("newest");
    setStatusFilter("");
    setIncidentFilter("");
    setUnreadOnly(false);
    setPage(1);
  };

  const residentReports = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filtered = reports.filter((report) => {
      if (report.residentId !== currentUser.id) {
        return false;
      }

      if (statusFilter) {
        const comparableStatus =
          statusFilter === "Ongoing" ? getNormalizedResidentReportStatus(report.status) : report.status;

        if (comparableStatus !== statusFilter) {
          return false;
        }
      }

      if (incidentFilter && getNormalizedIncidentType(report.incidentType) !== incidentFilter) {
        return false;
      }

      if (unreadOnly && !unreadReportIds.has(report.id)) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const combined = [report.incidentType, report.description, report.purok, report.location?.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return combined.includes(searchValue);
    });

    if (sortBy === "oldest") {
      return [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    if (sortBy === "type") {
      return [...filtered].sort((a, b) => a.incidentType.localeCompare(b.incidentType));
    }

    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [currentUser.id, incidentFilter, reports, search, sortBy, statusFilter, unreadOnly, unreadReportIds]);

  const totalPages = Math.max(1, Math.ceil(residentReports.length / REPORTS_PER_PAGE));
  const paginatedReports = useMemo(() => {
    const startIndex = (page - 1) * REPORTS_PER_PAGE;
    return residentReports.slice(startIndex, startIndex + REPORTS_PER_PAGE);
  }, [page, residentReports]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, statusFilter, incidentFilter, unreadOnly]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useFocusEffect(
    useCallback(() => {
      applyRouteFilters();

      return () => {
        handledSelectionRef.current = null;
        if (
          route?.params?.selectedReportId ||
          route?.params?.selectionKey ||
          route?.params?.statusFilter !== undefined ||
          route?.params?.unreadOnly !== undefined ||
          route?.params?.scrollTo
        ) {
          navigation.setParams({
            selectedReportId: undefined,
            selectionKey: undefined,
            statusFilter: undefined,
            unreadOnly: undefined,
            scrollTo: undefined,
          });
        }
      };
    }, [
      applyRouteFilters,
      navigation,
      route?.params?.scrollTo,
      route?.params?.selectedReportId,
      route?.params?.selectionKey,
      route?.params?.statusFilter,
      route?.params?.unreadOnly,
    ])
  );

  useEffect(() => {
    const selectedReportId = route?.params?.selectedReportId;
    const selectionKey = route?.params?.selectionKey;
    const scrollTo = route?.params?.scrollTo;

    if (!selectedReportId || !selectionKey || handledSelectionRef.current === selectionKey) {
      return;
    }

    handledSelectionRef.current = selectionKey;
    const selectedReport = reports.find((item) => item.id === selectedReportId);

    if (!selectedReport) {
      showAlert("Report unavailable", "This report has been deleted and can no longer be retrieved.", {
        variant: "info",
      });
      navigation.setParams({
        selectedReportId: undefined,
        selectionKey: undefined,
        scrollTo: undefined,
      });
      return;
    }

    navigation.navigate("ResidentReportDetails", { reportId: selectedReportId, scrollTo });
  }, [navigation, reports, route?.params?.scrollTo, route?.params?.selectedReportId, route?.params?.selectionKey, showAlert]);

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled">
      <AppHeader title="My Reports" variant="toolbar" />

      <View style={styles.searchField}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={22} color={theme.textSoft} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search incident, purok, or details"
              placeholderTextColor={theme.placeholder}
              style={styles.searchInput}
            />
          </View>
          {hasActiveFilters ? (
            <Pressable style={styles.resetButton} onPress={resetFilters}>
              <Ionicons name="close-circle-outline" size={18} color={theme.primary} />
              <Text style={styles.resetButtonText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.filterGrid}>
        <DropdownField
          label="Sort by"
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
          placeholder="Choose sorting"
          styles={styles}
          theme={theme}
          compact
        />
        <DropdownField
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          placeholder="Choose status"
          styles={styles}
          theme={theme}
          compact
        />
        <DropdownField
          label="Incident Type"
          value={incidentFilter}
          onChange={setIncidentFilter}
          options={INCIDENT_FILTER_OPTIONS}
          placeholder="Choose incident type"
          styles={styles}
          theme={theme}
          compact
        />
      </View>

      {residentReports.length ? (
        <>
          {paginatedReports.map((report) => (
          <AdminReportListCard
            key={report.id}
            report={report}
            navigation={navigation}
            showResidentProfileLink={false}
            showResidentName={false}
            onPress={() => navigation.navigate("ResidentReportDetails", { reportId: report.id })}
          />
          ))}

          {totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <Pressable
                style={[styles.paginationButton, page === 1 ? styles.paginationButtonDisabled : null]}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={22} color={page === 1 ? theme.textSoft : theme.text} />
                <Text style={[styles.paginationButtonText, page === 1 ? styles.paginationButtonTextDisabled : null]}>Previous</Text>
              </Pressable>

              <View style={styles.paginationPageBadge}>
                <Text style={styles.paginationPageText}>{page}</Text>
              </View>

              <Pressable
                style={[styles.paginationButton, page === totalPages ? styles.paginationButtonDisabled : null]}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
              >
                <Text style={[styles.paginationButtonText, page === totalPages ? styles.paginationButtonTextDisabled : null]}>Next</Text>
                <Ionicons name="chevron-forward" size={22} color={page === totalPages ? theme.textSoft : theme.text} />
              </Pressable>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No reports found</Text>
          <Text style={styles.emptyText}>Try changing the search terms or clearing the active filters.</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    searchField: {
      width: "100%",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInputWrap: {
      flex: 1,
      minHeight: 62,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.28)",
      backgroundColor: theme.inputBackground,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
    },
    searchInput: {
      flex: 1,
      color: theme.inputText,
      fontSize: 15,
      fontWeight: "600",
      paddingVertical: 0,
    },
    resetButton: {
      minHeight: 62,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    resetButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    filterGrid: {
      flexDirection: "row",
      flexWrap: "nowrap",
      gap: 10,
    },
    dropdownField: {
      flexBasis: "31%",
      flexGrow: 1,
      gap: 8,
    },
    quickDropdownField: {
      minWidth: 0,
      flexGrow: 1,
      flexBasis: "31%",
      gap: 6,
    },
    dropdownLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    quickDropdownLabel: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "800",
    },
    dropdownTrigger: {
      minHeight: 70,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    quickDropdownTrigger: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: "transparent",
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 6,
    },
    dropdownIconShell: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    dropdownValue: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
      textAlign: "left",
    },
    quickDropdownValue: {
      flex: 1,
      color: theme.text,
      fontSize: 12,
      fontWeight: "800",
      textAlign: "left",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.56)",
      justifyContent: "center",
      padding: 20,
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
      maxHeight: "80%",
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
      fontWeight: "800",
    },
    modalClose: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    modalOptions: {
      flexGrow: 0,
    },
    modalOptionsContent: {
      gap: 8,
    },
    modalOption: {
      minHeight: 50,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    modalOptionActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    modalOptionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalOptionText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    modalOptionTextActive: {
      color: theme.primary,
    },
    emptyState: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 6,
      alignItems: "center",
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    emptyText: {
      color: theme.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    paginationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingTop: 6,
      paddingBottom: 8,
    },
    paginationButton: {
      minHeight: 48,
      minWidth: 118,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 14,
    },
    paginationButtonDisabled: {
      opacity: 0.5,
    },
    paginationButtonText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "800",
    },
    paginationButtonTextDisabled: {
      color: theme.textSoft,
    },
    paginationPageBadge: {
      width: 48,
      height: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.28)",
      backgroundColor: "rgba(79, 131, 255, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    paginationPageText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: "900",
    },
  });
}
